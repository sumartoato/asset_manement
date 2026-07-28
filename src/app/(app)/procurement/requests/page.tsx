import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, "slate" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function PurchaseRequestsPage() {
  const requests = await prisma.purchaseRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { requestedBy: true, items: true },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Purchase Requests"
        description="Daftar permintaan pembelian aset"
        action={
          <LinkButton href="/procurement/requests/new">
            <Plus className="h-4 w-4" /> Permintaan Baru
          </LinkButton>
        }
      />

      <Card>
        {requests.length === 0 ? (
          <EmptyState title="Belum ada purchase request" description="Buat permintaan pembelian baru untuk memulai." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nomor</Th>
                <Th>Judul</Th>
                <Th>Pemohon</Th>
                <Th>Status</Th>
                <Th>Kebutuhan</Th>
                <Th className="text-right">Item</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((pr) => (
                <tr key={pr.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/procurement/requests/${pr.id}`} className="text-indigo-600 font-medium hover:underline">
                      {pr.requestNumber}
                    </Link>
                  </Td>
                  <Td>{pr.title}</Td>
                  <Td>{pr.requestedBy.name}</Td>
                  <Td>
                    <Badge color={STATUS_COLOR[pr.status]}>{pr.status}</Badge>
                  </Td>
                  <Td>{pr.neededDate ? formatDate(pr.neededDate) : "-"}</Td>
                  <Td className="text-right">{pr.items.length}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
