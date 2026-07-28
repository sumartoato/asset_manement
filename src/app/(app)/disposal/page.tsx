import { prisma } from "@/lib/prisma";
import { PageHeader, LinkButton, Card, Table, Th, Td, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";

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

export default async function DisposalPage() {
  const disposals = await prisma.disposal.findMany({
    include: { asset: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Asset Disposal"
        description="Pengajuan dan persetujuan penghapusan aset"
        action={
          <LinkButton href="/disposal/new">
            <Plus className="h-4 w-4" /> New Disposal Request
          </LinkButton>
        }
      />

      <Card>
        {disposals.length === 0 ? (
          <EmptyState title="Belum ada pengajuan disposal" description="Mulai dengan membuat pengajuan baru." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Aset</Th>
                <Th>Metode</Th>
                <Th>Status</Th>
                <Th>Tanggal Disposal</Th>
                <Th className="text-right">Nilai Jual</Th>
                <Th className="text-right">Gain / Loss</Th>
              </tr>
            </thead>
            <tbody>
              {disposals.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/disposal/${d.id}`} className="text-indigo-600 font-medium hover:underline">
                      {d.asset.assetCode}
                    </Link>
                    <p className="text-xs text-slate-400">{d.asset.name}</p>
                  </Td>
                  <Td>
                    <Badge color={METHOD_COLOR[d.method]}>{d.method}</Badge>
                  </Td>
                  <Td>
                    <Badge color={STATUS_COLOR[d.status]}>{d.status}</Badge>
                  </Td>
                  <Td>{formatDate(d.disposalDate)}</Td>
                  <Td className="text-right">{d.saleAmount ? formatCurrency(d.saleAmount.toString()) : "-"}</Td>
                  <Td
                    className={`text-right font-medium ${
                      d.gainLoss === null
                        ? ""
                        : toNumber(d.gainLoss) < 0
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {d.gainLoss !== null ? formatCurrency(d.gainLoss.toString()) : "-"}
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

