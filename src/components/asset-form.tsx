"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Option = { id: string; name: string };

export function AssetForm({
  action,
  categories,
  types,
  brands,
  vendors,
  locations,
  departments,
  defaultValues,
  submitLabel = "Simpan Aset",
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Option[];
  types: (Option & { categoryId: string })[];
  brands: Option[];
  vendors: Option[];
  locations: Option[];
  departments: Option[];
  defaultValues?: Record<string, string | number | null | undefined>;
  submitLabel?: string;
}) {
  const [categoryId, setCategoryId] = useState(String(defaultValues?.categoryId ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredTypes = types.filter((t) => t.categoryId === categoryId);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await action(formData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  }

  const input =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const label = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Informasi Umum</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nama Aset</label>
            <input name="name" required defaultValue={defaultValues?.name as string} className={input} />
          </div>
          <div>
            <label className={label}>Kode Aset (Asset Code)</label>
            <input
              name="assetCode"
              required
              defaultValue={defaultValues?.assetCode as string}
              className={input}
              placeholder="AST-2026-0001"
            />
          </div>
          <div>
            <label className={label}>Kategori</label>
            <select
              name="categoryId"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={input}
            >
              <option value="">Pilih kategori...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Tipe</label>
            <select name="typeId" defaultValue={defaultValues?.typeId as string} className={input}>
              <option value="">Pilih tipe...</option>
              {filteredTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Brand</label>
            <select name="brandId" defaultValue={defaultValues?.brandId as string} className={input}>
              <option value="">Pilih brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Model</label>
            <input name="model" defaultValue={defaultValues?.model as string} className={input} />
          </div>
          <div>
            <label className={label}>Serial Number</label>
            <input name="serialNumber" defaultValue={defaultValues?.serialNumber as string} className={input} />
          </div>
          <div>
            <label className={label}>Foto (URL)</label>
            <input name="photoUrl" defaultValue={defaultValues?.photoUrl as string} className={input} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Spesifikasi</label>
            <textarea name="specification" defaultValue={defaultValues?.specification as string} className={input} rows={3} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Status & Kondisi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Status</label>
            <select name="status" defaultValue={(defaultValues?.status as string) ?? "ACTIVE"} className={input}>
              {["ACTIVE", "IN_STORAGE", "UNDER_MAINTENANCE", "DAMAGED", "LOST", "DISPOSED", "BORROWED"].map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Kondisi</label>
            <select name="condition" defaultValue={(defaultValues?.condition as string) ?? "GOOD"} className={input}>
              {["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Lokasi</label>
            <select name="locationId" defaultValue={defaultValues?.locationId as string} className={input}>
              <option value="">Pilih lokasi...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Departemen</label>
            <select name="departmentId" defaultValue={defaultValues?.departmentId as string} className={input}>
              <option value="">Pilih departemen...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Informasi Pembelian & Vendor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Vendor</label>
            <select name="vendorId" defaultValue={defaultValues?.vendorId as string} className={input}>
              <option value="">Pilih vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>No. Invoice</label>
            <input name="invoiceNumber" defaultValue={defaultValues?.invoiceNumber as string} className={input} />
          </div>
          <div>
            <label className={label}>Tanggal Pembelian</label>
            <input type="date" name="purchaseDate" defaultValue={defaultValues?.purchaseDate as string} className={input} />
          </div>
          <div>
            <label className={label}>Harga Perolehan (Rp)</label>
            <input type="number" step="0.01" name="purchaseCost" defaultValue={defaultValues?.purchaseCost as string} className={input} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Garansi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Mulai Garansi</label>
            <input type="date" name="warrantyStart" defaultValue={defaultValues?.warrantyStart as string} className={input} />
          </div>
          <div>
            <label className={label}>Berakhir Garansi</label>
            <input type="date" name="warrantyEnd" defaultValue={defaultValues?.warrantyEnd as string} className={input} />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Catatan Garansi</label>
            <input name="warrantyNotes" defaultValue={defaultValues?.warrantyNotes as string} className={input} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Penyusutan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={label}>Metode</label>
            <select
              name="depreciationMethod"
              defaultValue={(defaultValues?.depreciationMethod as string) ?? "STRAIGHT_LINE"}
              className={input}
            >
              <option value="STRAIGHT_LINE">Straight Line</option>
              <option value="DECLINING_BALANCE">Declining Balance</option>
            </select>
          </div>
          <div>
            <label className={label}>Umur Manfaat (tahun)</label>
            <input type="number" name="usefulLifeYears" defaultValue={defaultValues?.usefulLifeYears as string} className={input} />
          </div>
          <div>
            <label className={label}>Nilai Sisa (Rp)</label>
            <input type="number" step="0.01" name="salvageValue" defaultValue={defaultValues?.salvageValue as string} className={input} />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
