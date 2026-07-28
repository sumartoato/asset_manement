import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/ui";
import { AllocationForm } from "@/components/allocations/allocation-form";
import { createAllocation } from "@/lib/actions/allocations";

export default async function NewAllocationPage() {
  const [assets, employees, departments, projects, branches] = await Promise.all([
    prisma.asset.findMany({
      where: { status: { not: "DISPOSED" } },
      select: { id: true, assetCode: true, name: true, status: true },
      orderBy: { assetCode: "asc" },
    }),
    prisma.employee.findMany({ include: { department: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ orderBy: { name: "asc" } }),
    prisma.branch.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Alokasi Aset Baru"
        description="Assign, transfer, atau pinjamkan aset ke karyawan, departemen, proyek, atau cabang"
      />
      <Card className="p-6 max-w-3xl">
        <AllocationForm
          action={createAllocation}
          assets={assets}
          employees={employees}
          departments={departments}
          projects={projects}
          branches={branches}
        />
      </Card>
    </div>
  );
}
