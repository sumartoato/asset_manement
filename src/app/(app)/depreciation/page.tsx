import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState, Button } from "@/components/ui";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import { generateDepreciationEntries } from "@/lib/actions/depreciation";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const METHOD_COLOR: Record<string, "indigo" | "purple"> = {
  STRAIGHT_LINE: "indigo",
  DECLINING_BALANCE: "purple",
};

async function generateAction() {
  "use server";
  const result = await generateDepreciationEntries();
  redirect(
    `/depreciation?generated=1&entries=${result.entriesCreated}&assets=${result.assetsProcessed}`
  );
}

export default async function DepreciationPage({
  searchParams,
}: {
  searchParams: Promise<{ generated?: string; entries?: string; assets?: string }>;
}) {
  const { generated, entries, assets: assetsProcessed } = await searchParams;

  const [eligibleAssets, missingCount] = await Promise.all([
    prisma.asset.findMany({
      where: {
        status: { not: "DISPOSED" },
        purchaseCost: { not: null },
        purchaseDate: { not: null },
        usefulLifeYears: { not: null },
      },
      include: {
        depreciationEntries: { select: { amount: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.asset.count({
      where: {
        status: { not: "DISPOSED" },
        OR: [{ purchaseCost: null }, { purchaseDate: null }, { usefulLifeYears: null }],
      },
    }),
  ]);

  const rows = eligibleAssets.map((asset) => {
    const purchaseCost = toNumber(asset.purchaseCost);
    const accumulated = asset.depreciationEntries.reduce((sum, e) => sum + toNumber(e.amount), 0);
    const salvage = toNumber(asset.salvageValue);
    const bookValue = Math.max(purchaseCost - accumulated, salvage);
    return { asset, purchaseCost, accumulated, bookValue };
  });

  return (
    <div>
      <PageHeader
        title="Asset Depreciation"
        description="Perhitungan dan jadwal penyusutan nilai aset"
        action={
          <form action={generateAction}>
            <Button type="submit">
              <RefreshCw className="h-4 w-4" /> Generate Depreciation Entries
            </Button>
          </form>
        }
      />

      {generated && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 mb-4">
          <p className="text-sm text-emerald-800">
            Berhasil diproses: {assetsProcessed ?? 0} aset, {entries ?? 0} entri penyusutan baru dibuat/diperbarui.
          </p>
        </div>
      )}

      {missingCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
          <p className="text-sm text-amber-800">
            {missingCount} aset belum dapat dihitung penyusutannya karena data harga perolehan, tanggal
            pembelian, atau umur manfaat belum lengkap. Lengkapi data tersebut di halaman edit aset.
          </p>
        </div>
      )}

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="Belum ada aset yang siap disusutkan"
            description="Lengkapi harga perolehan, tanggal pembelian, dan umur manfaat pada data aset."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode / Nama Aset</Th>
                <Th>Metode</Th>
                <Th className="text-right">Harga Perolehan</Th>
                <Th className="text-right">Akumulasi Penyusutan</Th>
                <Th className="text-right">Nilai Buku</Th>
                <Th className="text-right">Umur Manfaat</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ asset, purchaseCost, accumulated, bookValue }) => (
                <tr key={asset.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/depreciation/${asset.id}`} className="text-indigo-600 font-medium hover:underline">
                      {asset.assetCode}
                    </Link>
                    <p className="text-xs text-slate-400">{asset.name}</p>
                  </Td>
                  <Td>
                    <Badge color={METHOD_COLOR[asset.depreciationMethod]}>
                      {asset.depreciationMethod.replace("_", " ")}
                    </Badge>
                  </Td>
                  <Td className="text-right">{formatCurrency(purchaseCost)}</Td>
                  <Td className="text-right">{formatCurrency(accumulated)}</Td>
                  <Td className="text-right font-medium text-slate-900">{formatCurrency(bookValue)}</Td>
                  <Td className="text-right">{formatNumber(asset.usefulLifeYears)} tahun</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
