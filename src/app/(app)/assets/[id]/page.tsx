import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, LinkButton, Button, Table, Th, Td, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { Pencil, Trash2, FileText } from "lucide-react";
import { addAssetDocument, deleteAssetDocument, deleteAsset } from "@/lib/actions/assets";

const STATUS_COLOR: Record<string, "green" | "amber" | "red" | "slate" | "blue" | "indigo"> = {
  ACTIVE: "green",
  IN_STORAGE: "blue",
  UNDER_MAINTENANCE: "amber",
  DAMAGED: "red",
  LOST: "red",
  DISPOSED: "slate",
  BORROWED: "indigo",
};

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      category: true,
      type: true,
      brand: true,
      vendor: true,
      location: { include: { branch: true } },
      department: true,
      documents: { orderBy: { uploadedAt: "desc" } },
      movements: { orderBy: { movedAt: "desc" }, take: 5, include: { toLocation: true } },
      allocations: { orderBy: { createdAt: "desc" }, take: 5, include: { employee: true, department: true } },
      maintenanceSchedules: { orderBy: { scheduledDate: "desc" }, take: 5 },
      depreciationEntries: { orderBy: { period: "desc" }, take: 6 },
    },
  });

  if (!asset) notFound();

  const qrDataUrl = await QRCode.toDataURL(asset.assetCode, { margin: 1, width: 160 });

  const deleteWithId = deleteAsset.bind(null, asset.id);
  const addDocWithId = addAssetDocument.bind(null, asset.id);

  return (
    <div>
      <PageHeader
        title={asset.name}
        description={`${asset.assetCode} · ${asset.category.name}`}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/assets/${asset.id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" /> Edit
            </LinkButton>
            <form action={deleteWithId}>
              <Button type="submit" variant="danger">
                <Trash2 className="h-4 w-4" /> Hapus
              </Button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge color={STATUS_COLOR[asset.status]}>{asset.status.replace("_", " ")}</Badge>
              <Badge color="slate">{asset.condition}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Tipe" value={asset.type?.name} />
              <Field label="Brand / Model" value={[asset.brand?.name, asset.model].filter(Boolean).join(" / ")} />
              <Field label="Serial Number" value={asset.serialNumber} />
              <Field label="Barcode / QR" value={asset.barcode} />
              <Field label="Lokasi" value={asset.location?.name} />
              <Field label="Departemen" value={asset.department?.name} />
              <Field label="Vendor" value={asset.vendor?.name} />
              <Field label="No. Invoice" value={asset.invoiceNumber} />
              <Field label="Tanggal Beli" value={formatDate(asset.purchaseDate)} />
              <Field label="Harga Perolehan" value={asset.purchaseCost ? formatCurrency(asset.purchaseCost.toString()) : "-"} />
              <Field label="Garansi" value={asset.warrantyEnd ? `s/d ${formatDate(asset.warrantyEnd)}` : "-"} />
              <Field label="Metode Penyusutan" value={asset.depreciationMethod.replace("_", " ")} />
              <Field label="Umur Manfaat" value={asset.usefulLifeYears ? `${asset.usefulLifeYears} tahun` : "-"} />
              <Field label="Nilai Sisa" value={asset.salvageValue ? formatCurrency(asset.salvageValue.toString()) : "-"} />
            </dl>
            {asset.specification && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Spesifikasi</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{asset.specification}</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Dokumen Aset</h3>
            <form action={addDocWithId} className="flex flex-wrap gap-2 mb-4">
              <input name="name" placeholder="Nama dokumen" required className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm flex-1 min-w-[140px]" />
              <input name="fileUrl" placeholder="URL file" required className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm flex-1 min-w-[140px]" />
              <select name="type" className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm">
                <option value="INVOICE">Invoice</option>
                <option value="WARRANTY">Warranty</option>
                <option value="MANUAL">Manual</option>
                <option value="PHOTO">Photo</option>
                <option value="OTHER">Other</option>
              </select>
              <Button type="submit">Tambah</Button>
            </form>
            {asset.documents.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada dokumen.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {asset.documents.map((doc) => {
                  const del = deleteAssetDocument.bind(null, asset.id, doc.id);
                  return (
                    <li key={doc.id} className="flex items-center justify-between py-2 text-sm">
                      <a href={doc.fileUrl} target="_blank" className="flex items-center gap-2 text-indigo-600 hover:underline min-w-0">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{doc.name}</span>
                        <Badge color="slate">{doc.type}</Badge>
                      </a>
                      <form action={del}>
                        <button type="submit" className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Riwayat Alokasi Terakhir</h3>
            {asset.allocations.length === 0 ? (
              <EmptyState title="Belum ada alokasi" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Tipe</Th>
                    <Th>Ke</Th>
                    <Th>Status</Th>
                    <Th>Tanggal</Th>
                  </tr>
                </thead>
                <tbody>
                  {asset.allocations.map((a) => (
                    <tr key={a.id}>
                      <Td>{a.type}</Td>
                      <Td>{a.employee?.name ?? a.department?.name ?? "-"}</Td>
                      <Td><Badge>{a.status}</Badge></Td>
                      <Td>{formatDate(a.assignedDate)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 flex flex-col items-center text-center">
            <p className="text-xs font-medium text-slate-500 mb-2">QR Code / Barcode</p>
            <Image src={qrDataUrl} alt="QR Code" width={140} height={140} unoptimized />
            <p className="text-sm font-mono mt-2 text-slate-700">{asset.assetCode}</p>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Riwayat Pergerakan</h3>
            {asset.movements.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada pergerakan.</p>
            ) : (
              <ul className="space-y-3">
                {asset.movements.map((m) => (
                  <li key={m.id} className="text-sm">
                    <p className="font-medium text-slate-800">{m.type.replace("_", " ")}</p>
                    <p className="text-xs text-slate-400">
                      {m.toLocation?.name ?? "-"} &middot; {formatDate(m.movedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Penyusutan Terakhir</h3>
            {asset.depreciationEntries.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada entri penyusutan.</p>
            ) : (
              <ul className="space-y-2">
                {asset.depreciationEntries.map((d) => (
                  <li key={d.id} className="flex justify-between text-sm">
                    <span className="text-slate-500">{formatDate(d.period)}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(d.amount.toString())}</span>
                  </li>
                ))}
              </ul>
            )}
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
      <dd className="text-slate-800 font-medium">{value || "-"}</dd>
    </div>
  );
}
