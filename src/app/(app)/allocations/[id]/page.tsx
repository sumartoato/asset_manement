import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Button } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { returnAllocation } from "@/lib/actions/allocations";
import Link from "next/link";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  PENDING: "amber",
  ACTIVE: "green",
  RETURNED: "slate",
  REJECTED: "red",
};

export default async function AllocationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const allocation = await prisma.allocation.findUnique({
    where: { id },
    include: {
      asset: true,
      employee: { include: { department: true } },
      department: true,
      project: true,
      branch: true,
    },
  });

  if (!allocation) notFound();

  const targetKind = allocation.employee
    ? "Karyawan"
    : allocation.department
      ? "Departemen"
      : allocation.project
        ? "Proyek"
        : allocation.branch
          ? "Cabang"
          : "-";
  const target =
    allocation.employee?.name ??
    allocation.department?.name ??
    allocation.project?.name ??
    allocation.branch?.name ??
    "-";

  const returnWithId = returnAllocation.bind(null, allocation.id);

  return (
    <div>
      <PageHeader
        title={`Alokasi ${allocation.asset.assetCode}`}
        description={allocation.asset.name}
        action={
          allocation.status === "ACTIVE" ? (
            <form action={returnWithId}>
              <Button type="submit" variant="secondary">
                Kembalikan Aset
              </Button>
            </form>
          ) : undefined
        }
      />

      <Card className="p-5 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Badge color={STATUS_COLOR[allocation.status]}>{allocation.status}</Badge>
          <Badge color="indigo">{allocation.type}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Aset</dt>
            <dd className="text-slate-800 font-medium">
              <Link href={`/assets/${allocation.asset.id}`} className="text-indigo-600 hover:underline">
                {allocation.asset.assetCode} — {allocation.asset.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Target ({targetKind})</dt>
            <dd className="text-slate-800 font-medium">{target}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Tanggal Alokasi</dt>
            <dd className="text-slate-800 font-medium">{formatDate(allocation.assignedDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Jatuh Tempo</dt>
            <dd className="text-slate-800 font-medium">{allocation.dueDate ? formatDate(allocation.dueDate) : "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Tanggal Kembali</dt>
            <dd className="text-slate-800 font-medium">
              {allocation.returnedDate ? formatDate(allocation.returnedDate) : "-"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Dibuat</dt>
            <dd className="text-slate-800 font-medium">{formatDate(allocation.createdAt)}</dd>
          </div>
        </dl>
        {allocation.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-1">Catatan</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{allocation.notes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
