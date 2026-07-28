"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { Search } from "lucide-react";

export function ScanForm({ action }: { action: (formData: FormData) => Promise<void> }) {
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

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[220px]">
        <label className="block text-sm font-medium text-slate-700 mb-1">Scan / Masukkan Kode Aset</label>
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            name="code"
            required
            placeholder="AST-2026-0001"
            className="w-full rounded-md border border-slate-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Mencari..." : "Cari Aset"}
      </Button>
      {error && <p className="text-sm text-red-600 w-full">{error}</p>}
    </form>
  );
}
