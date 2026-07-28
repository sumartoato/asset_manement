import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  ArrowLeftRight,
  MapPin,
  Wrench,
  ClipboardCheck,
  TrendingDown,
  ClipboardList,
  ShieldCheck,
  Trash2,
  FileBarChart,
  Users,
  Building2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Master Asset", href: "/assets", icon: Boxes },
  { label: "Procurement", href: "/procurement", icon: ShoppingCart },
  { label: "Allocation", href: "/allocations", icon: ArrowLeftRight },
  { label: "Tracking", href: "/tracking", icon: MapPin },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Inspection", href: "/inspections", icon: ClipboardCheck },
  { label: "Depreciation", href: "/depreciation", icon: TrendingDown },
  { label: "Inventory Audit", href: "/audit", icon: ClipboardList },
  { label: "Warranty & Contract", href: "/warranty", icon: ShieldCheck },
  { label: "Disposal", href: "/disposal", icon: Trash2 },
  { label: "Reports", href: "/reports", icon: FileBarChart },
  { label: "Master Data", href: "/master-data", icon: Building2, roles: ["ADMIN", "MANAGER"] },
  { label: "Users", href: "/users", icon: Users, roles: ["ADMIN"] },
];
