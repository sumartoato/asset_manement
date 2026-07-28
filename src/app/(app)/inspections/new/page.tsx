import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { InspectionForm } from "@/components/inspections/inspection-form";
import { createInspection } from "@/lib/actions/inspections";

export default async function NewInspectionPage() {
  const assets = await prisma.asset.findMany({
    select: { id: true, assetCode: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Inspeksi Baru" description="Jadwalkan inspeksi kondisi aset" />
      <Card className="p-6 max-w-2xl">
        <InspectionForm action={createInspection} assets={assets} />
      </Card>
    </div>
  );
}
