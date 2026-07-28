import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";

export default async function DepreciationReportPage() {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const entries = await prisma.depreciationEntry.findMany({
    where: { period: { gte: start, lt: end } },
    include: { asset: { include: { category: true } } },
    orderBy: [{ assetId: "asc" }, { period: "asc" }],
    take: 5000,
  });

  const groups = new Map<string, { assetCode: string; assetName: string; category: string; entries: typeof entries }>();
  for (const e of entries) {
    const key = e.assetId;
    const group = groups.get(key) ?? {
      assetCode: e.asset.assetCode,
      assetName: e.asset.name,
      category: e.asset.category.name,
      entries: [],
    };
    group.entries.push(e);
    groups.set(key, group);
  }

  const grandTotal = entries.reduce((s, e) => s + toNumber(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Depreciation Report"
        description={`Rincian entri penyusutan tahun ${year}, dikelompokkan per aset`}
      />

      <Card>
        {entries.length === 0 ? (
          <EmptyState title="Belum ada entri penyusutan" description={`Tidak ada data penyusutan untuk tahun ${year}.`} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama Aset</Th>
                <Th>Kategori</Th>
                <Th>Periode</Th>
                <Th className="text-right">Nilai Buku Awal</Th>
                <Th className="text-right">Nilai Buku Akhir</Th>
                <Th className="text-right">Jumlah Penyusutan</Th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groups.entries()).map(([assetId, g]) => {
                const subtotal = g.entries.reduce((s, e) => s + toNumber(e.amount), 0);
                return (
                  <Fragment key={assetId}>
                    {g.entries.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <Td>{g.assetCode}</Td>
                        <Td>{g.assetName}</Td>
                        <Td>{g.category}</Td>
                        <Td>{formatDate(e.period)}</Td>
                        <Td className="text-right">{formatCurrency(toNumber(e.bookValueStart))}</Td>
                        <Td className="text-right">{formatCurrency(toNumber(e.bookValueEnd))}</Td>
                        <Td className="text-right">{formatCurrency(toNumber(e.amount))}</Td>
                      </tr>
                    ))}
                    <tr key={`${assetId}-subtotal`} className="bg-slate-50 font-medium">
                      <td colSpan={6} className="px-4 py-2.5 border-b border-slate-100 text-right text-slate-700">
                        <Badge color="slate">Subtotal {g.assetCode}</Badge>
                      </td>
                      <td className="px-4 py-2.5 border-b border-slate-100 text-right text-slate-700">{formatCurrency(subtotal)}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td colSpan={6} className="px-4 py-2.5 border-t border-slate-200 text-right text-slate-800">
                  Grand Total
                </td>
                <td className="px-4 py-2.5 border-t border-slate-200 text-right text-slate-800">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {entries.length} entri penyusutan (maks. 5000).</p>
    </div>
  );
}
