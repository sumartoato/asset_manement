"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type AssetOption = { id: string; assetCode: string; name: string; status: string };
type EmployeeOption = { id: string; name: string; department?: { name: string } | null };
type Option = { id: string; name: string };

type TargetKind = "EMPLOYEE" | "DEPARTMENT" | "PROJECT" | "BRANCH";
type AllocationType = "ASSIGN" | "TRANSFER" | "BORROW";

const TARGET_LABEL: Record<TargetKind, string> = {
  EMPLOYEE: "Karyawan",
  DEPARTMENT: "Departemen",
  PROJECT: "Proyek",
  BRANCH: "Cabang",
};

export function AllocationForm({
  action,
  assets,
  employees,
  departments,
  projects,
  branches,
}: {
  action: (formData: FormData) => Promise<void>;
  assets: AssetOption[];
  employees: EmployeeOption[];
  departments: Option[];
  projects: Option[];
  branches: Option[];
}) {
  const [targetKind, setTargetKind] = useState<TargetKind>("EMPLOYEE");
  const [type, setType] = useState<AllocationType>("ASSIGN");
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
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={handleSubmit} className="space-y-6">
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
                {a.assetCode} — {a.name} ({a.status})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tipe Alokasi</label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as AllocationType)}
            className={input}
          >
            <option value="ASSIGN">Assign</option>
            <option value="TRANSFER">Transfer</option>
            <option value="BORROW">Borrow</option>
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Target Alokasi</label>
        <div className="flex flex-wrap gap-4 mb-3">
          {(Object.keys(TARGET_LABEL) as TargetKind[]).map((k) => (
            <label key={k} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="radio"
                name="targetKind"
                value={k}
                checked={targetKind === k}
                onChange={() => setTargetKind(k)}
              />
              {TARGET_LABEL[k]}
            </label>
          ))}
        </div>

        {targetKind === "EMPLOYEE" && (
          <select name="employeeId" required className={input} defaultValue="">
            <option value="" disabled>
              Pilih karyawan...
            </option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
                {e.department ? ` (${e.department.name})` : ""}
              </option>
            ))}
          </select>
        )}
        {targetKind === "DEPARTMENT" && (
          <select name="departmentId" required className={input} defaultValue="">
            <option value="" disabled>
              Pilih departemen...
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
        {targetKind === "PROJECT" && (
          <select name="projectId" required className={input} defaultValue="">
            <option value="" disabled>
              Pilih proyek...
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {targetKind === "BRANCH" && (
          <select name="branchId" required className={input} defaultValue="">
            <option value="" disabled>
              Pilih cabang...
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={label}>Tanggal Alokasi</label>
          <input type="date" name="assignedDate" defaultValue={today} className={input} />
        </div>
        <div>
          <label className={label}>
            Jatuh Tempo {type === "BORROW" ? "(relevan untuk Borrow)" : "(opsional)"}
          </label>
          <input type="date" name="dueDate" className={input} />
        </div>
      </div>

      <div>
        <label className={label}>Catatan</label>
        <textarea name="notes" rows={3} className={input} />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : "Simpan Alokasi"}
        </Button>
      </div>
    </form>
  );
}
