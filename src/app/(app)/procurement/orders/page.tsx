import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, "slate" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function PurchaseOrdersPage() {
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: true },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Daftar pesanan pembelian ke vendor"
        action={
          <LinkButton href="/procurement/orders/new">
            <Plus className="h-4 w-4" /> PO Baru
          </LinkButton>
        }
      />

      <Card>
        {orders.length === 0 ? (
          <EmptyState title="Belum ada purchase order" description="Buat purchase order baru untuk memulai." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Vendor</Th>
                <Th>Status</Th>
                <Th>Tanggal Order</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/procurement/orders/${po.id}`} className="text-indigo-600 font-medium hover:underline">
                      {po.poNumber}
                    </Link>
                  </Td>
                  <Td>{po.vendor.name}</Td>
                  <Td>
                    <Badge color={STATUS_COLOR[po.status]}>{po.status}</Badge>
                  </Td>
                  <Td>{formatDate(po.orderDate)}</Td>
                  <Td className="text-right">{formatCurrency(po.totalAmount.toString())}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
