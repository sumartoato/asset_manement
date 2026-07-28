import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PageHeader, Card, Badge, Table, Th, Td, LinkButton, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { decidePurchaseOrder } from "@/lib/actions/procurement";
import { ApprovalPanel } from "@/components/procurement/approval-panel";

const STATUS_COLOR: Record<string, "slate" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [po, categories] = await Promise.all([
    prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseRequest: true,
        items: true,
        approvals: { orderBy: { createdAt: "desc" }, include: { actor: true } },
        goodsReceipts: { orderBy: { receivedDate: "desc" }, include: { items: true } },
      },
    }),
    prisma.assetCategory.findMany(),
  ]);

  if (!po) notFound();

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const canApprove = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
  const decideWithId = decidePurchaseOrder.bind(null, po.id);

  return (
    <div>
      <PageHeader
        title={po.poNumber}
        description={`Vendor: ${po.vendor.name}`}
        action={
          po.status === "APPROVED" ? (
            <LinkButton href={`/procurement/receipts/new?poId=${po.id}`}>
              <PackageCheck className="h-4 w-4" /> Terima Barang
            </LinkButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge color={STATUS_COLOR[po.status]}>{po.status}</Badge>
              {po.purchaseRequest && (
                <a href={`/procurement/requests/${po.purchaseRequest.id}`} className="text-xs text-indigo-600 hover:underline">
                  Dari {po.purchaseRequest.requestNumber}
                </a>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
              <div>
                <dt className="text-xs text-slate-400">Vendor</dt>
                <dd className="text-slate-800 font-medium">{po.vendor.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Kontak Vendor</dt>
                <dd className="text-slate-800 font-medium">{po.vendor.contactName ?? po.vendor.phone ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Tanggal Order</dt>
                <dd className="text-slate-800 font-medium">{formatDate(po.orderDate)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Tanggal Diharapkan Tiba</dt>
                <dd className="text-slate-800 font-medium">{po.expectedDate ? formatDate(po.expectedDate) : "-"}</dd>
              </div>
            </dl>
            {po.notes && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Catatan</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Item Pesanan</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Deskripsi</Th>
                  <Th>Kategori</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Harga Satuan</Th>
                  <Th className="text-right">Subtotal</Th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((it) => (
                  <tr key={it.id}>
                    <Td>{it.description}</Td>
                    <Td>{it.categoryId ? categoryMap.get(it.categoryId) ?? "-" : "-"}</Td>
                    <Td className="text-right">{it.quantity}</Td>
                    <Td className="text-right">{formatCurrency(it.unitCost.toString())}</Td>
                    <Td className="text-right">{formatCurrency((it.quantity * Number(it.unitCost)).toString())}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="text-right text-sm font-semibold text-slate-800 mt-3">
              Total: {formatCurrency(po.totalAmount.toString())}
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Goods Receipt Terkait</h3>
            {po.goodsReceipts.length === 0 ? (
              <EmptyState title="Belum ada penerimaan barang" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {po.goodsReceipts.map((gr) => (
                  <li key={gr.id} className="py-2">
                    <a href={`/procurement/receipts/${gr.id}`} className="flex items-center justify-between text-sm">
                      <span className="text-indigo-600 font-medium hover:underline">{gr.grNumber}</span>
                      <span className="text-xs text-slate-400">
                        {gr.items.length} item &middot; {formatDate(gr.receivedDate)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {canApprove && po.status === "PENDING" && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Approval</h3>
              <ApprovalPanel action={decideWithId} />
            </Card>
          )}

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Riwayat Approval</h3>
            {po.approvals.length === 0 ? (
              <EmptyState title="Belum ada approval" />
            ) : (
              <ul className="space-y-3">
                {po.approvals.map((a) => (
                  <li key={a.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800">{a.actor?.name ?? "-"}</span>
                      <Badge color={STATUS_COLOR[a.status]}>{a.status}</Badge>
                    </div>
                    {a.comments && <p className="text-xs text-slate-500 mt-0.5">{a.comments}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{a.decidedAt ? formatDate(a.decidedAt) : formatDate(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
