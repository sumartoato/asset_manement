import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { GrForm } from "@/components/procurement/gr-form";
import { createGoodsReceipt } from "@/lib/actions/procurement";

export default async function NewGoodsReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ poId?: string }>;
}) {
  const { poId } = await searchParams;

  const [categories, purchaseOrdersRaw] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.purchaseOrder.findMany({
      where: { status: "APPROVED" },
      include: { vendor: true, items: { include: { goodsReceiptItems: true } } },
      orderBy: { orderDate: "desc" },
    }),
  ]);

  const purchaseOrders = purchaseOrdersRaw.map((po) => ({
    id: po.id,
    poNumber: po.poNumber,
    vendorName: po.vendor.name,
    items: po.items.map((it) => ({
      id: it.id,
      description: it.description,
      quantity: it.quantity,
      unitCost: Number(it.unitCost),
      categoryId: it.categoryId,
      remaining: it.quantity - it.goodsReceiptItems.reduce((s, g) => s + g.quantityReceived, 0),
    })),
  }));

  return (
    <div>
      <PageHeader title="Penerimaan Barang Baru" description="Catat penerimaan barang dari purchase order yang disetujui" />
      <Card className="p-6 max-w-5xl">
        <GrForm
          action={createGoodsReceipt}
          categories={categories}
          purchaseOrders={purchaseOrders}
          defaultPurchaseOrderId={poId}
        />
      </Card>
    </div>
  );
}
