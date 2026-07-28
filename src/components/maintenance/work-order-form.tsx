"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Asset = { id: string; assetCode: string; name: string };
type Schedule = { id: string; assetId: string; title: string };
type UserOpt = { id: string; name: string };
type VendorOpt = { id: string; name: string };

export function WorkOrderForm({
  action,
  assets,
  schedules,
  users,
  vendors,
}: {
  action: (formData: FormData) => Promise<void>;
  assets: Asset[];
  schedules: Schedule[];
  users: UserOpt[];
  vendors: VendorOpt[];
}) {
  const [assetId, setAssetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const relatedSchedules = schedules.filter((s) => s.assetId === assetId);

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
        <label className={label}>Aset</label>
        <select
          name="assetId"
          required
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          className={input}
        >
          <option value="">Pilih aset...</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.assetCode} · {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={label}>Jadwal Terkait (opsional)</label>
        <select name="maintenanceScheduleId" defaultValue="" className={input} disabled={!assetId}>
          <option value="">Tidak terkait jadwal</option>
          {relatedSchedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Tipe</label>
          <select name="type" defaultValue="CORRECTIVE" className={input}>
            <option value="CORRECTIVE">Corrective</option>
            <option value="PREVENTIVE">Preventive</option>
          </select>
        </div>
        <div>
          <label className={label}>Prioritas</label>
          <select name="priority" defaultValue="MEDIUM" className={input}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Deskripsi</label>
        <textarea name="description" required rows={3} className={input} placeholder="Deskripsi pekerjaan..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Ditugaskan ke (staf)</label>
          <select name="assignedToId" defaultValue="" className={input}>
            <option value="">Tidak ditugaskan</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Vendor</label>
          <select name="vendorId" defaultValue="" className={input}>
            <option value="">Tidak ada vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-400 -mt-2">Pilih salah satu: staf internal atau vendor eksternal.</p>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Buat Work Order"}
        </Button>
      </div>
    </form>
  );
}
