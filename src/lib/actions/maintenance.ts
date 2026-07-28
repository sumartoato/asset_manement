"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? Number(v) : undefined));

// ------------------------------------------------------------------
// Maintenance Schedules
// ------------------------------------------------------------------

const scheduleSchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]).default("PREVENTIVE"),
  title: z.string().min(1, "Judul wajib diisi"),
  scheduledDate: z.string().min(1, "Tanggal jadwal wajib diisi"),
  frequencyDays: optionalNumber,
});

export async function createMaintenanceSchedule(formData: FormData) {
  const session = await auth();
  const raw = Object.fromEntries(formData.entries());
  const result = scheduleSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      assetId: data.assetId,
      type: data.type,
      title: data.title,
      scheduledDate: new Date(data.scheduledDate),
      frequencyDays: data.frequencyDays,
      createdById: session?.user?.id,
    },
  });

  revalidatePath("/maintenance");
  redirect(`/maintenance?tab=schedules`);
}

export async function cancelMaintenanceSchedule(id: string) {
  await prisma.maintenanceSchedule.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/maintenance");
}

// ------------------------------------------------------------------
// Work Orders
// ------------------------------------------------------------------

const workOrderSchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  maintenanceScheduleId: optionalString,
  type: z.enum(["PREVENTIVE", "CORRECTIVE"]).default("CORRECTIVE"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  description: z.string().min(1, "Deskripsi wajib diisi"),
  assignedToId: optionalString,
  vendorId: optionalString,
});

async function nextWoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;
  const count = await prisma.workOrder.count({ where: { woNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function createWorkOrder(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = workOrderSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  const woNumber = await nextWoNumber();

  const workOrder = await prisma.workOrder.create({
    data: {
      woNumber,
      assetId: data.assetId,
      maintenanceScheduleId: data.maintenanceScheduleId,
      type: data.type,
      priority: data.priority,
      description: data.description,
      assignedToId: data.assignedToId,
      vendorId: data.vendorId,
    },
  });

  revalidatePath("/maintenance");
  redirect(`/maintenance/work-orders/${workOrder.id}`);
}

export async function updateChecklist(workOrderId: string, formData: FormData) {
  const checklistRaw = formData.get("checklist");
  let checklist: unknown = [];
  try {
    checklist = checklistRaw ? JSON.parse(String(checklistRaw)) : [];
  } catch {
    throw new Error("Format checklist tidak valid");
  }

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { checklist: checklist as object },
  });

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
}

export async function addSparePartUsage(workOrderId: string, formData: FormData) {
  const partName = String(formData.get("partName") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const unitCost = Number(formData.get("unitCost") ?? 0);

  if (!partName) throw new Error("Nama part wajib diisi");
  if (!quantity || quantity < 1) throw new Error("Kuantitas tidak valid");

  await prisma.sparePartUsage.create({
    data: { workOrderId, partName, quantity, unitCost },
  });

  await recomputeWorkOrderCosts(workOrderId);
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
}

export async function deleteSparePartUsage(workOrderId: string, id: string) {
  await prisma.sparePartUsage.delete({ where: { id } });
  await recomputeWorkOrderCosts(workOrderId);
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
}

async function recomputeWorkOrderCosts(workOrderId: string) {
  const [parts, workOrder] = await Promise.all([
    prisma.sparePartUsage.findMany({ where: { workOrderId } }),
    prisma.workOrder.findUnique({ where: { id: workOrderId } }),
  ]);
  if (!workOrder) return;

  const partsCost = parts.reduce((sum, p) => sum + p.quantity * Number(p.unitCost), 0);
  const totalCost = partsCost + Number(workOrder.laborCost);

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { partsCost, totalCost },
  });
}

export async function updateLaborCost(workOrderId: string, formData: FormData) {
  const laborCost = Number(formData.get("laborCost") ?? 0);
  if (laborCost < 0) throw new Error("Biaya tenaga kerja tidak valid");

  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) throw new Error("Work order tidak ditemukan");

  const totalCost = laborCost + Number(workOrder.partsCost);

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { laborCost, totalCost },
  });

  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
}

export async function startWorkOrder(workOrderId: string) {
  const workOrder = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: "IN_PROGRESS", startDate: new Date() },
  });

  await prisma.asset.update({
    where: { id: workOrder.assetId },
    data: { status: "UNDER_MAINTENANCE" },
  });

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath(`/assets/${workOrder.assetId}`);
}

export async function completeWorkOrder(workOrderId: string) {
  const workOrder = await prisma.workOrder.findUnique({ where: { id: workOrderId } });
  if (!workOrder) throw new Error("Work order tidak ditemukan");

  const totalCost = Number(workOrder.laborCost) + Number(workOrder.partsCost);

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: "COMPLETED", completedDate: new Date(), totalCost },
  });

  await prisma.asset.update({
    where: { id: workOrder.assetId },
    data: { status: "ACTIVE" },
  });

  if (workOrder.maintenanceScheduleId) {
    await prisma.maintenanceSchedule.update({
      where: { id: workOrder.maintenanceScheduleId },
      data: { status: "COMPLETED" },
    });
  }

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
  revalidatePath(`/assets/${workOrder.assetId}`);
}

export async function cancelWorkOrder(workOrderId: string) {
  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/work-orders/${workOrderId}`);
}
