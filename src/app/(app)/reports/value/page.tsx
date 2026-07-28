import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatCurrency, toNumber } from "@/lib/format";
import { Wallet, TrendingDown, Landmark } from "lucide-react";

export default async function AssetValueReportPage() {
  const assets = await prisma.asset.findMany({
    include: {
      category: true,
      depreciationEntries: { select: { amount: true } },
    },
    take: 5000,
  });

  const byCategory = new Map<
    string,
    { name: string; count: number; acquisitionCost: number; accumulatedDepreciation: number }
  >();

  for (const a of assets) {
    const key = a.categoryId;
    const entry = byCategory.get(key) ?? {
      name: a.category.name,
      count: 0,
      acquisitionCost: 0,
      accumulatedDepreciation: 0,
    };
    entry.count += 1;
    entry.acquisitionCost += toNumber(a.purchaseCost);
    entry.accumulatedDepreciation += a.depreciationEntries.reduce((s, d) => s + toNumber(d.amount), 0);
    byCategory.set(key, entry);
  }

  const rows = Array.from(byCategory.values())
    .map((r) => ({ ...r, bookValue: r.acquisitionCost - r.accumulatedDepreciation }))
    .sort((a, b) => b.acquisitionCost - a.acquisitionCost);

  const totalAcquisition = rows.reduce((s, r) => s + r.acquisitionCost, 0);
  const totalDepreciation = rows.reduce((s, r) => s + r.accumulatedDepreciation, 0);
  const totalBookValue = totalAcquisition - totalDepreciation;

  return (
    <div>
      <PageHeader title="Asset Value Report" description="Nilai perolehan, akumulasi penyusutan, dan nilai buku aset" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Nilai Perolehan" value={formatCurrency(totalAcquisition)} icon={Wallet} accent="indigo" />
        <StatCard label="Total Akumulasi Penyusutan" value={formatCurrency(totalDepreciation)} icon={TrendingDown} accent="amber" />
        <StatCard label="Total Nilai Buku" value={formatCurrency(totalBookValue)} icon={Landmark} accent="green" />
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Belum ada data aset" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kategori</Th>
                <Th className="text-right">Jumlah Aset</Th>
                <Th className="text-right">Nilai Perolehan</Th>
                <Th className="text-right">Akumulasi Penyusutan</Th>
                <Th className="text-right">Nilai Buku</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="hover:bg-slate-50">
                  <Td>{r.name}</Td>
                  <Td className="text-right">{r.count}</Td>
                  <Td className="text-right">{formatCurrency(r.acquisitionCost)}</Td>
                  <Td className="text-right">{formatCurrency(r.accumulatedDepreciation)}</Td>
                  <Td className="text-right">{formatCurrency(r.bookValue)}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <Td>Total</Td>
                <Td className="text-right">{rows.reduce((s, r) => s + r.count, 0)}</Td>
                <Td className="text-right">{formatCurrency(totalAcquisition)}</Td>
                <Td className="text-right">{formatCurrency(totalDepreciation)}</Td>
                <Td className="text-right">{formatCurrency(totalBookValue)}</Td>
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>
    </div>
  );
}
