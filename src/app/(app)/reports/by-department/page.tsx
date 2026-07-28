import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatCurrency, toNumber } from "@/lib/format";
import Link from "next/link";

export default async function ByDepartmentReportPage() {
  const [grouped, departments] = await Promise.all([
    prisma.asset.groupBy({
      by: ["departmentId"],
      _count: { _all: true },
      _sum: { purchaseCost: true },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
  const rows = grouped
    .map((g) => ({
      departmentId: g.departmentId,
      name: g.departmentId ? (departmentMap.get(g.departmentId) ?? "Tidak diketahui") : "Belum ditugaskan",
      count: g._count._all,
      totalValue: toNumber(g._sum.purchaseCost),
    }))
    .sort((a, b) => b.count - a.count);

  const grandTotalCount = rows.reduce((s, r) => s + r.count, 0);
  const grandTotalValue = rows.reduce((s, r) => s + r.totalValue, 0);

  return (
    <div>
      <PageHeader title="Laporan per Departemen" description="Jumlah dan total nilai aset dikelompokkan berdasarkan departemen" />

      <Card>
        {rows.length === 0 ? (
          <EmptyState title="Belum ada data aset" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Departemen</Th>
                <Th className="text-right">Jumlah Aset</Th>
                <Th className="text-right">Total Nilai Perolehan</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.departmentId ?? "none"} className="hover:bg-slate-50">
                  <Td>{r.name}</Td>
                  <Td className="text-right">{r.count}</Td>
                  <Td className="text-right">{formatCurrency(r.totalValue)}</Td>
                  <Td>
                    {r.departmentId && (
                      <Link href={`/reports/asset-register?departmentId=${r.departmentId}`} className="text-indigo-600 hover:underline text-xs">
                        Lihat detail &rarr;
                      </Link>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <Td>Total</Td>
                <Td className="text-right">{grandTotalCount}</Td>
                <Td className="text-right">{formatCurrency(grandTotalValue)}</Td>
                <Td> </Td>
              </tr>
            </tfoot>
          </Table>
        )}
      </Card>
    </div>
  );
}
