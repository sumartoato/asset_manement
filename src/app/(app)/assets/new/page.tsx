import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { AssetForm } from "@/components/asset-form";
import { createAsset } from "@/lib/actions/assets";

export default async function NewAssetPage() {
  const [categories, types, brands, vendors, locations, departments] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.assetType.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Registrasi Aset Baru" description="Lengkapi data aset untuk mendaftarkan ke master asset" />
      <Card className="p-6 max-w-4xl">
        <AssetForm
          action={createAsset}
          categories={categories}
          types={types}
          brands={brands}
          vendors={vendors}
          locations={locations}
          departments={departments}
        />
      </Card>
    </div>
  );
}
