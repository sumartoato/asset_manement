import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard, Table, Th, Td, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";

const STATUS_COLOR: Record<string, "green" | "amber" | "slate" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function DisposalReportPage() {
  const disposals = await prisma.disposal.findMany({
    include: { asset: { include: { category: true } } },
    orderBy: { disposalDate: "desc" },
    take: 500,
  });

  const totalGainLoss = disposals.reduce((s, d) => s + toNumber(d.gainLoss), 0);
  const totalSaleAmount = disposals.reduce((s, d) => s + toNumber(d.saleAmount), 0);

  return (
    <div>
      <PageHeader title="Disposal Report" description="Daftar aset yang telah dihapuskan beserta hasil penjualan dan gain/loss" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Aset Dihapuskan" value={disposals.length} icon={Trash2} accent="slate" />
        <StatCard label="Total Nilai Penjualan" value={formatCurrency(totalSaleAmount)} icon={TrendingUp} accent="blue" />
        <StatCard
          label="Total Gain / (Loss)"
          value={formatCurrency(totalGainLoss)}
          icon={totalGainLoss >= 0 ? TrendingUp : TrendingDown}
          accent={totalGainLoss >= 0 ? "green" : "red"}
        />
      </div>

      <Card>
        {disposals.length === 0 ? (
          <EmptyState title="Belum ada data disposal" description="Data akan muncul setelah modul Disposal mencatat penghapusan aset." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama Aset</Th>
                <Th>Kategori</Th>
                <Th>Metode</Th>
                <Th>Status</Th>
                <Th>Tanggal Disposal</Th>
                <Th className="text-right">Nilai Buku</Th>
                <Th className="text-right">Nilai Jual</Th>
                <Th className="text-right">Gain / (Loss)</Th>
              </tr>
            </thead>
            <tbody>
              {disposals.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <Td>{d.asset.assetCode}</Td>
                  <Td>{d.asset.name}</Td>
                  <Td>{d.asset.category.name}</Td>
                  <Td>{d.method.replace("_", " ")}</Td>
                  <Td>
                    <Badge color={STATUS_COLOR[d.status] ?? "slate"}>{d.status}</Badge>
                  </Td>
                  <Td>{formatDate(d.disposalDate)}</Td>
                  <Td className="text-right">{d.bookValueAtDisposal ? formatCurrency(toNumber(d.bookValueAtDisposal)) : "-"}</Td>
                  <Td className="text-right">{d.saleAmount ? formatCurrency(toNumber(d.saleAmount)) : "-"}</Td>
                  <Td className="text-right">{d.gainLoss ? formatCurrency(toNumber(d.gainLoss)) : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {disposals.length} disposal (maks. 500).</p>
    </div>
  );
}
