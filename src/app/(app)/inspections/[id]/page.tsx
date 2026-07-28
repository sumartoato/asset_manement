import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import Link from "next/link";
import { completeInspection, approveInspection } from "@/lib/actions/inspections";
import { CompleteInspectionForm } from "@/components/inspections/complete-inspection-form";
import type { ChecklistItem } from "@/components/maintenance/checklist-rows";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  SCHEDULED: "blue",
  COMPLETED: "green",
  CANCELLED: "slate",
};

const CONDITION_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  EXCELLENT: "green",
  GOOD: "blue",
  FAIR: "amber",
  POOR: "amber",
  DAMAGED: "red",
};

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: { asset: true },
  });

  if (!inspection) notFound();

  const checklistItems: ChecklistItem[] = Array.isArray(inspection.checklist)
    ? (inspection.checklist as unknown as ChecklistItem[])
    : [];

  const completeWithId = completeInspection.bind(null, inspection.id);
  const approveWithId = approveInspection.bind(null, inspection.id);

  const canApprove = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

  return (
    <div>
      <PageHeader
        title={`Inspeksi · ${inspection.asset.assetCode}`}
        description={inspection.asset.name}
        action={
          <div className="flex items-center gap-2">
            <Badge color={STATUS_COLOR[inspection.status]}>{inspection.status}</Badge>
            <Badge color={inspection.approved ? "green" : "slate"}>
              {inspection.approved ? "Disetujui" : "Belum Disetujui"}
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Informasi Inspeksi</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Aset">
                <Link href={`/assets/${inspection.asset.id}`} className="text-indigo-600 hover:underline">
                  {inspection.asset.assetCode} · {inspection.asset.name}
                </Link>
              </Field>
              <Field label="Tanggal Jadwal" value={formatDate(inspection.scheduledDate)} />
              <Field label="Tanggal Selesai" value={formatDate(inspection.completedDate)} />
              <Field label="Kondisi Ditemukan">
                {inspection.conditionFound ? (
                  <Badge color={CONDITION_COLOR[inspection.conditionFound]}>{inspection.conditionFound}</Badge>
                ) : (
                  "-"
                )}
              </Field>
            </dl>

            {checklistItems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Checklist</p>
                <ul className="space-y-1">
                  {checklistItems.map((c, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${c.done ? "bg-emerald-500" : "bg-slate-300"}`}
                      />
                      <span className={c.done ? "text-slate-700" : "text-slate-500"}>{c.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(inspection.findings || inspection.correctiveAction) && (
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                {inspection.findings && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Temuan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{inspection.findings}</p>
                  </div>
                )}
                {inspection.correctiveAction && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Tindakan Korektif</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{inspection.correctiveAction}</p>
                  </div>
                )}
              </div>
            )}

            {inspection.photoUrls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Foto</p>
                <ul className="space-y-1">
                  {inspection.photoUrls.map((url, idx) => (
                    <li key={idx}>
                      <a href={url} target="_blank" className="text-sm text-indigo-600 hover:underline break-all">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {inspection.status === "SCHEDULED" && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Selesaikan Inspeksi</h3>
              <CompleteInspectionForm action={completeWithId} />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {inspection.status === "COMPLETED" && !inspection.approved && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Persetujuan</h3>
              {canApprove ? (
                <form action={approveWithId}>
                  <Button type="submit" className="w-full">
                    Approve
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-slate-400">Menunggu persetujuan Admin/Manager.</p>
              )}
            </Card>
          )}
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
