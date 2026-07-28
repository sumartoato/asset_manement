"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type AssetOption = { id: string; assetCode: string; name: string };

const METHODS = ["RETIREMENT", "SALE", "DONATION", "SCRAP"] as const;

export function DisposalForm({
  action,
  assets,
}: {
  action: (formData: FormData) => Promise<void>;
  assets: AssetOption[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const input =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const label = "block text-sm font-medium text-slate-700 mb-1";

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

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Aset</label>
          <select name="assetId" required defaultValue="" className={input}>
            <option value="" disabled>
              Pilih aset...
            </option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assetCode} · {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Metode Disposal</label>
          <select name="method" required defaultValue="RETIREMENT" className={input}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={label}>Tanggal Disposal</label>
          <input
            type="date"
            name="disposalDate"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={input}
          />
        </div>

        <div>
          <label className={label}>Nilai Jual (Rp)</label>
          <input type="number" step="0.01" name="saleAmount" placeholder="0" className={input} />
          <p className="text-xs text-slate-400 mt-1">Isi hanya jika metode SALE.</p>
        </div>

        <div>
          <label className={label}>URL Dokumen Pendukung</label>
          <input name="documentUrl" placeholder="https://..." className={input} />
        </div>

        <div className="md:col-span-2">
          <label className={label}>Alasan</label>
          <textarea name="reason" rows={3} className={input} placeholder="Alasan penghapusan aset..." />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Ajukan Disposal"}
        </Button>
      </div>
    </form>
  );
}
