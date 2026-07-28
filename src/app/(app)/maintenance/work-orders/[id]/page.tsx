import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  updateChecklist,
  addSparePartUsage,
  deleteSparePartUsage,
  updateLaborCost,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
} from "@/lib/actions/maintenance";
import { ChecklistPanel, SparePartForm, LaborCostForm, StatusActions } from "@/components/maintenance/work-order-panels";
import type { ChecklistItem } from "@/components/maintenance/checklist-rows";

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

export default async function WorkOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      asset: true,
      assignedTo: true,
      vendor: true,
      maintenanceSchedule: true,
      spareParts: true,
    },
  });

  if (!workOrder) notFound();

  const checklistItems: ChecklistItem[] = Array.isArray(workOrder.checklist)
    ? (workOrder.checklist as unknown as ChecklistItem[])
    : [];

  const updateChecklistWithId = updateChecklist.bind(null, workOrder.id);
  const addSparePartWithId = addSparePartUsage.bind(null, workOrder.id);
  const updateLaborCostWithId = updateLaborCost.bind(null, workOrder.id);
  const startAction = startWorkOrder.bind(null, workOrder.id);
  const completeAction = completeWorkOrder.bind(null, workOrder.id);
  const cancelAction = cancelWorkOrder.bind(null, workOrder.id);

  return (
    <div>
      <PageHeader
        title={workOrder.woNumber}
        description={`${workOrder.asset.assetCode} · ${workOrder.asset.name}`}
        action={
          <div className="flex items-center gap-2">
            <Badge color={PRIORITY_COLOR[workOrder.priority]}>{workOrder.priority}</Badge>
            <Badge color={STATUS_COLOR[workOrder.status]}>{workOrder.status.replace("_", " ")}</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Informasi Work Order</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Aset">
                <Link href={`/assets/${workOrder.asset.id}`} className="text-indigo-600 hover:underline">
                  {workOrder.asset.assetCode} · {workOrder.asset.name}
                </Link>
              </Field>
              <Field label="Tipe" value={workOrder.type} />
              <Field label="Jadwal Terkait" value={workOrder.maintenanceSchedule?.title ?? "-"} />
              <Field label="Ditugaskan ke" value={workOrder.assignedTo?.name ?? "-"} />
              <Field label="Vendor" value={workOrder.vendor?.name ?? "-"} />
              <Field label="Tanggal Mulai" value={formatDate(workOrder.startDate)} />
              <Field label="Tanggal Selesai" value={formatDate(workOrder.completedDate)} />
              <Field label="Dibuat" value={formatDate(workOrder.createdAt)} />
            </dl>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Deskripsi</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{workOrder.description}</p>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Checklist</h3>
            <ChecklistPanel action={updateChecklistWithId} initialItems={checklistItems} />
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Spare Parts</h3>
            <SparePartForm action={addSparePartWithId} />
            {workOrder.spareParts.length === 0 ? (
              <EmptyState title="Belum ada spare part" description="Tambahkan part yang digunakan di atas." />
            ) : (
              <div className="mt-4">
                <Table>
                  <thead>
                    <tr>
                      <Th>Nama Part</Th>
                      <Th className="text-right">Qty</Th>
                      <Th className="text-right">Harga Satuan</Th>
                      <Th className="text-right">Subtotal</Th>
                      <Th>&nbsp;</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrder.spareParts.map((p) => {
                      const del = deleteSparePartUsage.bind(null, workOrder.id, p.id);
                      return (
                        <tr key={p.id}>
                          <Td>{p.partName}</Td>
                          <Td className="text-right">{p.quantity}</Td>
                          <Td className="text-right">{formatCurrency(p.unitCost.toString())}</Td>
                          <Td className="text-right">{formatCurrency(Number(p.unitCost) * p.quantity)}</Td>
                          <Td className="text-right">
                            <form action={del}>
                              <button type="submit" className="text-slate-400 hover:text-red-600 p-1">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </form>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Biaya</h3>
            <div className="space-y-3">
              <LaborCostForm action={updateLaborCostWithId} defaultValue={Number(workOrder.laborCost)} />
              <div className="text-sm text-slate-500 flex justify-between pt-2 border-t border-slate-100">
                <span>Biaya Part</span>
                <span className="font-medium text-slate-700">{formatCurrency(workOrder.partsCost.toString())}</span>
              </div>
              <div className="text-base flex justify-between pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-900">Total Biaya</span>
                <span className="font-bold text-indigo-600">{formatCurrency(workOrder.totalCost.toString())}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Aksi Status</h3>
            <StatusActions status={workOrder.status} onStart={startAction} onComplete={completeAction} onCancel={cancelAction} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800 font-medium">{children ?? (value || "-")}</dd>
    </div>
  );
}
