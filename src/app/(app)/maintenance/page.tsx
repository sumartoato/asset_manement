import { prisma } from "@/lib/prisma";
import { PageHeader, Card, LinkButton, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  SCHEDULED: "blue",
  IN_PROGRESS: "amber",
  COMPLETED: "green",
  CANCELLED: "slate",
};

const PRIORITY_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  LOW: "slate",
  MEDIUM: "blue",
  HIGH: "amber",
  CRITICAL: "red",
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "work-orders" ? "work-orders" : "schedules";

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [schedules, workOrders, upcoming] = await Promise.all([
    prisma.maintenanceSchedule.findMany({
      include: { asset: true },
      orderBy: { scheduledDate: "desc" },
      take: 100,
    }),
    prisma.workOrder.findMany({
      include: { asset: true, assignedTo: true, vendor: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.maintenanceSchedule.findMany({
      where: { status: "SCHEDULED", scheduledDate: { gte: now, lte: in30Days } },
      include: { asset: true },
      orderBy: { scheduledDate: "asc" },
      take: 8,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Asset Maintenance"
        description="Kelola jadwal maintenance dan work order perbaikan aset"
        action={
          <div className="flex gap-2">
            <LinkButton href="/maintenance/schedules/new" variant="secondary">
              <Plus className="h-4 w-4" /> Jadwal Baru
            </LinkButton>
            <LinkButton href="/maintenance/work-orders/new">
              <Plus className="h-4 w-4" /> Work Order Baru
            </LinkButton>
          </div>
        }
      />

      <Card className="p-4 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming Maintenance (30 hari ke depan)</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Tidak ada jadwal dalam 30 hari ke depan.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {upcoming.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm py-1">
                <div className="min-w-0">
                  <span className="font-medium text-slate-800">{m.asset.name}</span>
                  <span className="text-slate-400"> · {m.title}</span>
                </div>
                <span className="text-xs text-slate-500 shrink-0 ml-2">{formatDate(m.scheduledDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex gap-1 mb-4 border-b border-slate-200">
        <Link
          href="/maintenance?tab=schedules"
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
            activeTab === "schedules" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Schedules
        </Link>
        <Link
          href="/maintenance?tab=work-orders"
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
            activeTab === "work-orders" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Work Orders
        </Link>
      </div>

      {activeTab === "schedules" ? (
        <Card>
          {schedules.length === 0 ? (
            <EmptyState title="Belum ada jadwal maintenance" description="Buat jadwal baru untuk memulai." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Aset</Th>
                  <Th>Judul</Th>
                  <Th>Tipe</Th>
                  <Th>Tanggal Jadwal</Th>
                  <Th>Frekuensi</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/assets/${s.asset.id}`} className="text-indigo-600 font-medium hover:underline">
                        {s.asset.assetCode}
                      </Link>
                      <div className="text-xs text-slate-400">{s.asset.name}</div>
                    </Td>
                    <Td>{s.title}</Td>
                    <Td>
                      <Badge color={s.type === "PREVENTIVE" ? "blue" : "amber"}>{s.type}</Badge>
                    </Td>
                    <Td>{formatDate(s.scheduledDate)}</Td>
                    <Td>{s.frequencyDays ? `${s.frequencyDays} hari` : "-"}</Td>
                    <Td>
                      <Badge color={STATUS_COLOR[s.status]}>{s.status.replace("_", " ")}</Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      ) : (
        <Card>
          {workOrders.length === 0 ? (
            <EmptyState title="Belum ada work order" description="Buat work order baru untuk memulai." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>No. WO</Th>
                  <Th>Aset</Th>
                  <Th>Prioritas</Th>
                  <Th>Status</Th>
                  <Th>Ditugaskan</Th>
                  <Th className="text-right">Total Biaya</Th>
                  <Th>Dibuat</Th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/maintenance/work-orders/${w.id}`} className="text-indigo-600 font-medium hover:underline">
                        {w.woNumber}
                      </Link>
                    </Td>
                    <Td>
                      {w.asset.assetCode}
                      <div className="text-xs text-slate-400">{w.asset.name}</div>
                    </Td>
                    <Td>
                      <Badge color={PRIORITY_COLOR[w.priority]}>{w.priority}</Badge>
                    </Td>
                    <Td>
                      <Badge color={STATUS_COLOR[w.status]}>{w.status.replace("_", " ")}</Badge>
                    </Td>
                    <Td>{w.assignedTo?.name ?? w.vendor?.name ?? "-"}</Td>
                    <Td className="text-right">{formatCurrency(w.totalCost.toString())}</Td>
                    <Td>{formatDate(w.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
}
