"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function parseFormOrThrow<T extends z.ZodTypeAny>(schema: T, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  return result.data;
}

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

// ---------------- Department ----------------

const departmentSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  code: z.string().min(1, "Kode wajib diisi"),
});

export async function createDepartment(formData: FormData) {
  const data = parseFormOrThrow(departmentSchema, formData);
  await prisma.department.create({ data });
  revalidatePath("/master-data");
}

export async function deleteDepartment(id: string) {
  await prisma.department.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Branch ----------------

const branchSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  address: optionalString,
});

export async function createBranch(formData: FormData) {
  const data = parseFormOrThrow(branchSchema, formData);
  await prisma.branch.create({ data });
  revalidatePath("/master-data");
}

export async function deleteBranch(id: string) {
  await prisma.branch.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Location ----------------

const locationSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  branchId: optionalString,
  building: optionalString,
  floor: optionalString,
  room: optionalString,
});

export async function createLocation(formData: FormData) {
  const data = parseFormOrThrow(locationSchema, formData);
  await prisma.location.create({ data });
  revalidatePath("/master-data");
}

export async function deleteLocation(id: string) {
  await prisma.location.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Employee ----------------

const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Kode wajib diisi"),
  name: z.string().min(1, "Nama wajib diisi"),
  email: optionalString,
  phone: optionalString,
  position: optionalString,
  departmentId: optionalString,
});

export async function createEmployee(formData: FormData) {
  const data = parseFormOrThrow(employeeSchema, formData);
  await prisma.employee.create({ data });
  revalidatePath("/master-data");
}

export async function deleteEmployee(id: string) {
  await prisma.employee.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Project ----------------

const projectSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  code: z.string().min(1, "Kode wajib diisi"),
  status: z.string().default("ACTIVE"),
});

export async function createProject(formData: FormData) {
  const data = parseFormOrThrow(projectSchema, formData);
  await prisma.project.create({ data });
  revalidatePath("/master-data");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Vendor ----------------

const vendorSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  code: z.string().min(1, "Kode wajib diisi"),
  contactName: optionalString,
  email: optionalString,
  phone: optionalString,
  address: optionalString,
});

export async function createVendor(formData: FormData) {
  const data = parseFormOrThrow(vendorSchema, formData);
  await prisma.vendor.create({ data });
  revalidatePath("/master-data");
}

export async function deleteVendor(id: string) {
  await prisma.vendor.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Asset Category ----------------

const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  code: z.string().min(1, "Kode wajib diisi"),
  usefulLifeYears: z.coerce.number().int().min(1).default(5),
});

export async function createAssetCategory(formData: FormData) {
  const data = parseFormOrThrow(categorySchema, formData);
  await prisma.assetCategory.create({ data });
  revalidatePath("/master-data");
}

export async function deleteAssetCategory(id: string) {
  await prisma.assetCategory.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Asset Type ----------------

const typeSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
});

export async function createAssetType(formData: FormData) {
  const data = parseFormOrThrow(typeSchema, formData);
  await prisma.assetType.create({ data });
  revalidatePath("/master-data");
}

export async function deleteAssetType(id: string) {
  await prisma.assetType.delete({ where: { id } });
  revalidatePath("/master-data");
}

// ---------------- Brand ----------------

const brandSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
});

export async function createBrand(formData: FormData) {
  const data = parseFormOrThrow(brandSchema, formData);
  await prisma.brand.create({ data });
  revalidatePath("/master-data");
}

export async function deleteBrand(id: string) {
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/master-data");
}
