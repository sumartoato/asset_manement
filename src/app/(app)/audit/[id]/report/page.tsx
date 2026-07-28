import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, LinkButton, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/audit/print-button";

const STATUS_COLOR: Record<string, "green" | "amber" | "slate"> = {
  DRAFT: "slate",
  IN_PROGRESS: "amber",
  COMPLETED: "green",
};

export default async function StockOpnameReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const opname = await prisma.stockOpname.findUnique({
    where: { id },
    include: {
      items: {
        include: { asset: { include: { category: true } } },
        orderBy: [{ isUnexpected: "asc" }, { found: "asc" }],
      },
    },
  });

  if (!opname) notFound();

  const locations = await prisma.location.findMany({ orderBy: { name: "asc" } });
  const locationMap = new Map(locations.map((l) => [l.id, l.name]));

  const found = opname.items.filter((i) => i.found && !i.isUnexpected).length;
  const missing = opname.items.filter((i) => !i.found && !i.isUnexpected).length;
  const unexpected = opname.items.filter((i) => i.isUnexpected).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap print:hidden">
        <LinkButton href={`/audit/${opname.id}`} variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </LinkButton>
        <PrintButton />
      </div>

      <PageHeader
        title={`Laporan Audit — ${opname.title}`}
        description={`${opname.code} · Mulai ${formatDate(opname.startDate)}${opname.endDate ? ` · Selesai ${formatDate(opname.endDate)}` : ""}`}
        action={<Badge color={STATUS_COLOR[opname.status]}>{opname.status.replace("_", " ")}</Badge>}
      />

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-emerald-600">{found}</p>
            <p className="text-xs text-slate-500">Found</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-red-600">{missing}</p>
            <p className="text-xs text-slate-500">Missing</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-amber-600">{unexpected}</p>
            <p className="text-xs text-slate-500">Unexpected</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-slate-900">Rincian Rekonsiliasi</h3>
        </div>
        {opname.items.length === 0 ? (
          <EmptyState title="Tidak ada item dalam sesi ini" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama</Th>
                <Th>Kategori</Th>
                <Th>Lokasi Diharapkan</Th>
                <Th>Lokasi Ditemukan</Th>
                <Th>Waktu Scan</Th>
                <Th>Catatan</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {opname.items.map((item) => (
                <tr key={item.id}>
                  <Td>{item.asset?.assetCode ?? "-"}</Td>
                  <Td>{item.asset?.name ?? "-"}</Td>
                  <Td>{item.asset?.category?.name ?? "-"}</Td>
                  <Td>{item.expectedLocationId ? (locationMap.get(item.expectedLocationId) ?? "-") : "-"}</Td>
                  <Td>{item.foundLocationId ? (locationMap.get(item.foundLocationId) ?? "-") : "-"}</Td>
                  <Td>{item.scannedAt ? formatDate(item.scannedAt) : "-"}</Td>
                  <Td>{item.notes ?? "-"}</Td>
                  <Td>
                    {item.isUnexpected ? (
                      <Badge color="amber">Unexpected</Badge>
                    ) : item.found ? (
                      <Badge color="green">Found</Badge>
                    ) : (
                      <Badge color="red">Missing</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Total {opname.items.length} item dalam laporan ini.</p>
    </div>
  );
}
