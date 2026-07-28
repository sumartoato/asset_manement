"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { PoItemRows, type PoRow } from "./po-item-rows";

type Option = { id: string; name: string };

export function PoForm({
  action,
  categories,
  vendors,
  purchaseRequests,
  defaultPurchaseRequestId,
  defaultRows,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Option[];
  vendors: Option[];
  purchaseRequests: (Option & { requestNumber: string })[];
  defaultPurchaseRequestId?: string;
  defaultRows?: PoRow[];
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
    <form action={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Vendor</label>
          <select name="vendorId" required defaultValue="" className={input}>
            <option value="" disabled>
              Pilih vendor...
            </option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Terkait Purchase Request (opsional)</label>
          <select name="purchaseRequestId" defaultValue={defaultPurchaseRequestId ?? ""} className={input}>
            <option value="">Tanpa Purchase Request</option>
            {purchaseRequests.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.requestNumber} &middot; {pr.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tanggal Diharapkan Tiba</label>
          <input type="date" name="expectedDate" className={input} />
        </div>
        <div className="md:col-span-2">
          <label className={label}>Catatan</label>
          <textarea name="notes" rows={2} className={input} />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Item Pesanan</h3>
        <PoItemRows categories={categories} defaultRows={defaultRows} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Buat Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
