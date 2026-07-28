import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PageHeader, Card, Badge, LinkButton, Button } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X } from "lucide-react";
import { approveDisposal, rejectDisposal } from "@/lib/actions/disposal";

const METHOD_COLOR: Record<string, "slate" | "green" | "blue" | "red"> = {
  RETIREMENT: "slate",
  SALE: "green",
  DONATION: "blue",
  SCRAP: "red",
};

const STATUS_COLOR: Record<string, "slate" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

const APPROVER_ROLES = ["ADMIN", "MANAGER"];

export default async function DisposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const disposal = await prisma.disposal.findUnique({
    where: { id },
    include: {
      asset: { include: { category: true, location: true, department: true } },
      approvals: { orderBy: { createdAt: "desc" }, include: { actor: true } },
    },
  });

  if (!disposal) notFound();

  const gainLoss = disposal.gainLoss !== null ? toNumber(disposal.gainLoss) : null;
  const canApprove =
    disposal.status === "PENDING" && APPROVER_ROLES.includes(session?.user?.role ?? "");

  const approveWithId = approveDisposal.bind(null, disposal.id);
  const rejectWithId = rejectDisposal.bind(null, disposal.id);

  return (
    <div>
      <PageHeader
        title={`Disposal · ${disposal.asset.name}`}
        description={`${disposal.asset.assetCode} · ${disposal.asset.category.name}`}
        action={
          <LinkButton href="/disposal" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge color={STATUS_COLOR[disposal.status]}>{disposal.status}</Badge>
              <Badge color={METHOD_COLOR[disposal.method]}>{disposal.method}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Lokasi" value={disposal.asset.location?.name} />
              <Field label="Departemen" value={disposal.asset.department?.name} />
              <Field label="Tanggal Disposal" value={formatDate(disposal.disposalDate)} />
              <Field label="Dokumen" value={disposal.documentUrl ? "Terlampir" : "-"} />
            </dl>
            {disposal.reason && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Alasan</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{disposal.reason}</p>
              </div>
            )}
            {disposal.documentUrl && (
              <div className="mt-3">
                <a
                  href={disposal.documentUrl}
                  target="_blank"
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Lihat dokumen pendukung
                </a>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Perhitungan Gain / Loss</h3>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <Field
                label="Nilai Buku saat Disposal"
                value={
                  disposal.bookValueAtDisposal !== null
                    ? formatCurrency(disposal.bookValueAtDisposal.toString())
                    : "-"
                }
              />
              <Field
                label="Nilai Jual"
                value={disposal.saleAmount !== null ? formatCurrency(disposal.saleAmount.toString()) : "-"}
              />
              <div>
                <dt className="text-xs text-slate-400">Gain / Loss</dt>
                <dd
                  className={`font-semibold mt-0.5 ${
                    gainLoss === null ? "text-slate-800" : gainLoss < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {gainLoss !== null ? formatCurrency(gainLoss) : "-"}
                  {gainLoss !== null && (
                    <span className="ml-1 text-xs font-normal">{gainLoss < 0 ? "(Loss)" : "(Gain)"}</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          {disposal.approvals.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Riwayat Persetujuan</h3>
              <ul className="space-y-3">
                {disposal.approvals.map((a) => (
                  <li key={a.id} className="text-sm flex justify-between">
                    <div>
                      <p className="font-medium text-slate-800">
                        <Badge color={STATUS_COLOR[a.status]}>{a.status}</Badge>
                        <span className="ml-2">{a.actor?.name ?? "-"}</span>
                      </p>
                      {a.comments && <p className="text-xs text-slate-400 mt-0.5">{a.comments}</p>}
                    </div>
                    <span className="text-xs text-slate-400">{a.decidedAt ? formatDate(a.decidedAt) : "-"}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canApprove && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Aksi Persetujuan</h3>
              <div className="space-y-3">
                <form action={approveWithId}>
                  <Button type="submit" className="w-full">
                    <Check className="h-4 w-4" /> Setujui Disposal
                  </Button>
                </form>
                <form action={rejectWithId} className="space-y-2">
                  <textarea
                    name="comments"
                    placeholder="Alasan penolakan (opsional)"
                    rows={2}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button type="submit" variant="danger" className="w-full">
                    <X className="h-4 w-4" /> Tolak Disposal
                  </Button>
                </form>
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Info Aset</h3>
            <dl className="space-y-3 text-sm">
              <Field label="Kode Aset" value={disposal.asset.assetCode} />
              <Field label="Status Aset" value={disposal.asset.status.replace("_", " ")} />
              <Field label="Kondisi" value={disposal.asset.condition} />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800 font-medium mt-0.5">{value || "-"}</dd>
    </div>
  );
}
