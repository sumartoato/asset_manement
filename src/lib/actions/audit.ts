"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createOpnameSchema = z.object({
  title: z.string().min(1, "Judul stock opname wajib diisi"),
});

async function generateStockOpnameCode() {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;
  const countThisYear = await prisma.stockOpname.count({
    where: { code: { startsWith: prefix } },
  });
  return `${prefix}${String(countThisYear + 1).padStart(4, "0")}`;
}

export async function createStockOpname(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = createOpnameSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }

  const code = await generateStockOpnameCode();

  // Seed expected items for every currently non-disposed asset.
  const assets = await prisma.asset.findMany({
    where: { status: { not: "DISPOSED" } },
    select: { id: true, locationId: true },
  });

  const opname = await prisma.stockOpname.create({
    data: {
      code,
      title: result.data.title,
      status: "IN_PROGRESS",
      startDate: new Date(),
      items: {
        create: assets.map((a) => ({
          assetId: a.id,
          expectedLocationId: a.locationId,
          found: false,
        })),
      },
    },
  });

  revalidatePath("/audit");
  redirect(`/audit/${opname.id}`);
}

const scanSchema = z.object({
  assetCode: z.string().min(1, "Kode aset wajib diisi"),
  locationId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export async function scanAssetIntoOpname(stockOpnameId: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = scanSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const { assetCode, locationId } = result.data;

  const asset = await prisma.asset.findUnique({ where: { assetCode: assetCode.trim() } });
  if (!asset) {
    // Unknown asset code — nothing in the system to reconcile against, skip silently.
    revalidatePath(`/audit/${stockOpnameId}`);
    return;
  }

  const existingItem = await prisma.stockOpnameItem.findFirst({
    where: { stockOpnameId, assetId: asset.id },
  });

  const foundLocationId = locationId ?? existingItem?.expectedLocationId ?? asset.locationId ?? undefined;

  if (existingItem) {
    await prisma.stockOpnameItem.update({
      where: { id: existingItem.id },
      data: {
        found: true,
        foundLocationId,
        scannedAt: new Date(),
      },
    });
  } else {
    await prisma.stockOpnameItem.create({
      data: {
        stockOpnameId,
        assetId: asset.id,
        expectedLocationId: asset.locationId,
        foundLocationId,
        found: true,
        isUnexpected: true,
        scannedAt: new Date(),
      },
    });
  }

  revalidatePath(`/audit/${stockOpnameId}`);
}

export async function updateStockOpnameItem(stockOpnameId: string, itemId: string, formData: FormData) {
  const found = formData.get("found") === "on";
  const foundLocationIdRaw = formData.get("foundLocationId");
  const notesRaw = formData.get("notes");

  const foundLocationId = typeof foundLocationIdRaw === "string" && foundLocationIdRaw.length > 0 ? foundLocationIdRaw : null;
  const notes = typeof notesRaw === "string" && notesRaw.length > 0 ? notesRaw : null;

  await prisma.stockOpnameItem.update({
    where: { id: itemId },
    data: {
      found,
      foundLocationId,
      notes,
      scannedAt: found ? new Date() : null,
    },
  });

  revalidatePath(`/audit/${stockOpnameId}`);
}

export async function completeStockOpname(id: string) {
  await prisma.stockOpname.update({
    where: { id },
    data: { status: "COMPLETED", endDate: new Date() },
  });
  revalidatePath("/audit");
  revalidatePath(`/audit/${id}`);
  revalidatePath(`/audit/${id}/report`);
}
