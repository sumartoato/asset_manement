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

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? new Date(v) : undefined));

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Anda harus login untuk melakukan aksi ini");
  return session.user;
}

function assertApprover(role?: string) {
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Hanya Admin/Manager yang dapat melakukan approval");
  }
}

function nextNumber(prefix: string, existingCount: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(existingCount + 1).padStart(4, "0")}`;
}

function parseItemsJson<T>(itemsJson: string, schema: z.ZodType<T>): T[] {
  let raw: unknown;
  try {
    raw = JSON.parse(itemsJson);
  } catch {
    throw new Error("Data item tidak valid");
  }
  const result = z.array(schema).safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  return result.data;
}

// ------------------------------------------------------------------
// Purchase Request
// ------------------------------------------------------------------

const prItemSchema = z.object({
  description: z.string().min(1, "Deskripsi item wajib diisi"),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  quantity: z.coerce.number().int().min(1, "Kuantitas minimal 1"),
  estimatedUnitCost: z
    .union([z.coerce.number(), z.literal(""), z.undefined()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
});

const prSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  justification: optionalString,
  neededDate: optionalDate,
  itemsJson: z.string().min(1),
});

export async function createPurchaseRequest(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = prSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const items = parseItemsJson(parsed.data.itemsJson, prItemSchema);
  if (items.length === 0) throw new Error("Minimal 1 item permintaan");

  const count = await prisma.purchaseRequest.count();
  const requestNumber = nextNumber("PR", count);

  const pr = await prisma.purchaseRequest.create({
    data: {
      requestNumber,
      requestedById: user.id,
      title: parsed.data.title,
      justification: parsed.data.justification,
      neededDate: parsed.data.neededDate,
      status: "PENDING",
      items: {
        create: items.map((it) => ({
          description: it.description,
          categoryId: it.categoryId,
          quantity: it.quantity,
          estimatedUnitCost: it.estimatedUnitCost,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entityType: "PurchaseRequest",
      entityId: pr.id,
      details: `Purchase Request ${pr.requestNumber} dibuat`,
    },
  });

  revalidatePath("/procurement/requests");
  revalidatePath("/procurement");
  redirect(`/procurement/requests/${pr.id}`);
}

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comments: optionalString,
});

export async function decidePurchaseRequest(id: string, formData: FormData) {
  const user = await requireUser();
  assertApprover(user.role);

  const raw = Object.fromEntries(formData.entries());
  const parsed = decisionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
  if (!pr) throw new Error("Purchase request tidak ditemukan");

  await prisma.$transaction([
    prisma.approval.create({
      data: {
        entityType: "PURCHASE_REQUEST",
        status: parsed.data.decision,
        actorId: user.id,
        comments: parsed.data.comments,
        decidedAt: new Date(),
        purchaseRequestId: id,
      },
    }),
    prisma.purchaseRequest.update({
      where: { id },
      data: { status: parsed.data.decision },
    }),
  ]);

  revalidatePath(`/procurement/requests/${id}`);
  revalidatePath("/procurement/requests");
  revalidatePath("/procurement");
}

// ------------------------------------------------------------------
// Purchase Order
// ------------------------------------------------------------------

const poItemSchema = z.object({
  description: z.string().min(1, "Deskripsi item wajib diisi"),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  quantity: z.coerce.number().int().min(1, "Kuantitas minimal 1"),
  unitCost: z.coerce.number().min(0, "Harga satuan wajib diisi"),
});

const poSchema = z.object({
  purchaseRequestId: optionalString,
  vendorId: z.string().min(1, "Vendor wajib dipilih"),
  expectedDate: optionalDate,
  notes: optionalString,
  itemsJson: z.string().min(1),
});

export async function createPurchaseOrder(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = poSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const items = parseItemsJson(parsed.data.itemsJson, poItemSchema);
  if (items.length === 0) throw new Error("Minimal 1 item pesanan");

  const totalAmount = items.reduce((sum, it) => sum + it.quantity * it.unitCost, 0);

  const count = await prisma.purchaseOrder.count();
  const poNumber = nextNumber("PO", count);

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      purchaseRequestId: parsed.data.purchaseRequestId,
      vendorId: parsed.data.vendorId,
      expectedDate: parsed.data.expectedDate,
      notes: parsed.data.notes,
      status: "PENDING",
      totalAmount,
      items: {
        create: items.map((it) => ({
          description: it.description,
          categoryId: it.categoryId,
          quantity: it.quantity,
          unitCost: it.unitCost,
        })),
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entityType: "PurchaseOrder",
      entityId: po.id,
      details: `Purchase Order ${po.poNumber} dibuat`,
    },
  });

  revalidatePath("/procurement/orders");
  revalidatePath("/procurement");
  redirect(`/procurement/orders/${po.id}`);
}

export async function decidePurchaseOrder(id: string, formData: FormData) {
  const user = await requireUser();
  assertApprover(user.role);

  const raw = Object.fromEntries(formData.entries());
  const parsed = decisionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase order tidak ditemukan");

  await prisma.$transaction([
    prisma.approval.create({
      data: {
        entityType: "PURCHASE_ORDER",
        status: parsed.data.decision,
        actorId: user.id,
        comments: parsed.data.comments,
        decidedAt: new Date(),
        purchaseOrderId: id,
      },
    }),
    prisma.purchaseOrder.update({
      where: { id },
      data: { status: parsed.data.decision },
    }),
  ]);

  revalidatePath(`/procurement/orders/${id}`);
  revalidatePath("/procurement/orders");
  revalidatePath("/procurement");
}

// ------------------------------------------------------------------
// Goods Receipt
// ------------------------------------------------------------------

const grItemSchema = z.object({
  poItemId: z.string().min(1),
  quantityReceived: z.coerce.number().int().min(0),
  registerAsset: z.boolean().optional().default(false),
  assetName: z.string().optional(),
  assetCode: z.string().optional(),
  categoryId: z.string().optional(),
  serialNumber: z.string().optional(),
});

const grSchema = z.object({
  purchaseOrderId: z.string().min(1, "Purchase order wajib dipilih"),
  receivedDate: optionalDate,
  invoiceFileUrl: optionalString,
  notes: optionalString,
  itemsJson: z.string().min(1),
});

export async function createGoodsReceipt(formData: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = grSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const items = parseItemsJson(parsed.data.itemsJson, grItemSchema);
  const received = items.filter((it) => it.quantityReceived > 0);
  if (received.length === 0) throw new Error("Minimal 1 item dengan kuantitas diterima > 0");

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: parsed.data.purchaseOrderId },
    include: { items: true },
  });
  if (!po) throw new Error("Purchase order tidak ditemukan");

  for (const it of received) {
    if (it.registerAsset) {
      if (!it.assetName || !it.assetCode) {
        throw new Error("Nama dan kode aset wajib diisi untuk item yang didaftarkan sebagai aset");
      }
    }
  }

  const receivedDate = parsed.data.receivedDate ?? new Date();
  const count = await prisma.goodsReceipt.count();
  const grNumber = nextNumber("GR", count);

  const grId = await prisma.$transaction(async (tx) => {
    const gr = await tx.goodsReceipt.create({
      data: {
        grNumber,
        purchaseOrderId: po.id,
        receivedDate,
        invoiceFileUrl: parsed.data.invoiceFileUrl,
        notes: parsed.data.notes,
      },
    });

    for (const it of received) {
      const poItem = po.items.find((p) => p.id === it.poItemId);
      if (!poItem) continue;

      let assetId: string | undefined;
      if (it.registerAsset) {
        const categoryId = it.categoryId || poItem.categoryId;
        if (!categoryId) {
          throw new Error(`Kategori wajib dipilih untuk pendaftaran aset pada item "${poItem.description}"`);
        }

        const asset = await tx.asset.create({
          data: {
            name: it.assetName!,
            assetCode: it.assetCode!,
            barcode: it.assetCode!,
            categoryId,
            serialNumber: it.serialNumber && it.serialNumber.length > 0 ? it.serialNumber : undefined,
            status: "ACTIVE",
            vendorId: po.vendorId,
            purchaseCost: poItem.unitCost,
            purchaseDate: receivedDate,
            invoiceNumber: parsed.data.notes,
            createdById: user.id,
          },
        });
        assetId = asset.id;
      }

      await tx.goodsReceiptItem.create({
        data: {
          goodsReceiptId: gr.id,
          purchaseOrderItemId: poItem.id,
          quantityReceived: it.quantityReceived,
          assetId,
        },
      });
    }

    return gr.id;
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "CREATE",
      entityType: "GoodsReceipt",
      entityId: grId,
      details: `Goods Receipt ${grNumber} dibuat untuk PO ${po.poNumber}`,
    },
  });

  revalidatePath("/procurement/receipts");
  revalidatePath(`/procurement/orders/${po.id}`);
  revalidatePath("/assets");
  revalidatePath("/procurement");
  redirect(`/procurement/receipts/${grId}`);
}
