"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { ChecklistRows, type ChecklistItem } from "@/components/maintenance/checklist-rows";

export function ChecklistPanel({
  action,
  initialItems,
}: {
  action: (formData: FormData) => Promise<void>;
  initialItems: ChecklistItem[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      await action(formData);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">{error}</p>
      )}
      <ChecklistRows initialItems={initialItems} />
      <div className="flex items-center gap-3 mt-3">
        <Button type="submit" variant="secondary" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Checklist"}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Tersimpan.</span>}
      </div>
    </form>
  );
}

export function SparePartForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      await action(formData);
      const form = document.getElementById("spare-part-form") as HTMLFormElement | null;
      form?.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-2">{error}</p>
      )}
      <form id="spare-part-form" action={handleSubmit} className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Nama Part</label>
          <input name="partName" required placeholder="mis. Filter oli" className={input} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Qty</label>
          <input type="number" name="quantity" min={1} defaultValue={1} required className={`${input} w-20`} />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Harga Satuan (Rp)</label>
          <input type="number" name="unitCost" min={0} step="0.01" defaultValue={0} required className={`${input} w-32`} />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menambah..." : "Tambah Part"}
        </Button>
      </form>
    </div>
  );
}

export function LaborCostForm({
  action,
  defaultValue,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValue: number;
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
    "rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <form action={handleSubmit} className="flex items-end gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Biaya Tenaga Kerja (Rp)</label>
        <input type="number" name="laborCost" min={0} step="0.01" defaultValue={defaultValue} className={`${input} w-40`} />
      </div>
      <Button type="submit" variant="secondary" disabled={submitting}>
        {submitting ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}

export function StatusActions({
  status,
  onStart,
  onComplete,
  onCancel,
}: {
  status: string;
  onStart: () => Promise<void>;
  onComplete: () => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(name: string, fn: () => Promise<void>) {
    setSubmitting(name);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {status === "SCHEDULED" && (
          <Button onClick={() => run("start", onStart)} disabled={submitting !== null}>
            {submitting === "start" ? "Memulai..." : "Start"}
          </Button>
        )}
        {status === "IN_PROGRESS" && (
          <Button onClick={() => run("complete", onComplete)} disabled={submitting !== null}>
            {submitting === "complete" ? "Menyelesaikan..." : "Complete"}
          </Button>
        )}
        {(status === "SCHEDULED" || status === "IN_PROGRESS") && (
          <Button variant="danger" onClick={() => run("cancel", onCancel)} disabled={submitting !== null}>
            {submitting === "cancel" ? "Membatalkan..." : "Cancel"}
          </Button>
        )}
      </div>
    </div>
  );
}
