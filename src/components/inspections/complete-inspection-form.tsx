"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

const CONDITIONS = ["EXCELLENT", "GOOD", "FAIR", "POOR", "DAMAGED"];

export function CompleteInspectionForm({ action }: { action: (formData: FormData) => Promise<void> }) {
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
        <label className={label}>Kondisi Ditemukan</label>
        <select name="conditionFound" required defaultValue="" className={input}>
          <option value="" disabled>
            Pilih kondisi...
          </option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Temuan (Findings)</label>
        <textarea name="findings" rows={3} className={input} placeholder="Catatan temuan inspeksi..." />
      </div>

      <div>
        <label className={label}>Tindakan Korektif</label>
        <textarea name="correctiveAction" rows={3} className={input} placeholder="Rekomendasi tindak lanjut..." />
      </div>

      <div>
        <label className={label}>Foto (URL, pisahkan dengan koma atau baris baru)</label>
        <textarea name="photoUrls" rows={2} className={input} placeholder="https://... , https://..." />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Selesaikan Inspeksi"}
        </Button>
      </div>
    </form>
  );
}
