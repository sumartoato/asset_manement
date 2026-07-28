import { Card } from "@/components/ui";
import { Trash2 } from "lucide-react";

export function MasterDataSection({
  title,
  description,
  items,
  deleteAction,
  form,
}: {
  title: string;
  description?: string;
  items: { id: string; label: string; sublabel?: string }[];
  deleteAction: (id: string) => Promise<void>;
  form: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>

      {form}

      <ul className="mt-4 divide-y divide-slate-100 max-h-64 overflow-y-auto">
        {items.length === 0 && <li className="text-sm text-slate-400 py-2">Belum ada data.</li>}
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2 text-sm">
            <div className="min-w-0">
              <p className="text-slate-800 truncate">{item.label}</p>
              {item.sublabel && <p className="text-xs text-slate-400 truncate">{item.sublabel}</p>}
            </div>
            <form
              action={async () => {
                "use server";
                await deleteAction(item.id);
              }}
            >
              <button
                type="submit"
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                title="Hapus"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  );
}

export function SelectInput({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
    >
      {children}
    </select>
  );
}
