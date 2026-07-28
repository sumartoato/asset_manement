import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { createMovement, scanAssetCode } from "@/lib/actions/tracking";
import { MovementForm } from "@/components/tracking/movement-form";
import { ScanForm } from "@/components/tracking/scan-form";

const TYPE_COLOR: Record<string, "indigo" | "blue" | "purple" | "slate" | "green" | "amber" | "red"> = {
  CHECK_IN: "green",
  CHECK_OUT: "amber",
  TRANSFER: "blue",
  ALLOCATION: "indigo",
  RETURN: "slate",
  MAINTENANCE: "purple",
  DISPOSAL: "red",
};

export default async function TrackingPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  const where: Prisma.MovementHistoryWhereInput = {};
  if (code) {
    where.asset = {
      is: {
        OR: [
          { assetCode: { contains: code, mode: "insensitive" } },
          { name: { contains: code, mode: "insensitive" } },
        ],
      },
    };
  }

  const [assets, locations, movements] = await Promise.all([
    prisma.asset.findMany({
      where: { status: { not: "DISPOSED" } },
      select: { id: true, assetCode: true, name: true },
      orderBy: { assetCode: "asc" },
    }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.movementHistory.findMany({
      where,
      include: { asset: true, toLocation: true },
      orderBy: { movedAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Pelacakan Aset" description="Check-in/out, transfer lokasi, dan riwayat pergerakan aset" />

      <Card className="p-4 mb-4">
        <ScanForm action={scanAssetCode} />
      </Card>

      <Card className="p-6 mb-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Check-In / Check-Out</h3>
        <MovementForm action={createMovement} assets={assets} locations={locations} />
      </Card>

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 mb-1">Filter Kode/Nama Aset</label>
            <input
              name="code"
              defaultValue={code}
              placeholder="Kode atau nama aset..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        {movements.length === 0 ? (
          <EmptyState title="Belum ada riwayat pergerakan" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Aset</Th>
                <Th>Tipe</Th>
                <Th>Lokasi Tujuan</Th>
                <Th>Catatan</Th>
                <Th>Waktu</Th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/tracking/${m.assetId}`} className="text-indigo-600 font-medium hover:underline">
                      {m.asset.assetCode}
                    </Link>
                    <div className="text-xs text-slate-400">{m.asset.name}</div>
                  </Td>
                  <Td>
                    <Badge color={TYPE_COLOR[m.type] ?? "slate"}>{m.type.replace("_", " ")}</Badge>
                  </Td>
                  <Td>{m.toLocation?.name ?? "-"}</Td>
                  <Td className="max-w-[240px] truncate">{m.notes ?? "-"}</Td>
                  <Td>{formatDate(m.movedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {movements.length} pergerakan terakhir.</p>
    </div>
  );
}
