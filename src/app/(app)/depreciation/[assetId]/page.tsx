import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState, LinkButton } from "@/components/ui";
import { formatCurrency, formatDate, formatNumber, toNumber } from "@/lib/format";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const METHOD_COLOR: Record<string, "indigo" | "purple"> = {
  STRAIGHT_LINE: "indigo",
  DECLINING_BALANCE: "purple",
};

export default async function AssetDepreciationDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      category: true,
      depreciationEntries: { orderBy: { period: "asc" } },
    },
  });

  if (!asset) notFound();

  const purchaseCost = toNumber(asset.purchaseCost);
  const salvage = toNumber(asset.salvageValue);
  const accumulated = asset.depreciationEntries.reduce((sum, e) => sum + toNumber(e.amount), 0);
  const bookValue = Math.max(purchaseCost - accumulated, salvage);
  const depreciableBase = purchaseCost - salvage;
  const pctDepreciated = depreciableBase > 0 ? Math.min((accumulated / depreciableBase) * 100, 100) : 0;

  const annual = new Map<number, number>();
  for (const entry of asset.depreciationEntries) {
    const year = entry.period.getUTCFullYear();
    annual.set(year, (annual.get(year) ?? 0) + toNumber(entry.amount));
  }
  const annualRows = Array.from(annual.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div>
      <PageHeader
        title={`Penyusutan · ${asset.name}`}
        description={`${asset.assetCode} · ${asset.category.name}`}
        action={
          <LinkButton href="/depreciation" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </LinkButton>
        }
      />

      <Card className="p-5 mb-4">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4 text-sm">
          <Field label="Metode">
            <Badge color={METHOD_COLOR[asset.depreciationMethod]}>{asset.depreciationMethod.replace("_", " ")}</Badge>
          </Field>
          <Field label="Umur Manfaat" value={asset.usefulLifeYears ? `${asset.usefulLifeYears} tahun` : "-"} />
          <Field label="Nilai Sisa" value={formatCurrency(salvage)} />
          <Field label="Harga Perolehan" value={formatCurrency(purchaseCost)} />
          <Field label="Akumulasi Penyusutan" value={formatCurrency(accumulated)} />
          <Field label="Nilai Buku Saat Ini" value={formatCurrency(bookValue)} />
          <Field label="% Tersusutkan" value={`${formatNumber(Math.round(pctDepreciated * 10) / 10)}%`} />
          <Field label="Tanggal Pembelian" value={formatDate(asset.purchaseDate)} />
        </dl>
      </Card>

      <Card className="mb-4">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Jadwal Penyusutan Bulanan</h3>
        </div>
        {asset.depreciationEntries.length === 0 ? (
          <EmptyState
            title="Belum ada entri penyusutan"
            description="Jalankan 'Generate Depreciation Entries' pada halaman Depreciation."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Periode</Th>
                <Th className="text-right">Nilai Buku Awal</Th>
                <Th className="text-right">Penyusutan</Th>
                <Th className="text-right">Nilai Buku Akhir</Th>
              </tr>
            </thead>
            <tbody>
              {asset.depreciationEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <Td>
                    {new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(entry.period)}
                  </Td>
                  <Td className="text-right">{formatCurrency(entry.bookValueStart.toString())}</Td>
                  <Td className="text-right">{formatCurrency(entry.amount.toString())}</Td>
                  <Td className="text-right font-medium text-slate-900">
                    {formatCurrency(entry.bookValueEnd.toString())}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Penyusutan Tahunan (Rollup)</h3>
        </div>
        {annualRows.length === 0 ? (
          <EmptyState title="Belum ada data" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tahun</Th>
                <Th className="text-right">Total Penyusutan</Th>
              </tr>
            </thead>
            <tbody>
              {annualRows.map(([year, total]) => (
                <tr key={year} className="hover:bg-slate-50">
                  <Td>{year}</Td>
                  <Td className="text-right font-medium text-slate-900">{formatCurrency(total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800 font-medium mt-0.5">{children ?? value ?? "-"}</dd>
    </div>
  );
}
