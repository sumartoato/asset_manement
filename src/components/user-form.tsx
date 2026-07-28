"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

type Option = { id: string; name: string };

const ROLES = ["ADMIN", "MANAGER", "STAFF", "AUDITOR"] as const;

export function UserForm({
  action,
  departments,
  mode = "create",
  defaultValues,
  submitLabel = "Simpan Pengguna",
  disableRoleChange = false,
  disableActiveToggle = false,
}: {
  action: (formData: FormData) => Promise<void>;
  departments: Option[];
  mode?: "create" | "edit";
  defaultValues?: {
    name?: string;
    email?: string;
    role?: string;
    departmentId?: string | null;
    isActive?: boolean;
  };
  submitLabel?: string;
  disableRoleChange?: boolean;
  disableActiveToggle?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(formData: FormData) {
    setError(null);

    if (mode === "create") {
      if (password.length < 8) {
        setError("Kata sandi minimal 8 karakter");
        return;
      }
      if (password !== confirmPassword) {
        setError("Kata sandi dan konfirmasi kata sandi tidak sama");
        return;
      }
    } else if (password.length > 0) {
      if (password.length < 8) {
        setError("Kata sandi baru minimal 8 karakter");
        return;
      }
      if (password !== confirmPassword) {
        setError("Kata sandi baru dan konfirmasi tidak sama");
        return;
      }
    }

    setSubmitting(true);
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
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Informasi Akun</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>Nama</label>
            <input name="name" required defaultValue={defaultValues?.name} className={input} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input type="email" name="email" required defaultValue={defaultValues?.email} className={input} />
          </div>
          <div>
            <label className={label}>Peran</label>
            <select
              name={disableRoleChange ? undefined : "role"}
              required
              defaultValue={defaultValues?.role ?? "STAFF"}
              disabled={disableRoleChange}
              className={input}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {disableRoleChange && (
              <>
                <input type="hidden" name="role" value={defaultValues?.role ?? "STAFF"} />
                <p className="text-xs text-slate-400 mt-1">Anda tidak dapat mengubah peran akun Anda sendiri.</p>
              </>
            )}
          </div>
          <div>
            <label className={label}>Departemen</label>
            <select name="departmentId" defaultValue={defaultValues?.departmentId ?? ""} className={input}>
              <option value="">Tidak ada</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              name={disableActiveToggle ? undefined : "isActive"}
              defaultChecked={defaultValues?.isActive ?? true}
              disabled={disableActiveToggle}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Akun Aktif
            </label>
            {disableActiveToggle && <input type="hidden" name="isActive" value="on" />}
          </div>
          {disableActiveToggle && (
            <p className="text-xs text-slate-400 -mt-3">Anda tidak dapat menonaktifkan akun Anda sendiri.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          {mode === "create" ? "Kata Sandi" : "Reset Kata Sandi (opsional)"}
        </h3>
        {mode === "edit" && (
          <p className="text-xs text-slate-500 mb-3">
            Kosongkan kedua kolom di bawah ini jika tidak ingin mengubah kata sandi pengguna.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={label}>{mode === "create" ? "Kata Sandi" : "Kata Sandi Baru"}</label>
            <input
              type="password"
              name="password"
              required={mode === "create"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={input}
              placeholder={mode === "edit" ? "Biarkan kosong jika tidak diubah" : undefined}
            />
          </div>
          <div>
            <label className={label}>Konfirmasi Kata Sandi</label>
            <input
              type="password"
              name="confirmPassword"
              required={mode === "create"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={input}
              placeholder={mode === "edit" ? "Biarkan kosong jika tidak diubah" : undefined}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Menyimpan..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
