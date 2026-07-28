import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
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

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; categoryId?: string }>;
}) {
  const { q, status, categoryId } = await searchParams;

  const where: Prisma.AssetWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { assetCode: { contains: q, mode: "insensitive" } },
      { serialNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) where.status = status as Prisma.EnumAssetStatusFilter["equals"];
  if (categoryId) where.categoryId = categoryId;

  const [assets, categories] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: { category: true, location: true, department: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Master Asset"
        description="Registrasi dan pengelolaan data induk aset"
        action={
          <LinkButton href="/assets/new">
            <Plus className="h-4 w-4" /> Registrasi Aset
          </LinkButton>
        }
      />

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Cari</label>
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Nama, kode aset, serial number..."
                className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Status</option>
              {Object.keys(STATUS_COLOR).map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
            <select name="categoryId" defaultValue={categoryId ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        {assets.length === 0 ? (
          <EmptyState title="Belum ada aset" description="Mulai dengan registrasi aset baru." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama</Th>
                <Th>Kategori</Th>
                <Th>Lokasi</Th>
                <Th>Departemen</Th>
                <Th>Status</Th>
                <Th>Kondisi</Th>
                <Th className="text-right">Nilai Perolehan</Th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/assets/${a.id}`} className="text-indigo-600 font-medium hover:underline">
                      {a.assetCode}
                    </Link>
                  </Td>
                  <Td>{a.name}</Td>
                  <Td>{a.category.name}</Td>
                  <Td>{a.location?.name ?? "-"}</Td>
                  <Td>{a.department?.name ?? "-"}</Td>
                  <Td>
                    <Badge color={STATUS_COLOR[a.status]}>{a.status.replace("_", " ")}</Badge>
                  </Td>
                  <Td>{a.condition}</Td>
                  <Td className="text-right">{a.purchaseCost ? formatCurrency(a.purchaseCost.toString()) : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {assets.length} aset. Dibuat terakhir: {assets[0] ? formatDate(assets[0].createdAt) : "-"}</p>
    </div>
  );
}
