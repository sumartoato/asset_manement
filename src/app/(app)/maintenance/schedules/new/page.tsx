import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { ScheduleForm } from "@/components/maintenance/schedule-form";
import { createMaintenanceSchedule } from "@/lib/actions/maintenance";

export default async function NewSchedulePage() {
  const assets = await prisma.asset.findMany({
    select: { id: true, assetCode: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Jadwal Maintenance Baru" description="Buat jadwal maintenance preventif atau korektif untuk sebuah aset" />
      <Card className="p-6 max-w-2xl">
        <ScheduleForm action={createMaintenanceSchedule} assets={assets} />
      </Card>
    </div>
  );
}
