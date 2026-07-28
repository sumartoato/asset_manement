import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, EmptyState, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

export default async function MovementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string; from?: string; to?: string }>;
}) {
  const { assetId, from, to } = await searchParams;

  const where: Prisma.MovementHistoryWhereInput = {};
  if (assetId) where.assetId = assetId;
  if (from || to) {
    where.movedAt = {};
    if (from) where.movedAt.gte = new Date(from);
    if (to) where.movedAt.lte = new Date(to);
  }

  const [movements, assets] = await Promise.all([
    prisma.movementHistory.findMany({
      where,
      include: { asset: true, toLocation: true },
      orderBy: { movedAt: "desc" },
      take: 500,
    }),
    prisma.asset.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, assetCode: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Asset Movement Report" description="Riwayat pergerakan aset antar lokasi" />

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[220px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Aset</label>
            <select name="assetId" defaultValue={assetId ?? ""} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Aset</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} — {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Dari Tanggal</label>
            <input type="date" name="from" defaultValue={from ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sampai Tanggal</label>
            <input type="date" name="to" defaultValue={to ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        {movements.length === 0 ? (
          <EmptyState title="Belum ada riwayat pergerakan" description="Data akan muncul setelah modul Tracking mencatat pergerakan aset." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama Aset</Th>
                <Th>Tipe Pergerakan</Th>
                <Th>Lokasi Tujuan</Th>
                <Th>Catatan</Th>
                <Th>Tanggal</Th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <Td>{m.asset.assetCode}</Td>
                  <Td>{m.asset.name}</Td>
                  <Td>
                    <Badge color="indigo">{m.type.replace("_", " ")}</Badge>
                  </Td>
                  <Td>{m.toLocation?.name ?? "-"}</Td>
                  <Td>{m.notes ?? "-"}</Td>
                  <Td>{formatDate(m.movedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {movements.length} pergerakan (maks. 500).</p>
    </div>
  );
}
