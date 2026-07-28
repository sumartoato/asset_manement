import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Table, Th, Td, Badge, EmptyState, Button } from "@/components/ui";
import { TextInput, SelectInput } from "@/components/master-data-section";
import { formatCurrency, formatDate } from "@/lib/format";
import { createWarranty, createVendorContract } from "@/lib/actions/warranty";

export default async function WarrantyPage() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [assets, vendors, warranties, contracts] = await Promise.all([
    prisma.asset.findMany({ select: { id: true, assetCode: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.warranty.findMany({ include: { asset: true }, orderBy: { endDate: "asc" } }),
    prisma.vendorContract.findMany({ include: { vendor: true }, orderBy: { endDate: "asc" } }),
  ]);

  function isExpiringSoon(endDate: Date) {
    return endDate >= now && endDate <= in30Days;
  }

  return (
    <div>
      <PageHeader
        title="Warranty & Contract"
        description="Kelola garansi aset dan kontrak vendor, termasuk pemantauan SLA dan pengingat perpanjangan"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Asset Warranties</h3>
          <form action={createWarranty} className="grid grid-cols-2 gap-2 mb-4">
            <SelectInput name="assetId" required className="col-span-2">
              <option value="">Pilih aset...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetCode} · {a.name}
                </option>
              ))}
            </SelectInput>
            <TextInput name="provider" placeholder="Provider garansi" required className="col-span-2" />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Mulai</label>
              <input type="date" name="startDate" required className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Berakhir</label>
              <input type="date" name="endDate" required className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <TextInput name="terms" placeholder="Ketentuan (opsional)" className="col-span-2" />
            <Button type="submit" className="col-span-2">
              Tambah Garansi
            </Button>
          </form>

          {warranties.length === 0 ? (
            <EmptyState title="Belum ada data garansi" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Aset</Th>
                  <Th>Provider</Th>
                  <Th>Mulai</Th>
                  <Th>Berakhir</Th>
                </tr>
              </thead>
              <tbody>
                {warranties.map((w) => {
                  const expiring = isExpiringSoon(w.endDate);
                  return (
                    <tr key={w.id} className={expiring ? "bg-amber-50/60" : undefined}>
                      <Td>
                        {w.asset.assetCode}
                        <div className="text-xs text-slate-400">{w.asset.name}</div>
                      </Td>
                      <Td>{w.provider}</Td>
                      <Td>{formatDate(w.startDate)}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          {formatDate(w.endDate)}
                          {expiring && <Badge color="amber">Expiring Soon</Badge>}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Vendor Contracts</h3>
          <form action={createVendorContract} className="grid grid-cols-2 gap-2 mb-4">
            <SelectInput name="vendorId" required className="col-span-2">
              <option value="">Pilih vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </SelectInput>
            <TextInput name="contractNumber" placeholder="No. Kontrak" required />
            <TextInput name="title" placeholder="Judul kontrak" required />
            <div>
              <label className="block text-xs text-slate-500 mb-1">Mulai</label>
              <input type="date" name="startDate" required className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Berakhir</label>
              <input type="date" name="endDate" required className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <TextInput name="value" placeholder="Nilai kontrak (Rp, opsional)" type="number" step="0.01" className="col-span-2" />
            <TextInput name="slaDetails" placeholder="Detail SLA (opsional)" className="col-span-2" />
            <Button type="submit" className="col-span-2">
              Tambah Kontrak
            </Button>
          </form>

          {contracts.length === 0 ? (
            <EmptyState title="Belum ada kontrak vendor" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>No. Kontrak</Th>
                  <Th>Vendor</Th>
                  <Th>Judul</Th>
                  <Th>Berakhir</Th>
                  <Th className="text-right">Nilai</Th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => {
                  const expiring = isExpiringSoon(c.endDate);
                  return (
                    <tr key={c.id} className={expiring ? "bg-amber-50/60" : undefined}>
                      <Td>{c.contractNumber}</Td>
                      <Td>{c.vendor.name}</Td>
                      <Td>{c.title}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          {formatDate(c.endDate)}
                          {expiring && <Badge color="amber">Expiring Soon</Badge>}
                        </div>
                      </Td>
                      <Td className="text-right">{c.value ? formatCurrency(c.value.toString()) : "-"}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
