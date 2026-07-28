"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

type Option = { id: string; name: string };

export type PoRow = {
  description: string;
  categoryId: string;
  quantity: string;
  unitCost: string;
};

const emptyRow: PoRow = { description: "", categoryId: "", quantity: "1", unitCost: "" };

export function PoItemRows({ categories, defaultRows }: { categories: Option[]; defaultRows?: PoRow[] }) {
  const [rows, setRows] = useState<PoRow[]>(defaultRows && defaultRows.length > 0 ? defaultRows : [{ ...emptyRow }]);

  function updateRow(idx: number, patch: Partial<PoRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  const itemsJson = JSON.stringify(
    rows.map((r) => ({
      description: r.description,
      categoryId: r.categoryId || undefined,
      quantity: r.quantity,
      unitCost: r.unitCost,
    }))
  );

  const input =
    "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const total = rows.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.unitCost) || 0), 0);

  return (
    <div>
      <input type="hidden" name="itemsJson" value={itemsJson} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-slate-500">
              <th className="pb-2 pr-2 min-w-[200px]">Deskripsi</th>
              <th className="pb-2 pr-2 min-w-[160px]">Kategori</th>
              <th className="pb-2 pr-2 w-24">Qty</th>
              <th className="pb-2 pr-2 w-40">Harga Satuan</th>
              <th className="pb-2 pr-2 w-40 text-right">Subtotal</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                <td className="py-1.5 pr-2">
                  <input
                    className={input}
                    value={row.description}
                    onChange={(e) => updateRow(idx, { description: e.target.value })}
                    placeholder="Nama barang/jasa"
                    required
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <select
                    className={input}
                    value={row.categoryId}
                    onChange={(e) => updateRow(idx, { categoryId: e.target.value })}
                  >
                    <option value="">Pilih kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min={1}
                    className={input}
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                    required
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={input}
                    value={row.unitCost}
                    onChange={(e) => updateRow(idx, { unitCost: e.target.value })}
                    placeholder="0"
                    required
                  />
                </td>
                <td className="py-1.5 pr-2 text-right text-slate-600">
                  {((parseFloat(row.quantity) || 0) * (parseFloat(row.unitCost) || 0)).toLocaleString("id-ID")}
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length === 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="h-4 w-4" /> Tambah Item
        </button>
        <p className="text-sm text-slate-500">
          Total: <span className="font-semibold text-slate-800">Rp {total.toLocaleString("id-ID")}</span>
        </p>
      </div>
    </div>
  );
}
