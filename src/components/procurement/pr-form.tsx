"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { PrItemRows } from "./pr-item-rows";

type Option = { id: string; name: string };

export function PrForm({ action, categories }: { action: (formData: FormData) => Promise<void>; categories: Option[] }) {
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
    <form action={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={label}>Judul Permintaan</label>
          <input name="title" required className={input} placeholder="Mis. Pengadaan Laptop Tim IT" />
        </div>
        <div>
          <label className={label}>Kebutuhan Sebelum Tanggal</label>
          <input type="date" name="neededDate" className={input} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Justifikasi</label>
          <textarea name="justification" rows={3} className={input} placeholder="Alasan/latar belakang permintaan..." />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Item Permintaan</h3>
        <PrItemRows categories={categories} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Ajukan Permintaan"}
        </Button>
      </div>
    </form>
  );
}
