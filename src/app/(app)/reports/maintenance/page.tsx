import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard, Table, Th, Td, EmptyState, Badge } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Wrench, DollarSign } from "lucide-react";

const STATUS_COLOR: Record<string, "green" | "amber" | "slate" | "blue" | "red"> = {
  SCHEDULED: "blue",
  IN_PROGRESS: "amber",
  COMPLETED: "green",
  CANCELLED: "slate",
};

export default async function MaintenanceReportPage() {
  const year = new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const [workOrders, yearAgg, topAssetsRaw] = await Promise.all([
    prisma.workOrder.findMany({
      include: { asset: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.workOrder.aggregate({
      _sum: { totalCost: true },
      where: { createdAt: { gte: start, lt: end } },
    }),
    prisma.workOrder.groupBy({
      by: ["assetId"],
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: "desc" } },
      take: 5,
    }),
  ]);

  const topAssetIds = topAssetsRaw.map((t) => t.assetId);
  const topAssets = topAssetIds.length
    ? await prisma.asset.findMany({ where: { id: { in: topAssetIds } }, select: { id: true, name: true, assetCode: true } })
    : [];
  const topAssetMap = new Map(topAssets.map((a) => [a.id, a]));

  return (
    <div>
      <PageHeader title="Maintenance Report" description="Seluruh work order pemeliharaan aset beserta rincian biaya" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label={`Total Biaya Maintenance ${year}`}
          value={formatCurrency(toNumber(yearAgg._sum.totalCost))}
          icon={DollarSign}
          accent="amber"
        />
        <StatCard label="Total Work Order" value={workOrders.length} icon={Wrench} accent="indigo" />
      </div>

      {topAssetsRaw.length > 0 && (
        <Card className="p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Top 5 Aset dengan Biaya Maintenance Tertinggi</h3>
          <ul className="space-y-2">
            {topAssetsRaw.map((t) => {
              const asset = topAssetMap.get(t.assetId);
              return (
                <li key={t.assetId} className="flex justify-between text-sm">
                  <span className="text-slate-700">
                    {asset?.name ?? "-"} <span className="text-slate-400">({asset?.assetCode ?? "-"})</span>
                  </span>
                  <span className="font-medium text-slate-800">{formatCurrency(toNumber(t._sum.totalCost))}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        {workOrders.length === 0 ? (
          <EmptyState title="Belum ada work order" description="Data akan muncul setelah modul Maintenance mulai mencatat work order." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>No. WO</Th>
                <Th>Aset</Th>
                <Th>Status</Th>
                <Th className="text-right">Biaya Tenaga Kerja</Th>
                <Th className="text-right">Biaya Suku Cadang</Th>
                <Th className="text-right">Total Biaya</Th>
                <Th>Tanggal Dibuat</Th>
                <Th>Tanggal Selesai</Th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-slate-50">
                  <Td>{wo.woNumber}</Td>
                  <Td>
                    {wo.asset.name} <span className="text-slate-400 text-xs">({wo.asset.assetCode})</span>
                  </Td>
                  <Td>
                    <Badge color={STATUS_COLOR[wo.status] ?? "slate"}>{wo.status.replace("_", " ")}</Badge>
                  </Td>
                  <Td className="text-right">{formatCurrency(toNumber(wo.laborCost))}</Td>
                  <Td className="text-right">{formatCurrency(toNumber(wo.partsCost))}</Td>
                  <Td className="text-right">{formatCurrency(toNumber(wo.totalCost))}</Td>
                  <Td>{formatDate(wo.createdAt)}</Td>
                  <Td>{wo.completedDate ? formatDate(wo.completedDate) : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {workOrders.length} work order (maks. 500).</p>
    </div>
  );
}
