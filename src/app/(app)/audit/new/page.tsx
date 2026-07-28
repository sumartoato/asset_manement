import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Button } from "@/components/ui";
import { createStockOpname } from "@/lib/actions/audit";

export default async function NewStockOpnamePage() {
  const assetCount = await prisma.asset.count({ where: { status: { not: "DISPOSED" } } });

  return (
    <div>
      <PageHeader
        title="Stock Opname Baru"
        description="Sesi baru akan langsung membuat daftar aset yang diharapkan (expected) berdasarkan data master saat ini"
      />
      <Card className="p-6 max-w-xl">
        <form action={createStockOpname} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Judul Stock Opname</label>
            <input
              name="title"
              required
              placeholder={`Stock Opname ${new Date().getFullYear()}`}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-400">
            Sesi ini akan menyertakan {assetCount} aset non-disposed sebagai baseline yang diharapkan (expected).
          </p>
          <Button type="submit">Mulai Stock Opname</Button>
        </form>
      </Card>
    </div>
  );
}
