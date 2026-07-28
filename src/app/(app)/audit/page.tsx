import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, "green" | "amber" | "slate"> = {
  DRAFT: "slate",
  IN_PROGRESS: "amber",
  COMPLETED: "green",
};

export default async function AuditPage() {
  const opnames = await prisma.stockOpname.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      items: { select: { found: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Asset Inventory Audit (Stock Opname)"
        description="Sesi audit fisik aset dan rekonsiliasi dengan data master"
        action={
          <LinkButton href="/audit/new">
            <Plus className="h-4 w-4" /> Stock Opname Baru
          </LinkButton>
        }
      />

      <Card>
        {opnames.length === 0 ? (
          <EmptyState title="Belum ada sesi stock opname" description="Mulai dengan membuat sesi audit baru." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode</Th>
                <Th>Judul</Th>
                <Th>Status</Th>
                <Th>Tanggal Mulai</Th>
                <Th>Tanggal Selesai</Th>
                <Th className="text-right">Ditemukan / Total</Th>
              </tr>
            </thead>
            <tbody>
              {opnames.map((o) => {
                const total = o.items.length;
                const found = o.items.filter((i) => i.found).length;
                return (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/audit/${o.id}`} className="text-indigo-600 font-medium hover:underline">
                        {o.code}
                      </Link>
                    </Td>
                    <Td>{o.title}</Td>
                    <Td>
                      <Badge color={STATUS_COLOR[o.status]}>{o.status.replace("_", " ")}</Badge>
                    </Td>
                    <Td>{formatDate(o.startDate)}</Td>
                    <Td>{o.endDate ? formatDate(o.endDate) : "-"}</Td>
                    <Td className="text-right">
                      {found} / {total}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {opnames.length} sesi stock opname.</p>
    </div>
  );
}
