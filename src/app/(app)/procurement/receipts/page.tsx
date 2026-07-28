import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function GoodsReceiptsPage() {
  const receipts = await prisma.goodsReceipt.findMany({
    orderBy: { receivedDate: "desc" },
    include: { purchaseOrder: true, items: true },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Goods Receipts"
        description="Daftar penerimaan barang dari vendor"
        action={
          <LinkButton href="/procurement/receipts/new">
            <Plus className="h-4 w-4" /> Penerimaan Baru
          </LinkButton>
        }
      />

      <Card>
        {receipts.length === 0 ? (
          <EmptyState title="Belum ada goods receipt" description="Terima barang dari purchase order yang sudah disetujui." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nomor GR</Th>
                <Th>Nomor PO</Th>
                <Th>Tanggal Diterima</Th>
                <Th className="text-right">Jumlah Item</Th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((gr) => (
                <tr key={gr.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/procurement/receipts/${gr.id}`} className="text-indigo-600 font-medium hover:underline">
                      {gr.grNumber}
                    </Link>
                  </Td>
                  <Td>{gr.purchaseOrder.poNumber}</Td>
                  <Td>{formatDate(gr.receivedDate)}</Td>
                  <Td className="text-right">{gr.items.length}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
