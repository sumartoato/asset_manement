import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  PageHeader,
  LinkButton,
  Card,
  Table,
  Th,
  Td,
  Badge,
  EmptyState,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toggleUserActive } from "@/lib/actions/users";
import type { Prisma } from "@/generated/prisma/client";

const ROLE_COLOR: Record<string, "purple" | "indigo" | "slate" | "blue"> = {
  ADMIN: "purple",
  MANAGER: "indigo",
  STAFF: "slate",
  AUDITOR: "blue",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; role?: string; entityType?: string }>;
}) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { tab, role, entityType } = await searchParams;
  const activeTab = tab === "audit" ? "audit" : "users";

  if (activeTab === "audit") {
    const where: Prisma.AuditLogWhereInput = {};
    if (entityType) where.entityType = entityType;

    const [logs, entityTypes] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.auditLog.findMany({
        distinct: ["entityType"],
        select: { entityType: true },
        orderBy: { entityType: "asc" },
      }),
    ]);

    return (
      <div>
        <PageHeader
          title="Pengguna & Keamanan"
          description="Manajemen pengguna, peran, dan log audit sistem"
        />

        <Tabs activeTab={activeTab} />

        <Card className="p-4 mb-4">
          <form className="flex flex-wrap gap-3 items-end">
            <input type="hidden" name="tab" value="audit" />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipe Entitas</label>
              <select
                name="entityType"
                defaultValue={entityType ?? ""}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Semua Tipe</option>
                {entityTypes.map((e) => (
                  <option key={e.entityType} value={e.entityType}>
                    {e.entityType}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2">
              Filter
            </button>
          </form>
        </Card>

        <Card>
          {logs.length === 0 ? (
            <EmptyState title="Belum ada log audit" description="Aktivitas sistem akan tercatat di sini." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Aktor</Th>
                  <Th>Aksi</Th>
                  <Th>Tipe Entitas</Th>
                  <Th>ID Entitas</Th>
                  <Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <Td className="whitespace-nowrap">
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(log.createdAt)}
                    </Td>
                    <Td>{log.user?.name ?? "System"}</Td>
                    <Td>
                      <Badge color="indigo">{log.action}</Badge>
                    </Td>
                    <Td>{log.entityType}</Td>
                    <Td className="font-mono text-xs">{log.entityId}</Td>
                    <Td>{log.details ?? "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <p className="text-xs text-slate-400 mt-2">Menampilkan {logs.length} log terbaru (maks. 200).</p>
      </div>
    );
  }

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role as Prisma.EnumRoleNameFilter["equals"];

  const users = await prisma.user.findMany({
    where,
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Pengguna & Keamanan"
        description="Manajemen pengguna, peran, dan log audit sistem"
        action={
          <LinkButton href="/users/new">
            <Plus className="h-4 w-4" /> Pengguna Baru
          </LinkButton>
        }
      />

      <Tabs activeTab={activeTab} />

      <Card className="p-4 mb-4">
        <form className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Peran</label>
            <select name="role" defaultValue={role ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Semua Peran</option>
              {Object.keys(ROLE_COLOR).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded-md bg-slate-900 text-white text-sm px-4 py-2">
            Filter
          </button>
        </form>
      </Card>

      <Card>
        {users.length === 0 ? (
          <EmptyState title="Belum ada pengguna" description="Mulai dengan menambahkan pengguna baru." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Email</Th>
                <Th>Peran</Th>
                <Th>Departemen</Th>
                <Th>Status</Th>
                <Th>Dibuat</Th>
                <Th className="text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/users/${u.id}/edit`} className="text-indigo-600 font-medium hover:underline">
                      {u.name}
                    </Link>
                    {u.id === session.user.id && <span className="ml-2 text-xs text-slate-400">(Anda)</span>}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge color={ROLE_COLOR[u.role]}>{u.role}</Badge>
                  </Td>
                  <Td>{u.department?.name ?? "-"}</Td>
                  <Td>
                    <Badge color={u.isActive ? "green" : "slate"}>{u.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/users/${u.id}/edit`} className="text-xs text-slate-500 hover:text-indigo-600 hover:underline">
                        Edit
                      </Link>
                      {u.id !== session.user.id && (
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserActive(u.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs text-slate-500 hover:text-red-600 hover:underline"
                          >
                            {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <p className="text-xs text-slate-400 mt-2">Menampilkan {users.length} pengguna.</p>
    </div>
  );
}

function Tabs({ activeTab }: { activeTab: "users" | "audit" }) {
  const tabClass = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? "border-indigo-600 text-indigo-600"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="flex border-b border-slate-200 mb-4">
      <Link href="/users" className={tabClass(activeTab === "users")}>
        Pengguna
      </Link>
      <Link href="/users?tab=audit" className={tabClass(activeTab === "audit")}>
        Log Audit
      </Link>
    </div>
  );
}
