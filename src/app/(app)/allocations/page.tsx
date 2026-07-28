import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  PENDING: "amber",
  ACTIVE: "green",
  RETURNED: "slate",
  REJECTED: "red",
};

const TYPE_COLOR: Record<string, "indigo" | "blue" | "purple" | "slate" | "green"> = {
  ASSIGN: "indigo",
  TRANSFER: "blue",
  BORROW: "purple",
  RETURN: "slate",
};

export default async function AllocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>;
}) {
  const { status, type, q } = await searchParams;

  const where: Prisma.AllocationWhereInput = {};
  if (status) where.status = status as Prisma.EnumAllocationStatusFilter["equals"];
  if (type) where.type = type as Prisma.EnumAllocationTypeFilter["equals"];
  if (q) {
    where.asset = {
      is: {
        OR: [
          { assetCode: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
    };
  }

  const allocations = await prisma.allocation.findMany({
    where,
    include: { asset: true, employee: true, department: true, project: true, branch: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Alokasi Aset"
        description="Penugasan, transfer, dan peminjaman aset ke karyawan/departemen/proyek/cabang"
        action={
          <LinkButton href="/allocations/new">
            <Plus className="h-4 w-4" /> Alokasi Baru
          </LinkButton>
        }
      />

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Cari Aset</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Kode atau nama aset..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select name="status" defaultValue={status ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Status</option>
              {Object.keys(STATUS_COLOR).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipe</label>
            <select name="type" defaultValue={type ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Tipe</option>
              {["ASSIGN", "TRANSFER", "BORROW", "RETURN"].map((t) => (
                <option key={t} value={t}>
                  {t}
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
        {allocations.length === 0 ? (
          <EmptyState title="Belum ada alokasi" description="Mulai dengan membuat alokasi baru." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Aset</Th>
                <Th>Tipe</Th>
                <Th>Target</Th>
                <Th>Status</Th>
                <Th>Tanggal Alokasi</Th>
                <Th>Jatuh Tempo</Th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => {
                const target = a.employee?.name ?? a.department?.name ?? a.project?.name ?? a.branch?.name ?? "-";
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/allocations/${a.id}`} className="text-indigo-600 font-medium hover:underline">
                        {a.asset.assetCode}
                      </Link>
                      <div className="text-xs text-slate-400">{a.asset.name}</div>
                    </Td>
                    <Td>
                      <Badge color={TYPE_COLOR[a.type] ?? "slate"}>{a.type}</Badge>
                    </Td>
                    <Td>{target}</Td>
                    <Td>
                      <Badge color={STATUS_COLOR[a.status]}>{a.status}</Badge>
                    </Td>
                    <Td>{formatDate(a.assignedDate)}</Td>
                    <Td>{a.dueDate ? formatDate(a.dueDate) : "-"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {allocations.length} alokasi.</p>
    </div>
  );
}
