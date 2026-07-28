import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  ACTIVE: "green",
  IN_STORAGE: "blue",
  UNDER_MAINTENANCE: "amber",
  DAMAGED: "red",
  LOST: "red",
  DISPOSED: "slate",
  BORROWED: "indigo",
};

const TYPE_COLOR: Record<string, "indigo" | "blue" | "purple" | "slate" | "green" | "amber" | "red"> = {
  CHECK_IN: "green",
  CHECK_OUT: "amber",
  TRANSFER: "blue",
  ALLOCATION: "indigo",
  RETURN: "slate",
  MAINTENANCE: "purple",
  DISPOSAL: "red",
};

export default async function AssetTrackingPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      location: { include: { branch: true } },
      movements: { orderBy: { movedAt: "desc" }, include: { toLocation: true } },
    },
  });

  if (!asset) notFound();

  return (
    <div>
      <PageHeader title={asset.name} description={`${asset.assetCode} · Pelacakan Pergerakan Aset`} />

      <Card className="p-5 mb-4 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Badge color={STATUS_COLOR[asset.status]}>{asset.status.replace("_", " ")}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Lokasi Saat Ini</dt>
            <dd className="text-slate-800 font-medium">{asset.location?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Cabang</dt>
            <dd className="text-slate-800 font-medium">{asset.location?.branch?.name ?? "-"}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        {asset.movements.length === 0 ? (
          <EmptyState title="Belum ada riwayat pergerakan" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tipe</Th>
                <Th>Lokasi Tujuan</Th>
                <Th>Catatan</Th>
                <Th>Koordinat</Th>
                <Th>Waktu</Th>
              </tr>
            </thead>
            <tbody>
              {asset.movements.map((m) => (
                <tr key={m.id}>
                  <Td>
                    <Badge color={TYPE_COLOR[m.type] ?? "slate"}>{m.type.replace("_", " ")}</Badge>
                  </Td>
                  <Td>{m.toLocation?.name ?? "-"}</Td>
                  <Td>{m.notes ?? "-"}</Td>
                  <Td>{m.latitude != null && m.longitude != null ? `${m.latitude}, ${m.longitude}` : "-"}</Td>
                  <Td>{formatDate(m.movedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
