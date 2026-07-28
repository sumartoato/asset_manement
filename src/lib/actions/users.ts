"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

const roleEnum = z.enum(["ADMIN", "MANAGER", "STAFF", "AUDITOR"]);

const createUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  role: roleEnum,
  departmentId: optionalString,
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  role: roleEnum,
  departmentId: optionalString,
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  password: optionalString,
});

async function requireAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    throw new Error("Anda tidak memiliki akses untuk melakukan aksi ini");
  }
  return session;
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const result = createUserSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  if (data.password !== data.confirmPassword) {
    throw new Error("Kata sandi dan konfirmasi kata sandi tidak sama");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId,
        isActive: data.isActive,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Email sudah terdaftar");
    }
    throw e;
  }

  await prisma.auditLog.create({
    data: {
      userId: (await auth())?.user.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      details: `Pengguna ${user.name} (${user.email}) dibuat dengan peran ${user.role}`,
    },
  });

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUser(id: string, formData: FormData) {
  const session = await requireAdmin();

  const raw = Object.fromEntries(formData.entries());
  const result = updateUserSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => i.message).join(", "));
  }
  const data = result.data;

  if (data.password && data.password.length > 0 && data.password.length < 8) {
    throw new Error("Kata sandi baru minimal 8 karakter");
  }

  if (id === session?.user.id && data.role !== "ADMIN") {
    throw new Error("Anda tidak dapat mengubah peran akun Anda sendiri dari ADMIN");
  }

  if (id === session?.user.id && !data.isActive) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri");
  }

  const updateData: Prisma.UserUpdateInput = {
    name: data.name,
    email: data.email,
    role: data.role,
    department: data.departmentId ? { connect: { id: data.departmentId } } : { disconnect: true },
    isActive: data.isActive,
  };

  if (data.password && data.password.length > 0) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  try {
    await prisma.user.update({ where: { id }, data: updateData });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("Email sudah terdaftar");
    }
    throw e;
  }

  await prisma.auditLog.create({
    data: {
      userId: session?.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: id,
      details: `Pengguna ${data.name} (${data.email}) diperbarui`,
    },
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}/edit`);
}

export async function toggleUserActive(id: string) {
  const session = await requireAdmin();

  if (id === session?.user.id) {
    throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new Error("Pengguna tidak ditemukan");

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !target.isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: session?.user.id,
      action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
      entityType: "User",
      entityId: id,
      details: `Pengguna ${updated.name} (${updated.email}) ${updated.isActive ? "diaktifkan" : "dinonaktifkan"}`,
    },
  });

  revalidatePath("/users");
}
