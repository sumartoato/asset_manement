import { prisma } from "@/lib/prisma";
import { PageHeader, Button } from "@/components/ui";
import { MasterDataSection, TextInput, SelectInput } from "@/components/master-data-section";
import {
  createDepartment,
  deleteDepartment,
  createBranch,
  deleteBranch,
  createLocation,
  deleteLocation,
  createEmployee,
  deleteEmployee,
  createProject,
  deleteProject,
  createVendor,
  deleteVendor,
  createAssetCategory,
  deleteAssetCategory,
  createAssetType,
  deleteAssetType,
  createBrand,
  deleteBrand,
} from "@/lib/actions/master-data";

export default async function MasterDataPage() {
  const [departments, branches, locations, employees, projects, vendors, categories, types, brands] =
    await Promise.all([
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.branch.findMany({ orderBy: { name: "asc" } }),
      prisma.location.findMany({ include: { branch: true }, orderBy: { name: "asc" } }),
      prisma.employee.findMany({ include: { department: true }, orderBy: { name: "asc" } }),
      prisma.project.findMany({ orderBy: { name: "asc" } }),
      prisma.vendor.findMany({ orderBy: { name: "asc" } }),
      prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.assetType.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
      prisma.brand.findMany({ orderBy: { name: "asc" } }),
    ]);

  return (
    <div>
      <PageHeader title="Master Data" description="Kelola data referensi yang digunakan di seluruh modul" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <MasterDataSection
          title="Asset Category"
          items={categories.map((c) => ({ id: c.id, label: c.name, sublabel: `${c.code} · ${c.usefulLifeYears} thn` }))}
          deleteAction={deleteAssetCategory}
          form={
            <form action={createAssetCategory} className="grid grid-cols-3 gap-2">
              <TextInput name="name" placeholder="Nama kategori" required className="col-span-3" />
              <TextInput name="code" placeholder="Kode" required />
              <TextInput name="usefulLifeYears" placeholder="Umur (thn)" type="number" defaultValue={5} />
              <Button type="submit" className="col-span-1">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Asset Type"
          items={types.map((t) => ({ id: t.id, label: t.name, sublabel: t.category.name }))}
          deleteAction={deleteAssetType}
          form={
            <form action={createAssetType} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama tipe" required className="col-span-2" />
              <SelectInput name="categoryId" required className="col-span-1">
                <option value="">Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SelectInput>
              <Button type="submit">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Brand"
          items={brands.map((b) => ({ id: b.id, label: b.name }))}
          deleteAction={deleteBrand}
          form={
            <form action={createBrand} className="flex gap-2">
              <TextInput name="name" placeholder="Nama brand" required />
              <Button type="submit">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Vendor"
          description="Digunakan pada Procurement & Maintenance"
          items={vendors.map((v) => ({ id: v.id, label: v.name, sublabel: v.code }))}
          deleteAction={deleteVendor}
          form={
            <form action={createVendor} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama vendor" required className="col-span-2" />
              <TextInput name="code" placeholder="Kode" required />
              <TextInput name="phone" placeholder="Telepon" />
              <TextInput name="email" placeholder="Email" className="col-span-2" />
              <Button type="submit" className="col-span-2">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Department"
          items={departments.map((d) => ({ id: d.id, label: d.name, sublabel: d.code }))}
          deleteAction={deleteDepartment}
          form={
            <form action={createDepartment} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama departemen" required />
              <TextInput name="code" placeholder="Kode" required />
              <Button type="submit" className="col-span-2">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Branch"
          items={branches.map((b) => ({ id: b.id, label: b.name, sublabel: b.address ?? undefined }))}
          deleteAction={deleteBranch}
          form={
            <form action={createBranch} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama cabang" required className="col-span-2" />
              <TextInput name="address" placeholder="Alamat" className="col-span-2" />
              <Button type="submit" className="col-span-2">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Location"
          items={locations.map((l) => ({
            id: l.id,
            label: l.name,
            sublabel: [l.branch?.name, l.building, l.floor, l.room].filter(Boolean).join(" · "),
          }))}
          deleteAction={deleteLocation}
          form={
            <form action={createLocation} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama lokasi" required className="col-span-2" />
              <SelectInput name="branchId" className="col-span-2">
                <option value="">Cabang...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </SelectInput>
              <TextInput name="building" placeholder="Gedung" />
              <TextInput name="floor" placeholder="Lantai" />
              <TextInput name="room" placeholder="Ruang" />
              <Button type="submit">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Employee"
          items={employees.map((e) => ({ id: e.id, label: e.name, sublabel: `${e.employeeCode} · ${e.department?.name ?? "-"}` }))}
          deleteAction={deleteEmployee}
          form={
            <form action={createEmployee} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama karyawan" required className="col-span-2" />
              <TextInput name="employeeCode" placeholder="Kode karyawan" required />
              <SelectInput name="departmentId">
                <option value="">Departemen...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </SelectInput>
              <TextInput name="position" placeholder="Jabatan" />
              <TextInput name="email" placeholder="Email" />
              <Button type="submit" className="col-span-2">Tambah</Button>
            </form>
          }
        />

        <MasterDataSection
          title="Project"
          items={projects.map((p) => ({ id: p.id, label: p.name, sublabel: p.code }))}
          deleteAction={deleteProject}
          form={
            <form action={createProject} className="grid grid-cols-2 gap-2">
              <TextInput name="name" placeholder="Nama proyek" required className="col-span-2" />
              <TextInput name="code" placeholder="Kode" required className="col-span-2" />
              <Button type="submit" className="col-span-2">Tambah</Button>
            </form>
          }
        />
      </div>
    </div>
  );
}
