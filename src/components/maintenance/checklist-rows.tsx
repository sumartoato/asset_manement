"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export type ChecklistItem = { item: string; done: boolean };

export function ChecklistRows({
  name = "checklist",
  initialItems,
}: {
  name?: string;
  initialItems?: ChecklistItem[];
}) {
  const [rows, setRows] = useState<ChecklistItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : [{ item: "", done: false }]
  );

  function updateRow(idx: number, patch: Partial<ChecklistItem>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { item: "", done: false }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  const json = JSON.stringify(rows.filter((r) => r.item.trim().length > 0));

  const input =
    "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div>
      <input type="hidden" name={name} value={json} />
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={row.done}
              onChange={(e) => updateRow(idx, { done: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
            />
            <input
              className={input}
              value={row.item}
              onChange={(e) => updateRow(idx, { item: e.target.value })}
              placeholder="Item checklist..."
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={rows.length === 1}
              className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <Plus className="h-4 w-4" /> Tambah Item
      </button>
    </div>
  );
}
