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

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? Number(v) : undefined));

const assetSchema = z.object({
  name: z.string().min(1, "Nama aset wajib diisi"),
  assetCode: z.string().min(1, "Kode aset wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  typeId: optionalString,
  brandId: optionalString,
  model: optionalString,
  serialNumber: optionalString,
  specification: optionalString,
  photoUrl: optionalString,
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"]).default("GOOD"),
  status: z.enum(["ACTIVE", "IN_STORAGE", "UNDER_MAINTENANCE", "DAMAGED", "LOST", "DISPOSED", "BORROWED"]).default("ACTIVE"),
  vendorId: optionalString,
  purchaseDate: optionalDate,
  purchaseCost: optionalNumber,
  invoiceNumber: optionalString,
  warrantyStart: optionalDate,
  warrantyEnd: optionalDate,
  warrantyNotes: optionalString,
  depreciationMethod: z.enum(["STRAIGHT_LINE", "DECLINING_BALANCE"]).default("STRAIGHT_LINE"),
  usefulLifeYears: optionalNumber,
  salvageValue: optionalNumber,
  locationId: optionalString,
  departmentId: optionalString,
});

function parseAssetForm(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = assetSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  return result.data;
}

export async function createAsset(formData: FormData) {
  const data = parseAssetForm(formData);

  const asset = await prisma.asset.create({
    data: {
      ...data,
      barcode: data.assetCode,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "CREATE",
      entityType: "Asset",
      entityId: asset.id,
      details: `Aset ${asset.name} (${asset.assetCode}) dibuat`,
    },
  });

  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(id: string, formData: FormData) {
  const data = parseAssetForm(formData);

  await prisma.asset.update({
    where: { id },
    data,
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
}

export async function deleteAsset(id: string) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/assets");
  redirect("/assets");
}

export async function addAssetDocument(assetId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const fileUrl = formData.get("fileUrl") as string;
  const type = (formData.get("type") as string) || "OTHER";

  if (!name || !fileUrl) throw new Error("Nama dan URL dokumen wajib diisi");

  await prisma.assetDocument.create({
    data: { assetId, name, fileUrl, type },
  });

  revalidatePath(`/assets/${assetId}`);
}

export async function deleteAssetDocument(assetId: string, id: string) {
  await prisma.assetDocument.delete({ where: { id } });
  revalidatePath(`/assets/${assetId}`);
}
