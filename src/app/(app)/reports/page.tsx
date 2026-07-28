import { PageHeader, Card } from "@/components/ui";
import {
  ClipboardList,
  LayoutGrid,
  Building2,
  MapPin,
  Wallet,
  TrendingDown,
  Wrench,
  ArrowLeftRight,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const REPORTS: { href: string; title: string; description: string; icon: LucideIcon }[] = [
  {
    href: "/reports/asset-register",
    title: "Asset Register",
    description: "Daftar lengkap seluruh aset beserta data master, status, dan nilai buku saat ini.",
    icon: ClipboardList,
  },
  {
    href: "/reports/by-category",
    title: "Laporan per Kategori",
    description: "Jumlah dan total nilai aset dikelompokkan berdasarkan kategori.",
    icon: LayoutGrid,
  },
  {
    href: "/reports/by-department",
    title: "Laporan per Departemen",
    description: "Jumlah dan total nilai aset dikelompokkan berdasarkan departemen.",
    icon: Building2,
  },
  {
    href: "/reports/by-location",
    title: "Laporan per Lokasi",
    description: "Jumlah dan total nilai aset dikelompokkan berdasarkan lokasi.",
    icon: MapPin,
  },
  {
    href: "/reports/value",
    title: "Asset Value Report",
    description: "Total nilai perolehan, akumulasi penyusutan, dan nilai buku aset per kategori.",
    icon: Wallet,
  },
  {
    href: "/reports/depreciation",
    title: "Depreciation Report",
    description: "Rincian entri penyusutan tahun berjalan per aset dengan total bulanan.",
    icon: TrendingDown,
  },
  {
    href: "/reports/maintenance",
    title: "Maintenance Report",
    description: "Seluruh work order pemeliharaan beserta rincian biaya tenaga kerja dan suku cadang.",
    icon: Wrench,
  },
  {
    href: "/reports/movement",
    title: "Asset Movement Report",
    description: "Riwayat pergerakan aset antar lokasi, dapat difilter berdasarkan aset dan tanggal.",
    icon: ArrowLeftRight,
  },
  {
    href: "/reports/disposal",
    title: "Disposal Report",
    description: "Daftar aset yang telah dihapuskan beserta metode, nilai jual, dan gain/loss.",
    icon: Trash2,
  },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" description="Pusat laporan aset — pilih laporan yang ingin ditampilkan" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <Link key={r.href} href={r.href}>
            <Card className="p-5 h-full hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600 mb-3">
                <r.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{r.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
