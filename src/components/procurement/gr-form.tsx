"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { GrItemRows } from "./gr-item-rows";

type Option = { id: string; name: string };
type PoItem = {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  categoryId: string | null;
  remaining: number;
};
type PoOption = { id: string; poNumber: string; vendorName: string; items: PoItem[] };

export function GrForm({
  action,
  categories,
  purchaseOrders,
  defaultPurchaseOrderId,
}: {
  action: (formData: FormData) => Promise<void>;
  categories: Option[];
  purchaseOrders: PoOption[];
  defaultPurchaseOrderId?: string;
}) {
  const [poId, setPoId] = useState(defaultPurchaseOrderId && purchaseOrders.some((p) => p.id === defaultPurchaseOrderId) ? defaultPurchaseOrderId : "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedPo = purchaseOrders.find((p) => p.id === poId);

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
          <label className={label}>Purchase Order</label>
          <select
            name="purchaseOrderId"
            required
            value={poId}
            onChange={(e) => setPoId(e.target.value)}
            className={input}
          >
            <option value="" disabled>
              Pilih PO...
            </option>
            {purchaseOrders.map((po) => (
              <option key={po.id} value={po.id}>
                {po.poNumber} &middot; {po.vendorName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tanggal Diterima</label>
          <input type="date" name="receivedDate" defaultValue={new Date().toISOString().slice(0, 10)} className={input} />
        </div>
        <div>
          <label className={label}>URL File Invoice</label>
          <input name="invoiceFileUrl" className={input} placeholder="https://..." />
        </div>
        <div>
          <label className={label}>No. Invoice / Catatan</label>
          <input name="notes" className={input} placeholder="Nomor invoice vendor..." />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Item Diterima</h3>
        {selectedPo && selectedPo.items.length > 0 ? (
          <GrItemRows key={selectedPo.id} poItems={selectedPo.items} categories={categories} poNumber={selectedPo.poNumber} />
        ) : (
          <p className="text-sm text-slate-400">
            {purchaseOrders.length === 0 ? "Tidak ada Purchase Order yang siap diterima." : "Pilih Purchase Order untuk menampilkan item."}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting || !selectedPo}>
          {submitting ? "Menyimpan..." : "Simpan Penerimaan"}
        </Button>
      </div>
    </form>
  );
}
