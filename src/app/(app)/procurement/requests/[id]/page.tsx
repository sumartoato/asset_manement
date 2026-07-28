import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PageHeader, Card, Badge, Table, Th, Td, LinkButton, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { decidePurchaseRequest } from "@/lib/actions/procurement";
import { ApprovalPanel } from "@/components/procurement/approval-panel";

const STATUS_COLOR: Record<string, "slate" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function PurchaseRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [pr, categories] = await Promise.all([
    prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: true,
        items: true,
        approvals: { orderBy: { createdAt: "desc" }, include: { actor: true } },
        purchaseOrders: { include: { vendor: true } },
      },
    }),
    prisma.assetCategory.findMany(),
  ]);

  if (!pr) notFound();

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const canApprove = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
  const decideWithId = decidePurchaseRequest.bind(null, pr.id);

  const totalEstimate = pr.items.reduce((sum, it) => sum + it.quantity * (it.estimatedUnitCost ? Number(it.estimatedUnitCost) : 0), 0);

  return (
    <div>
      <PageHeader
        title={pr.requestNumber}
        description={pr.title}
        action={
          pr.status === "APPROVED" ? (
            <LinkButton href={`/procurement/orders/new?prId=${pr.id}`}>
              Buat Purchase Order <ArrowRight className="h-4 w-4" />
            </LinkButton>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge color={STATUS_COLOR[pr.status]}>{pr.status}</Badge>
              {pr.neededDate && <span className="text-xs text-slate-400">Dibutuhkan sebelum {formatDate(pr.neededDate)}</span>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
              <div>
                <dt className="text-xs text-slate-400">Pemohon</dt>
                <dd className="text-slate-800 font-medium">{pr.requestedBy.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Tanggal Dibuat</dt>
                <dd className="text-slate-800 font-medium">{formatDate(pr.createdAt)}</dd>
              </div>
            </dl>
            {pr.justification && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Justifikasi</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{pr.justification}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Item Permintaan</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Deskripsi</Th>
                  <Th>Kategori</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Estimasi Harga Satuan</Th>
                  <Th className="text-right">Subtotal</Th>
                </tr>
              </thead>
              <tbody>
                {pr.items.map((it) => (
                  <tr key={it.id}>
                    <Td>{it.description}</Td>
                    <Td>{it.categoryId ? categoryMap.get(it.categoryId) ?? "-" : "-"}</Td>
                    <Td className="text-right">{it.quantity}</Td>
                    <Td className="text-right">{it.estimatedUnitCost ? formatCurrency(it.estimatedUnitCost.toString()) : "-"}</Td>
                    <Td className="text-right">
                      {formatCurrency((it.quantity * (it.estimatedUnitCost ? Number(it.estimatedUnitCost) : 0)).toString())}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className="text-right text-sm font-semibold text-slate-800 mt-3">
              Estimasi Total: {formatCurrency(totalEstimate.toString())}
            </p>
          </Card>

          {pr.purchaseOrders.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Purchase Order Terkait</h3>
              <ul className="divide-y divide-slate-100">
                {pr.purchaseOrders.map((po) => (
                  <li key={po.id} className="py-2">
                    <a href={`/procurement/orders/${po.id}`} className="flex items-center justify-between text-sm">
                      <span className="text-indigo-600 font-medium hover:underline">
                        {po.poNumber} &middot; {po.vendor.name}
                      </span>
                      <Badge color={STATUS_COLOR[po.status]}>{po.status}</Badge>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canApprove && pr.status === "PENDING" && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Approval</h3>
              <ApprovalPanel action={decideWithId} />
            </Card>
          )}

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Riwayat Approval</h3>
            {pr.approvals.length === 0 ? (
              <EmptyState title="Belum ada approval" />
            ) : (
              <ul className="space-y-3">
                {pr.approvals.map((a) => (
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
