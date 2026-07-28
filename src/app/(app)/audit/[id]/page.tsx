import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Button, LinkButton, Table, Th, Td, EmptyState, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { CheckCircle2, HelpCircle, AlertTriangle, ScanLine, FileBarChart } from "lucide-react";
import {
  scanAssetIntoOpname,
  updateStockOpnameItem,
  completeStockOpname,
} from "@/lib/actions/audit";

const STATUS_COLOR: Record<string, "green" | "amber" | "slate"> = {
  DRAFT: "slate",
  IN_PROGRESS: "amber",
  COMPLETED: "green",
};

export default async function StockOpnameDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const found = opname.items.filter((i) => i.found && !i.isUnexpected);
  const missing = opname.items.filter((i) => !i.found && !i.isUnexpected);
  const unexpected = opname.items.filter((i) => i.isUnexpected);
  const totalExpected = opname.items.filter((i) => !i.isUnexpected).length;

  const scanAction = scanAssetIntoOpname.bind(null, opname.id);
  const completeAction = completeStockOpname.bind(null, opname.id);
  const isEditable = opname.status !== "COMPLETED";

  return (
    <div>
      <PageHeader
        title={opname.title}
        description={`${opname.code} · Mulai ${formatDate(opname.startDate)}${opname.endDate ? ` · Selesai ${formatDate(opname.endDate)}` : ""}`}
        action={
          <div className="flex gap-2">
            <Badge color={STATUS_COLOR[opname.status]}>{opname.status.replace("_", " ")}</Badge>
            <LinkButton href={`/audit/${opname.id}/report`} variant="secondary">
              <FileBarChart className="h-4 w-4" /> Laporan
            </LinkButton>
            {isEditable && (
              <form action={completeAction}>
                <Button type="submit" variant="primary">
                  Selesaikan Audit
                </Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Diharapkan" value={totalExpected} icon={HelpCircle} accent="slate" />
        <StatCard label="Ditemukan" value={found.length} icon={CheckCircle2} accent="green" />
        <StatCard label="Hilang (Missing)" value={missing.length} icon={AlertTriangle} accent="red" />
        <StatCard label="Tidak Terduga (Unexpected)" value={unexpected.length} icon={ScanLine} accent="amber" />
      </div>

      {isEditable && (
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Scan / Input Kode Aset</h3>
          <form action={scanAction} className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Kode Aset</label>
              <input
                name="assetCode"
                required
                autoFocus
                placeholder="mis. AST-2026-0001"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Lokasi Ditemukan (opsional)</label>
              <select name="locationId" defaultValue="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Gunakan lokasi diharapkan / lokasi aset</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Tandai Ditemukan</Button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Kode aset yang belum terdaftar di sistem akan diabaikan. Aset yang belum termasuk dalam sesi ini akan ditandai sebagai
            &quot;Unexpected&quot;.
          </p>
        </Card>
      )}

      <Card className="mb-6">
        <div className="p-4 pb-0">
          <h3 className="text-sm font-semibold text-slate-900">Semua Item Audit</h3>
        </div>
        {opname.items.length === 0 ? (
          <EmptyState title="Belum ada item" description="Sesi ini tidak menyertakan aset apapun." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Kode Aset</Th>
                <Th>Nama</Th>
                <Th>Lokasi Diharapkan</Th>
                <Th>Ditemukan</Th>
                <Th>Lokasi Ditemukan</Th>
                <Th>Catatan</Th>
                <Th>Status</Th>
                {isEditable && <Th> </Th>}
              </tr>
            </thead>
            <tbody>
              {opname.items.map((item) => {
                const updateAction = updateStockOpnameItem.bind(null, opname.id, item.id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <Td>{item.asset?.assetCode ?? "-"}</Td>
                    <Td>{item.asset?.name ?? "-"}</Td>
                    <Td>{item.expectedLocationId ? (locationMap.get(item.expectedLocationId) ?? "-") : "-"}</Td>
                    <Td>{item.found ? "Ya" : "Tidak"}</Td>
                    <Td>{item.foundLocationId ? (locationMap.get(item.foundLocationId) ?? "-") : "-"}</Td>
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
                    {isEditable && (
                      <Td>
                        <form action={updateAction} className="flex flex-wrap items-center gap-1.5">
                          <label className="flex items-center gap-1 text-xs text-slate-500">
                            <input type="checkbox" name="found" defaultChecked={item.found} className="rounded border-slate-300" />
                            Ditemukan
                          </label>
                          <select
                            name="foundLocationId"
                            defaultValue={item.foundLocationId ?? ""}
                            className="rounded-md border border-slate-300 px-1.5 py-1 text-xs"
                          >
                            <option value="">Lokasi ditemukan</option>
                            {locations.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                          <input
                            name="notes"
                            defaultValue={item.notes ?? ""}
                            placeholder="Catatan"
                            className="rounded-md border border-slate-300 px-1.5 py-1 text-xs w-24"
                          />
                          <button type="submit" className="rounded-md bg-slate-900 text-white text-xs px-2 py-1">
                            Simpan
                          </button>
                        </form>
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold text-slate-900">Aset Hilang (Missing)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Diharapkan ada namun belum ditemukan saat audit.</p>
          </div>
          {missing.length === 0 ? (
            <EmptyState title="Tidak ada aset hilang" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Kode Aset</Th>
                  <Th>Nama</Th>
                  <Th>Lokasi Diharapkan</Th>
                </tr>
              </thead>
              <tbody>
                {missing.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.asset?.assetCode ?? "-"}</Td>
                    <Td>{item.asset?.name ?? "-"}</Td>
                    <Td>{item.expectedLocationId ? (locationMap.get(item.expectedLocationId) ?? "-") : "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <div className="p-4 pb-0">
            <h3 className="text-sm font-semibold text-slate-900">Aset Tidak Terduga (Unexpected)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ditemukan saat audit namun tidak termasuk baseline yang diharapkan.</p>
          </div>
          {unexpected.length === 0 ? (
            <EmptyState title="Tidak ada aset tidak terduga" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Kode Aset</Th>
                  <Th>Nama</Th>
                  <Th>Lokasi Ditemukan</Th>
                </tr>
              </thead>
              <tbody>
                {unexpected.map((item) => (
                  <tr key={item.id}>
                    <Td>{item.asset?.assetCode ?? "-"}</Td>
                    <Td>{item.asset?.name ?? "-"}</Td>
                    <Td>{item.foundLocationId ? (locationMap.get(item.foundLocationId) ?? "-") : "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
