"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const inspectionSchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  scheduledDate: z.string().min(1, "Tanggal jadwal wajib diisi"),
});

export async function createInspection(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = inspectionSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  const checklistRaw = formData.get("checklist");
  let checklist: unknown = [];
  try {
    checklist = checklistRaw ? JSON.parse(String(checklistRaw)) : [];
  } catch {
    throw new Error("Format checklist tidak valid");
  }

  const inspection = await prisma.inspection.create({
    data: {
      assetId: data.assetId,
      scheduledDate: new Date(data.scheduledDate),
      checklist: checklist as object,
    },
  });

  revalidatePath("/inspections");
  redirect(`/inspections/${inspection.id}`);
}

export async function cancelInspection(id: string) {
  await prisma.inspection.update({ where: { id }, data: { status: "CANCELLED" } });
  revalidatePath("/inspections");
  revalidatePath(`/inspections/${id}`);
}

const completeSchema = z.object({
  conditionFound: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  findings: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  correctiveAction: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export async function completeInspection(inspectionId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = completeSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  const photoUrlsRaw = String(formData.get("photoUrls") ?? "");
  const photoUrls = photoUrlsRaw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const inspection = await prisma.inspection.update({
    where: { id: inspectionId },
    data: {
      status: "COMPLETED",
      completedDate: new Date(),
      conditionFound: data.conditionFound,
      findings: data.findings,
      correctiveAction: data.correctiveAction,
      photoUrls,
    },
  });

  const asset = await prisma.asset.findUnique({ where: { id: inspection.assetId } });

  if (asset) {
    const updateData: { condition: typeof data.conditionFound; status?: "DAMAGED" | "ACTIVE" } = {
      condition: data.conditionFound,
    };
    if (data.conditionFound === "DAMAGED") {
      updateData.status = "DAMAGED";
    } else if (asset.status === "DAMAGED") {
      updateData.status = "ACTIVE";
    }
    await prisma.asset.update({ where: { id: asset.id }, data: updateData });
  }

  revalidatePath("/inspections");
  revalidatePath(`/inspections/${inspectionId}`);
  if (asset) revalidatePath(`/assets/${asset.id}`);
}

export async function approveInspection(inspectionId: string) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Hanya Admin atau Manager yang dapat menyetujui inspeksi");
  }

  await prisma.inspection.update({ where: { id: inspectionId }, data: { approved: true } });
  revalidatePath(`/inspections/${inspectionId}`);
  revalidatePath("/inspections");
}
