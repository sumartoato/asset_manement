import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function GoodsReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const gr = await prisma.goodsReceipt.findUnique({
    where: { id },
    include: {
      purchaseOrder: { include: { vendor: true } },
      items: { include: { purchaseOrderItem: true, asset: true } },
    },
  });

  if (!gr) notFound();

  return (
    <div>
      <PageHeader
        title={gr.grNumber}
        description={`PO ${gr.purchaseOrder.poNumber} · ${gr.purchaseOrder.vendor.name}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Item Diterima</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Deskripsi</Th>
                  <Th className="text-right">Qty Diterima</Th>
                  <Th>Aset Terdaftar</Th>
                </tr>
              </thead>
              <tbody>
                {gr.items.map((it) => (
                  <tr key={it.id}>
                    <Td>{it.purchaseOrderItem.description}</Td>
                    <Td className="text-right">{it.quantityReceived}</Td>
                    <Td>
                      {it.asset ? (
                        <Link href={`/assets/${it.asset.id}`} className="text-indigo-600 hover:underline">
                          {it.asset.assetCode} &middot; {it.asset.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Informasi Penerimaan</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-400">Purchase Order</dt>
                <dd>
                  <Link href={`/procurement/orders/${gr.purchaseOrder.id}`} className="text-indigo-600 font-medium hover:underline">
                    {gr.purchaseOrder.poNumber}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Vendor</dt>
                <dd className="text-slate-800 font-medium">{gr.purchaseOrder.vendor.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Tanggal Diterima</dt>
                <dd className="text-slate-800 font-medium">{formatDate(gr.receivedDate)}</dd>
              </div>
              {gr.notes && (
                <div>
                  <dt className="text-xs text-slate-400">No. Invoice / Catatan</dt>
                  <dd className="text-slate-800 font-medium">{gr.notes}</dd>
                </div>
              )}
              {gr.invoiceFileUrl && (
                <div>
                  <dt className="text-xs text-slate-400">File Invoice</dt>
                  <dd>
                    <a href={gr.invoiceFileUrl} target="_blank" className="text-indigo-600 hover:underline">
                      Lihat file
                    </a>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-slate-400">Aset Terdaftar</dt>
                <dd>
                  <Badge color="green">{gr.items.filter((it) => it.asset).length} aset</Badge>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
