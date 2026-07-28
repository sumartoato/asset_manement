import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { PoForm } from "@/components/procurement/po-form";
import { createPurchaseOrder } from "@/lib/actions/procurement";
import type { PoRow } from "@/components/procurement/po-item-rows";

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ prId?: string }>;
}) {
  const { prId } = await searchParams;

  const [categories, vendors, approvedRequests, sourcePr] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.purchaseRequest.findMany({ where: { status: "APPROVED" }, orderBy: { createdAt: "desc" } }),
    prId ? prisma.purchaseRequest.findUnique({ where: { id: prId }, include: { items: true } }) : null,
  ]);

  const defaultRows: PoRow[] | undefined = sourcePr
    ? sourcePr.items.map((it) => ({
        description: it.description,
        categoryId: it.categoryId ?? "",
        quantity: String(it.quantity),
        unitCost: it.estimatedUnitCost ? it.estimatedUnitCost.toString() : "",
      }))
    : undefined;

  return (
    <div>
      <PageHeader
        title="Purchase Order Baru"
        description={sourcePr ? `Dibuat dari ${sourcePr.requestNumber} · ${sourcePr.title}` : "Buat pesanan pembelian ke vendor"}
      />
      <Card className="p-6 max-w-5xl">
        <PoForm
          action={createPurchaseOrder}
          categories={categories}
          vendors={vendors}
          purchaseRequests={approvedRequests.map((pr) => ({ id: pr.id, name: pr.title, requestNumber: pr.requestNumber }))}
          defaultPurchaseRequestId={sourcePr?.id}
          defaultRows={defaultRows}
        />
      </Card>
    </div>
  );
}
