import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { DisposalForm } from "@/components/disposal/disposal-form";
import { createDisposal } from "@/lib/actions/disposal";

export default async function NewDisposalPage() {
  const assets = await prisma.asset.findMany({
    where: {
      status: { not: "DISPOSED" },
      disposal: null,
    },
    select: { id: true, assetCode: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="New Disposal Request"
        description="Ajukan penghapusan aset yang sudah tidak digunakan"
      />
      <Card className="p-6 max-w-3xl">
        <DisposalForm action={createDisposal} assets={assets} />
      </Card>
    </div>
  );
}
