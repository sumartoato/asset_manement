"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function ApprovalPanel({ action }: { action: (formData: FormData) => Promise<void> }) {
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function handle(decision: "APPROVED" | "REJECTED") {
    setSubmitting(decision);
    setError(null);
    const fd = new FormData();
    fd.set("decision", decision);
    fd.set("comments", comments);
    try {
      await action(fd);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Komentar (opsional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Catatan approval..."
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={() => handle("APPROVED")} disabled={submitting !== null}>
          {submitting === "APPROVED" ? "Memproses..." : "Setujui"}
        </Button>
        <Button type="button" variant="danger" onClick={() => handle("REJECTED")} disabled={submitting !== null}>
          {submitting === "REJECTED" ? "Memproses..." : "Tolak"}
        </Button>
      </div>
    </div>
  );
}
