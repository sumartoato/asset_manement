"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { toNumber } from "@/lib/format";
import { z } from "zod";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? Number(v) : undefined));

const disposalSchema = z.object({
  assetId: z.string().min(1, "Aset wajib dipilih"),
  method: z.enum(["RETIREMENT", "SALE", "DONATION", "SCRAP"]),
  reason: optionalString,
  disposalDate: z
    .string()
    .min(1, "Tanggal disposal wajib diisi")
    .transform((v) => new Date(v)),
  saleAmount: optionalNumber,
  documentUrl: optionalString,
});

/** Book value = purchaseCost minus accumulated DepreciationEntry amounts (0 if no purchase cost). */
async function computeCurrentBookValue(assetId: string) {
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { purchaseCost: true },
  });
  const purchaseCost = toNumber(asset?.purchaseCost);

  const agg = await prisma.depreciationEntry.aggregate({
    where: { assetId },
    _sum: { amount: true },
  });
  const accumulated = toNumber(agg._sum.amount);

  return Math.max(purchaseCost - accumulated, 0);
}

export async function createDisposal(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = disposalSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  const existing = await prisma.disposal.findUnique({ where: { assetId: data.assetId } });
  if (existing) {
    throw new Error("Aset ini sudah memiliki pengajuan disposal");
  }

  const bookValueAtDisposal = await computeCurrentBookValue(data.assetId);
  const saleAmount = data.saleAmount ?? 0;
  const gainLoss = saleAmount - bookValueAtDisposal;

  const session = await auth();

  const disposal = await prisma.disposal.create({
    data: {
      assetId: data.assetId,
      method: data.method,
      reason: data.reason,
      disposalDate: data.disposalDate,
      saleAmount: data.saleAmount,
      bookValueAtDisposal,
      gainLoss,
      documentUrl: data.documentUrl,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id,
      action: "CREATE",
      entityType: "Disposal",
      entityId: disposal.id,
      details: `Pengajuan disposal aset dibuat (metode ${disposal.method})`,
    },
  });

  revalidatePath("/disposal");
  redirect(`/disposal/${disposal.id}`);
}

const APPROVER_ROLES = ["ADMIN", "MANAGER"];

export async function approveDisposal(id: string) {
  const session = await auth();
  if (!session?.user || !APPROVER_ROLES.includes(session.user.role ?? "")) {
    throw new Error("Anda tidak memiliki izin untuk menyetujui disposal ini");
  }

  const disposal = await prisma.disposal.findUnique({ where: { id } });
  if (!disposal) throw new Error("Disposal tidak ditemukan");
  if (disposal.status !== "PENDING") {
    throw new Error("Hanya disposal berstatus PENDING yang dapat diproses");
  }

  await prisma.$transaction([
    prisma.disposal.update({
      where: { id },
      data: { status: "APPROVED" },
    }),
    prisma.asset.update({
      where: { id: disposal.assetId },
      data: { status: "DISPOSED" },
    }),
    prisma.approval.create({
      data: {
        entityType: "DISPOSAL",
        disposalId: id,
        status: "APPROVED",
        actorId: session.user.id,
        decidedAt: new Date(),
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "APPROVE",
      entityType: "Disposal",
      entityId: id,
      details: "Disposal disetujui, status aset diubah menjadi DISPOSED",
    },
  });

  revalidatePath("/disposal");
  revalidatePath(`/disposal/${id}`);
  revalidatePath("/assets");
}

export async function rejectDisposal(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !APPROVER_ROLES.includes(session.user.role ?? "")) {
    throw new Error("Anda tidak memiliki izin untuk menolak disposal ini");
  }

  const disposal = await prisma.disposal.findUnique({ where: { id } });
  if (!disposal) throw new Error("Disposal tidak ditemukan");
  if (disposal.status !== "PENDING") {
    throw new Error("Hanya disposal berstatus PENDING yang dapat diproses");
  }

  const comments = (formData.get("comments") as string) || undefined;

  await prisma.$transaction([
    prisma.disposal.update({
      where: { id },
      data: { status: "REJECTED" },
    }),
    prisma.approval.create({
      data: {
        entityType: "DISPOSAL",
        disposalId: id,
        status: "REJECTED",
        actorId: session.user.id,
        comments,
        decidedAt: new Date(),
      },
    }),
  ]);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "REJECT",
      entityType: "Disposal",
      entityId: id,
      details: comments ? `Disposal ditolak: ${comments}` : "Disposal ditolak",
    },
  });

  revalidatePath("/disposal");
  revalidatePath(`/disposal/${id}`);
}
