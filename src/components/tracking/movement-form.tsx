"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type AssetOption = { id: string; assetCode: string; name: string };
type LocationOption = { id: string; name: string };

export function MovementForm({
  action,
  assets,
  locations,
}: {
  action: (formData: FormData) => Promise<void>;
  assets: AssetOption[];
  locations: LocationOption[];
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
    } finally {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Aset</label>
          <select name="assetId" required className={input} defaultValue="">
            <option value="" disabled>
              Pilih aset...
            </option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.assetCode} — {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tipe Pergerakan</label>
          <select name="type" required className={input} defaultValue="CHECK_IN">
            <option value="CHECK_IN">Check-In</option>
            <option value="CHECK_OUT">Check-Out</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>
        <div>
          <label className={label}>Lokasi Tujuan</label>
          <select name="toLocationId" className={input} defaultValue="">
            <option value="">Pilih lokasi...</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Catatan</label>
          <input name="notes" className={input} />
        </div>
      </div>

      <div>
        <p className={label}>GPS Tracking (Opsional)</p>
        <div className="grid grid-cols-2 gap-4">
          <input type="number" step="any" name="latitude" placeholder="Latitude" className={input} />
          <input type="number" step="any" name="longitude" placeholder="Longitude" className={input} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Catat Pergerakan"}
        </Button>
      </div>
    </form>
  );
}
