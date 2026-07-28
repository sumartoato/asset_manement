import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { WorkOrderForm } from "@/components/maintenance/work-order-form";
import { createWorkOrder } from "@/lib/actions/maintenance";

export default async function NewWorkOrderPage() {
  const [assets, schedules, users, vendors] = await Promise.all([
    prisma.asset.findMany({ select: { id: true, assetCode: true, name: true }, orderBy: { name: "asc" } }),
    prisma.maintenanceSchedule.findMany({
      where: { status: "SCHEDULED" },
      select: { id: true, assetId: true, title: true },
    }),
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Work Order Baru" description="Buat perintah kerja maintenance untuk sebuah aset" />
      <Card className="p-6 max-w-2xl">
        <WorkOrderForm action={createWorkOrder} assets={assets} schedules={schedules} users={users} vendors={vendors} />
      </Card>
    </div>
  );
}
