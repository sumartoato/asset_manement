"use server";

import { prisma } from "@/lib/prisma";
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

const movementSchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  type: z.enum(["CHECK_IN", "CHECK_OUT", "TRANSFER"]),
  toLocationId: optionalString,
  notes: optionalString,
  latitude: optionalNumber,
  longitude: optionalNumber,
});

export async function createMovement(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = movementSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
  if (!asset) throw new Error("Aset tidak ditemukan");

  await prisma.movementHistory.create({
    data: {
      assetId: data.assetId,
      type: data.type,
      toLocationId: data.toLocationId,
      notes: data.notes,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  if (data.type === "CHECK_IN" && data.toLocationId) {
    await prisma.asset.update({
      where: { id: data.assetId },
      data: { locationId: data.toLocationId },
    });
  }

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entityType: "MovementHistory",
      entityId: data.assetId,
      details: `Pergerakan ${data.type} dicatat untuk aset ${asset.assetCode}`,
    },
  });

  revalidatePath("/tracking");
  revalidatePath(`/tracking/${data.assetId}`);
  revalidatePath("/assets");
  revalidatePath(`/assets/${data.assetId}`);
}

export async function scanAssetCode(formData: FormData) {
  const code = (formData.get("code") as string | null)?.trim();
  if (!code) throw new Error("Masukkan kode aset");

  const asset = await prisma.asset.findFirst({
    where: { OR: [{ assetCode: code }, { barcode: code }] },
  });

  if (!asset) {
    throw new Error(`Aset dengan kode "${code}" tidak ditemukan`);
  }

  redirect(`/tracking/${asset.id}`);
}
