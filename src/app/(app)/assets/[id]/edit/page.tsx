import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { AssetForm } from "@/components/asset-form";
import { updateAsset } from "@/lib/actions/assets";
import { notFound, redirect } from "next/navigation";

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [asset, categories, types, brands, vendors, locations, departments] = await Promise.all([
    prisma.asset.findUnique({ where: { id } }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.assetType.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!asset) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateAsset(id, formData);
    redirect(`/assets/${id}`);
  }

  return (
    <div>
      <PageHeader title={`Edit Aset · ${asset.assetCode}`} />
      <Card className="p-6 max-w-4xl">
        <AssetForm
          action={action}
          categories={categories}
          types={types}
          brands={brands}
          vendors={vendors}
          locations={locations}
          departments={departments}
          submitLabel="Simpan Perubahan"
          defaultValues={{
            name: asset.name,
            assetCode: asset.assetCode,
            categoryId: asset.categoryId,
            model: asset.model,
            serialNumber: asset.serialNumber,
            specification: asset.specification,
            photoUrl: asset.photoUrl,
            condition: asset.condition,
            status: asset.status,
            invoiceNumber: asset.invoiceNumber,
            warrantyNotes: asset.warrantyNotes,
            depreciationMethod: asset.depreciationMethod,
            usefulLifeYears: asset.usefulLifeYears,
            purchaseDate: asset.purchaseDate?.toISOString().slice(0, 10),
            warrantyStart: asset.warrantyStart?.toISOString().slice(0, 10),
            warrantyEnd: asset.warrantyEnd?.toISOString().slice(0, 10),
            purchaseCost: asset.purchaseCost?.toString(),
            salvageValue: asset.salvageValue?.toString(),
            typeId: asset.typeId ?? undefined,
            brandId: asset.brandId ?? undefined,
            vendorId: asset.vendorId ?? undefined,
            locationId: asset.locationId ?? undefined,
            departmentId: asset.departmentId ?? undefined,
          }}
        />
      </Card>
    </div>
  );
}
