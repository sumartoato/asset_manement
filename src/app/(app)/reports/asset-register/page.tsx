import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  ACTIVE: "green",
  IN_STORAGE: "blue",
  UNDER_MAINTENANCE: "amber",
  DAMAGED: "red",
  LOST: "red",
  DISPOSED: "slate",
  BORROWED: "indigo",
};

export default async function AssetRegisterReportPage({
  searchParams,
}: {
  searchParams: Promise<{ categoryId?: string; departmentId?: string; locationId?: string; status?: string }>;
}) {
  const { categoryId, departmentId, locationId, status } = await searchParams;

  const where: Prisma.AssetWhereInput = {};
  if (categoryId) where.categoryId = categoryId;
  if (departmentId) where.departmentId = departmentId;
  if (locationId) where.locationId = locationId;
  if (status) where.status = status as Prisma.EnumAssetStatusFilter["equals"];

  const [assets, categories, departments, locations] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        category: true,
        type: true,
        location: true,
        department: true,
        depreciationEntries: { select: { amount: true } },
      },
      orderBy: { assetCode: "asc" },
      take: 500,
    }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  const rows = assets.map((a) => {
    const accumulatedDepreciation = a.depreciationEntries.reduce((sum, d) => sum + toNumber(d.amount), 0);
    const bookValue = toNumber(a.purchaseCost) - accumulatedDepreciation;
    return { asset: a, bookValue };
  });

  return (
    <div>
      <PageHeader title="Asset Register" description="Daftar lengkap seluruh data induk aset beserta nilai buku saat ini" />

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
            <select name="categoryId" defaultValue={categoryId ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Departemen</label>
            <select name="departmentId" defaultValue={departmentId ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Lokasi</label>
            <select name="locationId" defaultValue={locationId ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Lokasi</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Status</option>
              {Object.keys(STATUS_COLOR).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Tidak ada aset yang cocok" description="Ubah filter untuk melihat data lain." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama</Th>
                <Th>Kategori</Th>
                <Th>Tipe</Th>
                <Th>Lokasi</Th>
                <Th>Departemen</Th>
                <Th>Status</Th>
                <Th>Kondisi</Th>
                <Th>Tanggal Beli</Th>
                <Th className="text-right">Harga Perolehan</Th>
                <Th className="text-right">Nilai Buku</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ asset: a, bookValue }) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td>{a.assetCode}</Td>
                  <Td>{a.name}</Td>
                  <Td>{a.category.name}</Td>
                  <Td>{a.type?.name ?? "-"}</Td>
                  <Td>{a.location?.name ?? "-"}</Td>
                  <Td>{a.department?.name ?? "-"}</Td>
                  <Td>
                    <Badge color={STATUS_COLOR[a.status]}>{a.status.replace("_", " ")}</Badge>
                  </Td>
                  <Td>{a.condition}</Td>
                  <Td>{formatDate(a.purchaseDate)}</Td>
                  <Td className="text-right">{formatCurrency(toNumber(a.purchaseCost))}</Td>
                  <Td className="text-right">{formatCurrency(bookValue)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {rows.length} aset (maks. 500).</p>
    </div>
  );
}
