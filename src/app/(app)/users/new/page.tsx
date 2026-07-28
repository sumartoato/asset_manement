import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { createUser } from "@/lib/actions/users";

export default async function NewUserPage() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Pengguna Baru" description="Tambahkan pengguna baru ke sistem" />
      <Card className="p-6 max-w-3xl">
        <UserForm action={createUser} departments={departments} mode="create" submitLabel="Simpan Pengguna" />
      </Card>
    </div>
  );
}
