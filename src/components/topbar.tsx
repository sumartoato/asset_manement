"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function Topbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="md:hidden font-semibold text-slate-900 text-sm">Asset Management</div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-900 leading-tight">{name}</p>
          <p className="text-xs text-slate-500 leading-tight">{role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
          title="Keluar"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
