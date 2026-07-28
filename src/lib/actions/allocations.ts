"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? new Date(v) : undefined));

const allocationSchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  type: z.enum(["ASSIGN", "TRANSFER", "BORROW"]),
  targetKind: z.enum(["EMPLOYEE", "DEPARTMENT", "PROJECT", "BRANCH"]),
  employeeId: optionalString,
  departmentId: optionalString,
  projectId: optionalString,
  branchId: optionalString,
  assignedDate: optionalDate,
  dueDate: optionalDate,
  notes: optionalString,
});

export async function createAllocation(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = allocationSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  // Only keep the target field that matches the chosen target kind.
  const employeeId = data.targetKind === "EMPLOYEE" ? data.employeeId : undefined;
  const departmentId = data.targetKind === "DEPARTMENT" ? data.departmentId : undefined;
  const projectId = data.targetKind === "PROJECT" ? data.projectId : undefined;
  const branchId = data.targetKind === "BRANCH" ? data.branchId : undefined;

  if (!employeeId && !departmentId && !projectId && !branchId) {
    throw new Error("Pilih target alokasi (karyawan/departemen/proyek/cabang)");
  }

  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new Error("Aset tidak ditemukan");

  let resolvedDepartmentId: string | undefined;
  if (departmentId) {
    resolvedDepartmentId = departmentId;
  } else if (employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    resolvedDepartmentId = employee?.departmentId ?? undefined;
  }

  const allocation = await prisma.allocation.create({
    data: {
      assetId: data.assetId,
      type: data.type,
      status: "ACTIVE",
      employeeId,
      departmentId,
      projectId,
      branchId,
      assignedDate: data.assignedDate ?? new Date(),
      dueDate: data.dueDate,
      notes: data.notes,
    },
  });

  await prisma.asset.update({
    where: { id: data.assetId },
    data: {
      status: data.type === "BORROW" ? "BORROWED" : "ACTIVE",
      ...(resolvedDepartmentId ? { departmentId: resolvedDepartmentId } : {}),
    },
  });

  await prisma.movementHistory.create({
    data: {
      assetId: data.assetId,
      type: data.type === "TRANSFER" ? "TRANSFER" : "ALLOCATION",
      notes: data.notes ?? `Alokasi ${data.type} dibuat`,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entityType: "Allocation",
      entityId: allocation.id,
      details: `Alokasi ${data.type} untuk aset ${asset.assetCode} dibuat`,
    },
  });

  revalidatePath("/allocations");
  revalidatePath("/assets");
  revalidatePath(`/assets/${data.assetId}`);
  redirect(`/allocations/${allocation.id}`);
}

export async function returnAllocation(id: string) {
  const allocation = await prisma.allocation.findUnique({ where: { id } });
  if (!allocation) throw new Error("Alokasi tidak ditemukan");
  if (allocation.status !== "ACTIVE") {
    throw new Error("Hanya alokasi berstatus ACTIVE yang bisa dikembalikan");
  }

  await prisma.allocation.update({
    where: { id },
    data: { status: "RETURNED", returnedDate: new Date() },
  });

  await prisma.asset.update({
    where: { id: allocation.assetId },
    data: { status: "ACTIVE" },
  });

  await prisma.movementHistory.create({
    data: {
      assetId: allocation.assetId,
      type: "RETURN",
      notes: "Aset dikembalikan dari alokasi",
    },
  });

  revalidatePath("/allocations");
  revalidatePath(`/allocations/${id}`);
  revalidatePath("/assets");
  revalidatePath(`/assets/${allocation.assetId}`);
}
