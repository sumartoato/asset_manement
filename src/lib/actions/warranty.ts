"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
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
// Asset Warranty
// ------------------------------------------------------------------

const warrantySchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  provider: z.string().min(1, "Provider wajib diisi"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal berakhir wajib diisi"),
  terms: optionalString,
});

export async function createWarranty(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = warrantySchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  await prisma.warranty.create({
    data: {
      assetId: data.assetId,
      provider: data.provider,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      terms: data.terms,
    },
  });

  revalidatePath("/warranty");
}

export async function deleteWarranty(id: string) {
  await prisma.warranty.delete({ where: { id } });
  revalidatePath("/warranty");
}

// ------------------------------------------------------------------
// Vendor Contract
// ------------------------------------------------------------------

const contractSchema = z.object({
  vendorId: z.string().min(1, "Vendor wajib dipilih"),
  contractNumber: z.string().min(1, "Nomor kontrak wajib diisi"),
  title: z.string().min(1, "Judul kontrak wajib diisi"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal berakhir wajib diisi"),
  slaDetails: optionalString,
  value: optionalNumber,
});

export async function createVendorContract(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = contractSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  await prisma.vendorContract.create({
    data: {
      vendorId: data.vendorId,
      contractNumber: data.contractNumber,
      title: data.title,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      slaDetails: data.slaDetails,
      value: data.value,
    },
  });

  revalidatePath("/warranty");
}

export async function deleteVendorContract(id: string) {
  await prisma.vendorContract.delete({ where: { id } });
  revalidatePath("/warranty");
}
