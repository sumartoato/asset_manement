import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { PrForm } from "@/components/procurement/pr-form";
import { createPurchaseRequest } from "@/lib/actions/procurement";

export default async function NewPurchaseRequestPage() {
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Purchase Request Baru" description="Ajukan permintaan pembelian aset baru" />
      <Card className="p-6 max-w-4xl">
        <PrForm action={createPurchaseRequest} categories={categories} />
      </Card>
    </div>
  );
}
