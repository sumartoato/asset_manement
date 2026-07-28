import { prisma } from "@/lib/prisma";
import { PageHeader, Card, LinkButton, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";

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

export default async function InspectionsPage() {
  const inspections = await prisma.inspection.findMany({
    include: { asset: true },
    orderBy: { scheduledDate: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        title="Asset Inspection"
        description="Jadwalkan dan catat hasil inspeksi kondisi aset"
        action={
          <LinkButton href="/inspections/new">
            <Plus className="h-4 w-4" /> Inspeksi Baru
          </LinkButton>
        }
      />

      <Card>
        {inspections.length === 0 ? (
          <EmptyState title="Belum ada inspeksi" description="Buat jadwal inspeksi baru untuk memulai." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Aset</Th>
                <Th>Tanggal Jadwal</Th>
                <Th>Status</Th>
                <Th>Kondisi Ditemukan</Th>
                <Th>Disetujui</Th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/inspections/${i.id}`} className="text-indigo-600 font-medium hover:underline">
                      {i.asset.assetCode}
                    </Link>
                    <div className="text-xs text-slate-400">{i.asset.name}</div>
                  </Td>
                  <Td>{formatDate(i.scheduledDate)}</Td>
                  <Td>
                    <Badge color={STATUS_COLOR[i.status]}>{i.status}</Badge>
                  </Td>
                  <Td>
                    {i.conditionFound ? (
                      <Badge color={CONDITION_COLOR[i.conditionFound]}>{i.conditionFound}</Badge>
                    ) : (
                      "-"
                    )}
                  </Td>
                  <Td>
                    <Badge color={i.approved ? "green" : "slate"}>{i.approved ? "Ya" : "Tidak"}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
