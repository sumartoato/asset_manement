import { prisma } from "@/lib/prisma";
import { PageHeader, Card, StatCard, LinkButton, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import { ClipboardList, ShoppingCart, PackageCheck, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATUS_COLOR: Record<string, "slate" | "amber" | "green" | "red"> = {
  DRAFT: "slate",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
};

export default async function ProcurementOverviewPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    prPending,
    poPending,
    grThisMonth,
    totalPr,
    totalPo,
    recentPrs,
    recentPos,
  ] = await Promise.all([
    prisma.purchaseRequest.count({ where: { status: "PENDING" } }),
    prisma.purchaseOrder.count({ where: { status: "PENDING" } }),
    prisma.goodsReceipt.count({ where: { receivedDate: { gte: startOfMonth } } }),
    prisma.purchaseRequest.count(),
    prisma.purchaseOrder.count(),
    prisma.purchaseRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { requestedBy: true, items: true },
    }),
    prisma.purchaseOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { vendor: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Asset Procurement" description="Alur pengadaan aset mulai dari permintaan hingga penerimaan barang" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="PR Menunggu Approval" value={prPending} icon={Clock} accent="amber" />
        <StatCard label="PO Menunggu Approval" value={poPending} icon={ShoppingCart} accent="amber" />
        <StatCard label="Goods Receipt Bulan Ini" value={grThisMonth} icon={PackageCheck} accent="green" />
        <StatCard label="Total PR / PO" value={`${totalPr} / ${totalPo}`} icon={ClipboardList} accent="indigo" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">Purchase Requests</h3>
            <ClipboardList className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Ajukan dan setujui kebutuhan pengadaan.</p>
          <LinkButton href="/procurement/requests" variant="secondary" className="w-full justify-center">
            Lihat Requests <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">Purchase Orders</h3>
            <ShoppingCart className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Kelola pesanan pembelian ke vendor.</p>
          <LinkButton href="/procurement/orders" variant="secondary" className="w-full justify-center">
            Lihat Orders <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-900">Goods Receipts</h3>
            <PackageCheck className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mb-4">Terima barang dan daftarkan sebagai aset.</p>
          <LinkButton href="/procurement/receipts" variant="secondary" className="w-full justify-center">
            Lihat Receipts <ArrowRight className="h-3.5 w-3.5" />
          </LinkButton>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Purchase Request Terbaru</h3>
            <Link href="/procurement/requests" className="text-xs text-indigo-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          {recentPrs.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada purchase request.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPrs.map((pr) => (
                <li key={pr.id} className="py-2.5">
                  <Link href={`/procurement/requests/${pr.id}`} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {pr.requestNumber} &middot; {pr.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {pr.requestedBy.name} &middot; {pr.items.length} item &middot; {formatDate(pr.createdAt)}
                      </p>
                    </div>
                    <Badge color={STATUS_COLOR[pr.status]}>{pr.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Purchase Order Terbaru</h3>
            <Link href="/procurement/orders" className="text-xs text-indigo-600 hover:underline">
              Lihat semua
            </Link>
          </div>
          {recentPos.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada purchase order.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentPos.map((po) => (
                <li key={po.id} className="py-2.5">
                  <Link href={`/procurement/orders/${po.id}`} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {po.poNumber} &middot; {po.vendor.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(po.totalAmount.toString())} &middot; {formatDate(po.orderDate)}
                      </p>
                    </div>
                    <Badge color={STATUS_COLOR[po.status]}>{po.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
