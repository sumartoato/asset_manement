import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      name: "System Administrator",
      email: "admin@company.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const managerHash = await bcrypt.hash("Manager123!", 10);
  await prisma.user.upsert({
    where: { email: "manager@company.com" },
    update: {},
    create: {
      name: "Asset Manager",
      email: "manager@company.com",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  const staffHash = await bcrypt.hash("Staff123!", 10);
  await prisma.user.upsert({
    where: { email: "staff@company.com" },
    update: {},
    create: {
      name: "Staff Gudang",
      email: "staff@company.com",
      passwordHash: staffHash,
      role: "STAFF",
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
