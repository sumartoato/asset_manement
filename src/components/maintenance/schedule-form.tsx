"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Option = { id: string; assetCode: string; name: string };

export function ScheduleForm({
  action,
  assets,
}: {
  action: (formData: FormData) => Promise<void>;
  assets: Option[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <div>
        <label className={label}>Aset</label>
        <select name="assetId" required className={input}>
          <option value="">Pilih aset...</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.assetCode} · {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Tipe</label>
          <select name="type" defaultValue="PREVENTIVE" className={input}>
            <option value="PREVENTIVE">Preventive</option>
            <option value="CORRECTIVE">Corrective</option>
          </select>
        </div>
        <div>
          <label className={label}>Frekuensi (hari, opsional)</label>
          <input type="number" min={1} name="frequencyDays" className={input} placeholder="mis. 90" />
        </div>
      </div>

      <div>
        <label className={label}>Judul</label>
        <input name="title" required className={input} placeholder="mis. Pembersihan rutin AC" />
      </div>

      <div>
        <label className={label}>Tanggal Jadwal</label>
        <input type="date" name="scheduledDate" required className={input} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Jadwal"}
        </Button>
      </div>
    </form>
  );
}
