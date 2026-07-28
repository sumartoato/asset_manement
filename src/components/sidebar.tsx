"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import clsx from "clsx";

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-200">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Boxes className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm leading-tight">
          Asset Management
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
