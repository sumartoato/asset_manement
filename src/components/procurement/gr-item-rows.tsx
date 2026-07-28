"use client";

import { useState } from "react";

type Option = { id: string; name: string };

type PoItem = {
  id: string;
  description: string;
  quantity: number;
  unitCost: number;
  categoryId: string | null;
  remaining: number;
};

type Row = {
  quantityReceived: string;
  registerAsset: boolean;
  assetName: string;
  assetCode: string;
  categoryId: string;
  serialNumber: string;
};

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function GrItemRows({
  poItems,
  categories,
  poNumber,
}: {
  poItems: PoItem[];
  categories: Option[];
  poNumber: string;
}) {
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      poItems.map((item, idx) => [
        item.id,
        {
          quantityReceived: String(Math.max(item.remaining, 0)),
          registerAsset: false,
          assetName: item.description,
          assetCode: `${poNumber}-A${idx + 1}-${randomSuffix()}`,
          categoryId: item.categoryId ?? "",
          serialNumber: "",
        },
      ])
    )
  );

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const itemsJson = JSON.stringify(
    poItems.map((item) => {
      const r = rows[item.id];
      return {
        poItemId: item.id,
        quantityReceived: r.quantityReceived,
        registerAsset: r.registerAsset,
        assetName: r.assetName,
        assetCode: r.assetCode,
        categoryId: r.categoryId || undefined,
        serialNumber: r.serialNumber || undefined,
      };
    })
  );

  const input =
    "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="space-y-4">
      <input type="hidden" name="itemsJson" value={itemsJson} />
      {poItems.map((item) => {
        const r = rows[item.id];
        return (
          <div key={item.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.description}</p>
                <p className="text-xs text-slate-400">
                  Dipesan: {item.quantity} &middot; Sudah diterima: {item.quantity - item.remaining} &middot; Sisa:{" "}
                  {item.remaining}
                </p>
              </div>
              <div className="w-32">
                <label className="block text-xs font-medium text-slate-500 mb-1">Qty Diterima</label>
                <input
                  type="number"
                  min={0}
                  className={input}
                  value={r.quantityReceived}
                  onChange={(e) => updateRow(item.id, { quantityReceived: e.target.value })}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={r.registerAsset}
                onChange={(e) => updateRow(item.id, { registerAsset: e.target.checked })}
                className="rounded border-slate-300"
              />
              Daftarkan sebagai Aset
            </label>

            {r.registerAsset && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nama Aset</label>
                  <input
                    className={input}
                    value={r.assetName}
                    onChange={(e) => updateRow(item.id, { assetName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Kode Aset</label>
                  <input
                    className={input}
                    value={r.assetCode}
                    onChange={(e) => updateRow(item.id, { assetCode: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
                  <select
                    className={input}
                    value={r.categoryId}
                    onChange={(e) => updateRow(item.id, { categoryId: e.target.value })}
                  >
                    <option value="">Pilih kategori...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Serial Number</label>
                  <input
                    className={input}
                    value={r.serialNumber}
                    onChange={(e) => updateRow(item.id, { serialNumber: e.target.value })}
                    placeholder="Opsional"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
