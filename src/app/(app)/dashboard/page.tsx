import { prisma } from "@/lib/prisma";
import { StatCard, Card, PageHeader } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import {
  Boxes,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  HelpCircle,
  Wallet,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { DashboardCharts } from "./charts";
import Link from "next/link";

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    totalAssets,
    activeAssets,
    maintenanceAssets,
    damagedAssets,
    lostAssets,
    allAssetsForValue,
    monthlyDepreciation,
    maintenanceCostAgg,
    byCategory,
    byDepartment,
    byLocation,
    upcomingMaintenance,
    warrantyExpiring,
    recentMovements,
  ] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: "ACTIVE" } }),
    prisma.asset.count({ where: { status: "UNDER_MAINTENANCE" } }),
    prisma.asset.count({ where: { status: "DAMAGED" } }),
    prisma.asset.count({ where: { status: "LOST" } }),
    prisma.asset.findMany({
      where: { status: { not: "DISPOSED" } },
      select: { purchaseCost: true },
    }),
    prisma.depreciationEntry.aggregate({
      _sum: { amount: true },
      where: { period: { gte: startOfMonth } },
    }),
    prisma.workOrder.aggregate({
      _sum: { totalCost: true },
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.asset.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    }),
    prisma.asset.groupBy({
      by: ["departmentId"],
      _count: { _all: true },
    }),
    prisma.asset.groupBy({
      by: ["locationId"],
      _count: { _all: true },
    }),
    prisma.maintenanceSchedule.findMany({
      where: { status: "SCHEDULED", scheduledDate: { gte: now, lte: in30Days } },
      include: { asset: true },
      orderBy: { scheduledDate: "asc" },
      take: 6,
    }),
    prisma.asset.findMany({
      where: { warrantyEnd: { gte: now, lte: in30Days } },
      orderBy: { warrantyEnd: "asc" },
      take: 6,
    }),
    prisma.movementHistory.findMany({
      include: { asset: true, toLocation: true },
      orderBy: { movedAt: "desc" },
      take: 8,
    }),
  ]);

  const totalValue = allAssetsForValue.reduce((sum, a) => sum + toNumber(a.purchaseCost), 0);

  const categories = await prisma.assetCategory.findMany();
  const departments = await prisma.department.findMany();
  const locations = await prisma.location.findMany();

  const categoryChart = byCategory
    .map((c) => ({
      name: categories.find((cat) => cat.id === c.categoryId)?.name ?? "Lainnya",
      value: c._count._all,
    }))
    .sort((a, b) => b.value - a.value);

  const departmentChart = byDepartment
    .map((d) => ({
      name: departments.find((dep) => dep.id === d.departmentId)?.name ?? "Belum ditugaskan",
      value: d._count._all,
    }))
    .sort((a, b) => b.value - a.value);

  const locationChart = byLocation
    .map((l) => ({
      name: locations.find((loc) => loc.id === l.locationId)?.name ?? "Belum ditentukan",
      value: l._count._all,
    }))
    .sort((a, b) => b.value - a.value);

  const conditionCounts = await prisma.asset.groupBy({
    by: ["condition"],
    _count: { _all: true },
  });
  const conditionChart = conditionCounts.map((c) => ({
    name: c.condition,
    value: c._count._all,
  }));

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan kondisi dan nilai aset perusahaan" />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Asset" value={totalAssets} icon={Boxes} accent="indigo" />
        <StatCard label="Active Asset" value={activeAssets} icon={CheckCircle2} accent="green" />
        <StatCard label="Under Maintenance" value={maintenanceAssets} icon={Wrench} accent="amber" />
        <StatCard label="Damaged Asset" value={damagedAssets} icon={AlertTriangle} accent="red" />
        <StatCard label="Lost Asset" value={lostAssets} icon={HelpCircle} accent="red" />
        <StatCard label="Asset Value" value={formatCurrency(totalValue)} icon={Wallet} accent="blue" />
        <StatCard
          label="Monthly Depreciation"
          value={formatCurrency(toNumber(monthlyDepreciation._sum.amount))}
          icon={TrendingDown}
          accent="slate"
        />
        <StatCard
          label="Maintenance Cost (bulan ini)"
          value={formatCurrency(toNumber(maintenanceCostAgg._sum.totalCost))}
          icon={DollarSign}
          accent="amber"
        />
      </div>

      <DashboardCharts
        categoryChart={categoryChart}
        departmentChart={departmentChart}
        locationChart={locationChart}
        conditionChart={conditionChart}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming Maintenance</h3>
          {upcomingMaintenance.length === 0 && (
            <p className="text-sm text-slate-400">Tidak ada jadwal dalam 30 hari ke depan.</p>
          )}
          <ul className="space-y-3">
            {upcomingMaintenance.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{m.asset.name}</p>
                  <p className="text-xs text-slate-400">{m.title}</p>
                </div>
                <span className="text-xs text-slate-500 shrink-0 ml-2">{formatDate(m.scheduledDate)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Warranty Expiration</h3>
          {warrantyExpiring.length === 0 && (
            <p className="text-sm text-slate-400">Tidak ada garansi yang akan berakhir.</p>
          )}
          <ul className="space-y-3">
            {warrantyExpiring.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.assetCode}</p>
                </div>
                <span className="text-xs text-slate-500 shrink-0 ml-2">{formatDate(a.warrantyEnd)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Activities</h3>
          {recentMovements.length === 0 && (
            <p className="text-sm text-slate-400">Belum ada aktivitas.</p>
          )}
          <ul className="space-y-3">
            {recentMovements.map((m) => (
              <li key={m.id} className="text-sm">
                <p className="font-medium text-slate-800 truncate">
                  {m.asset.name} <span className="text-slate-400 font-normal">&middot; {m.type.replace("_", " ")}</span>
                </p>
                <p className="text-xs text-slate-400">
                  {m.toLocation?.name ?? "-"} &middot; {formatDate(m.movedAt)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Link href="/reports" className="text-sm text-indigo-600 hover:underline">
          Lihat semua laporan &rarr;
        </Link>
      </div>
    </div>
  );
}
