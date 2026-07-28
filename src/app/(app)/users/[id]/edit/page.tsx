import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PageHeader, Card } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { updateUser } from "@/lib/actions/users";
import { notFound, redirect } from "next/navigation";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [user, departments] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) notFound();

  const isSelf = user.id === session.user.id;

  async function action(formData: FormData) {
    "use server";
    await updateUser(id, formData);
    redirect("/users");
  }

  return (
    <div>
      <PageHeader title={`Edit Pengguna · ${user.name}`} />
      <Card className="p-6 max-w-3xl">
        <UserForm
          action={action}
          departments={departments}
          mode="edit"
          submitLabel="Simpan Perubahan"
          disableRoleChange={isSelf}
          disableActiveToggle={isSelf}
          defaultValues={{
            name: user.name,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
            isActive: user.isActive,
          }}
        />
      </Card>
    </div>
  );
}
