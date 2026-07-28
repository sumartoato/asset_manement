import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const now = new Date();

function monthsAgo(n: number) {
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
  return d;
}
function daysFromNow(n: number) {
  return new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
}
function daysAgo(n: number) {
  return new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
}

async function createUsers() {
  const users = [
    { name: "System Administrator", email: "admin@company.com", password: "Admin123!", role: "ADMIN" as const },
    { name: "Asset Manager", email: "manager@company.com", password: "Manager123!", role: "MANAGER" as const },
    { name: "Staff Gudang", email: "staff@company.com", password: "Staff123!", role: "STAFF" as const },
    { name: "Internal Auditor", email: "auditor@company.com", password: "Auditor123!", role: "AUDITOR" as const },
  ];

  const map: Record<string, string> = {};
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
    map[u.email] = created.id;
  }
  return map;
}

async function createDepartments() {
  const items = [
    { name: "Information Technology", code: "IT" },
    { name: "Finance & Accounting", code: "FIN" },
    { name: "Human Resources", code: "HR" },
    { name: "Operations", code: "OPS" },
    { name: "Marketing", code: "MKT" },
  ];
  const map: Record<string, string> = {};
  for (const d of items) {
    const created = await prisma.department.create({ data: d });
    map[d.code] = created.id;
  }
  return map;
}

async function createBranches() {
  const items = [
    { name: "Kantor Pusat Jakarta", address: "Jl. Sudirman Kav. 25, Jakarta Selatan" },
    { name: "Cabang Surabaya", address: "Jl. Basuki Rahmat No. 12, Surabaya" },
  ];
  const map: Record<string, string> = {};
  for (const b of items) {
    const created = await prisma.branch.create({ data: b });
    map[b.name] = created.id;
  }
  return map;
}

async function createLocations(branches: Record<string, string>) {
  const items = [
    { name: "Gudang IT", branchId: branches["Kantor Pusat Jakarta"], building: "Gedung A", floor: "2", room: "IT Storage" },
    { name: "Ruang Server", branchId: branches["Kantor Pusat Jakarta"], building: "Gedung A", floor: "3", room: "Server Room" },
    { name: "Kantor Finance", branchId: branches["Kantor Pusat Jakarta"], building: "Gedung B", floor: "1", room: "Finance Office" },
    { name: "Ruang Marketing", branchId: branches["Kantor Pusat Jakarta"], building: "Gedung B", floor: "2", room: "Marketing Office" },
    { name: "Gudang Operasional Surabaya", branchId: branches["Cabang Surabaya"], building: "Gedung Utama", floor: "1", room: "Warehouse" },
  ];
  const map: Record<string, string> = {};
  for (const l of items) {
    const created = await prisma.location.create({ data: l });
    map[l.name] = created.id;
  }
  return map;
}

async function createEmployees(departments: Record<string, string>) {
  const items = [
    { employeeCode: "EMP-001", name: "Budi Santoso", email: "budi.santoso@company.com", position: "Network Engineer", departmentId: departments["IT"] },
    { employeeCode: "EMP-002", name: "Siti Aminah", email: "siti.aminah@company.com", position: "Finance Staff", departmentId: departments["FIN"] },
    { employeeCode: "EMP-003", name: "Andi Wijaya", email: "andi.wijaya@company.com", position: "HR Officer", departmentId: departments["HR"] },
    { employeeCode: "EMP-004", name: "Dewi Lestari", email: "dewi.lestari@company.com", position: "Operations Supervisor", departmentId: departments["OPS"] },
    { employeeCode: "EMP-005", name: "Rudi Hartono", email: "rudi.hartono@company.com", position: "Marketing Executive", departmentId: departments["MKT"] },
    { employeeCode: "EMP-006", name: "Maya Puspita", email: "maya.puspita@company.com", position: "IT Support", departmentId: departments["IT"] },
  ];
  const map: Record<string, string> = {};
  for (const e of items) {
    const created = await prisma.employee.create({ data: e });
    map[e.employeeCode] = created.id;
  }
  return map;
}

async function createProjects() {
  const items = [
    { name: "Proyek Digitalisasi Kantor", code: "PRJ-001", startDate: monthsAgo(6), status: "ACTIVE" },
    { name: "Ekspansi Cabang Surabaya", code: "PRJ-002", startDate: monthsAgo(2), status: "ACTIVE" },
  ];
  const map: Record<string, string> = {};
  for (const p of items) {
    const created = await prisma.project.create({ data: p });
    map[p.code] = created.id;
  }
  return map;
}

async function createVendors() {
  const items = [
    { name: "PT Sinar Komputer Nusantara", code: "VEN-001", contactName: "Hendra Gunawan", email: "sales@sinarkomputer.co.id", phone: "021-5551234" },
    { name: "PT Mitra Furnitur Indonesia", code: "VEN-002", contactName: "Lina Marlina", email: "cs@mitrafurnitur.co.id", phone: "021-5555678" },
    { name: "PT Astra Kendaraan", code: "VEN-003", contactName: "Agus Setiawan", email: "fleet@astrakendaraan.co.id", phone: "021-5559012" },
    { name: "CV Teknik Servis Prima", code: "VEN-004", contactName: "Yusuf Ridwan", email: "servis@teknikprima.co.id", phone: "021-5553456" },
  ];
  const map: Record<string, string> = {};
  for (const v of items) {
    const created = await prisma.vendor.create({ data: v });
    map[v.code] = created.id;
  }
  return map;
}

async function createCategories() {
  const items = [
    { name: "Elektronik & Komputer", code: "ELEC", usefulLifeYears: 4 },
    { name: "Furniture Kantor", code: "FURN", usefulLifeYears: 8 },
    { name: "Kendaraan", code: "VEH", usefulLifeYears: 8 },
    { name: "Mesin & Peralatan", code: "MACH", usefulLifeYears: 10 },
    { name: "Peralatan Jaringan", code: "NET", usefulLifeYears: 5 },
  ];
  const map: Record<string, string> = {};
  for (const c of items) {
    const created = await prisma.assetCategory.create({ data: c });
    map[c.code] = created.id;
  }
  return map;
}

async function createTypes(categories: Record<string, string>) {
  const items = [
    { name: "Laptop", categoryId: categories["ELEC"] },
    { name: "Desktop PC", categoryId: categories["ELEC"] },
    { name: "Printer", categoryId: categories["ELEC"] },
    { name: "Meja Kerja", categoryId: categories["FURN"] },
    { name: "Kursi Kantor", categoryId: categories["FURN"] },
    { name: "Mobil Operasional", categoryId: categories["VEH"] },
    { name: "Motor", categoryId: categories["VEH"] },
    { name: "Genset", categoryId: categories["MACH"] },
    { name: "AC", categoryId: categories["MACH"] },
    { name: "Router", categoryId: categories["NET"] },
    { name: "Switch", categoryId: categories["NET"] },
  ];
  const map: Record<string, string> = {};
  for (const t of items) {
    const created = await prisma.assetType.create({ data: t });
    map[t.name] = created.id;
  }
  return map;
}

async function createBrands() {
  const names = ["Dell", "HP", "Lenovo", "Epson", "Toyota", "Honda", "Panasonic", "Cisco"];
  const map: Record<string, string> = {};
  for (const name of names) {
    const created = await prisma.brand.create({ data: { name } });
    map[name] = created.id;
  }
  return map;
}

type Refs = {
  categories: Record<string, string>;
  types: Record<string, string>;
  brands: Record<string, string>;
  vendors: Record<string, string>;
  locations: Record<string, string>;
  departments: Record<string, string>;
  users: Record<string, string>;
};

async function createAssets(refs: Refs) {
  const adminId = refs.users["admin@company.com"];

  const defs = [
    {
      assetCode: "AST-2026-0001", name: "Laptop Dell Latitude 5420", category: "ELEC", type: "Laptop", brand: "Dell",
      model: "Latitude 5420", serialNumber: "SN-DL5420-0001", vendor: "VEN-001", purchaseDate: monthsAgo(20),
      purchaseCost: 15000000, salvageValue: 1500000, usefulLifeYears: 4, location: "Gudang IT", department: "IT",
      status: "ACTIVE", condition: "GOOD", warrantyMonths: 36,
    },
    {
      assetCode: "AST-2026-0002", name: "Laptop HP EliteBook 840", category: "ELEC", type: "Laptop", brand: "HP",
      model: "EliteBook 840 G8", serialNumber: "SN-HPEB840-0002", vendor: "VEN-001", purchaseDate: monthsAgo(14),
      purchaseCost: 17500000, salvageValue: 1750000, usefulLifeYears: 4, location: "Gudang IT", department: "MKT",
      status: "BORROWED", condition: "GOOD", warrantyMonths: 36,
    },
    {
      assetCode: "AST-2026-0003", name: "Desktop PC Lenovo ThinkCentre", category: "ELEC", type: "Desktop PC", brand: "Lenovo",
      model: "ThinkCentre M75s", serialNumber: "SN-LNTC-0003", vendor: "VEN-001", purchaseDate: monthsAgo(30),
      purchaseCost: 9500000, salvageValue: 950000, usefulLifeYears: 4, location: "Kantor Finance", department: "FIN",
      status: "ACTIVE", condition: "FAIR", warrantyMonths: 24,
    },
    {
      assetCode: "AST-2026-0004", name: "Printer Epson L5290", category: "ELEC", type: "Printer", brand: "Epson",
      model: "L5290", serialNumber: "SN-EPL5290-0004", vendor: "VEN-001", purchaseDate: monthsAgo(10),
      purchaseCost: 4200000, salvageValue: 200000, usefulLifeYears: 4, location: "Kantor Finance", department: "FIN",
      status: "UNDER_MAINTENANCE", condition: "FAIR", warrantyMonths: 12,
    },
    {
      assetCode: "AST-2026-0005", name: "Meja Kerja Eksekutif", category: "FURN", type: "Meja Kerja", brand: null,
      model: null, serialNumber: null, vendor: "VEN-002", purchaseDate: monthsAgo(40),
      purchaseCost: 3200000, salvageValue: 300000, usefulLifeYears: 8, location: "Ruang Marketing", department: "MKT",
      status: "ACTIVE", condition: "GOOD", warrantyMonths: 0,
    },
    {
      assetCode: "AST-2026-0006", name: "Kursi Kantor Ergonomis", category: "FURN", type: "Kursi Kantor", brand: null,
      model: null, serialNumber: null, vendor: "VEN-002", purchaseDate: monthsAgo(40),
      purchaseCost: 1800000, salvageValue: 150000, usefulLifeYears: 8, location: "Ruang Marketing", department: "MKT",
      status: "ACTIVE", condition: "GOOD", warrantyMonths: 0,
    },
    {
      assetCode: "AST-2026-0007", name: "Toyota Avanza Operasional", category: "VEH", type: "Mobil Operasional", brand: "Toyota",
      model: "Avanza 1.5 G", serialNumber: "SN-TYAVZ-0007", vendor: "VEN-003", purchaseDate: monthsAgo(28),
      purchaseCost: 220000000, salvageValue: 60000000, usefulLifeYears: 8, location: "Gudang Operasional Surabaya", department: "OPS",
      status: "ACTIVE", condition: "GOOD", warrantyMonths: 36,
    },
    {
      assetCode: "AST-2026-0008", name: "Honda Beat Kurir", category: "VEH", type: "Motor", brand: "Honda",
      model: "Beat Street", serialNumber: "SN-HDBEAT-0008", vendor: "VEN-003", purchaseDate: monthsAgo(18),
      purchaseCost: 19500000, salvageValue: 5000000, usefulLifeYears: 8, location: "Gudang Operasional Surabaya", department: "OPS",
      status: "ACTIVE", condition: "GOOD", warrantyMonths: 24,
    },
    {
      assetCode: "AST-2026-0009", name: "Genset Panasonic 10kVA", category: "MACH", type: "Genset", brand: "Panasonic",
      model: "PN-10KVA", serialNumber: "SN-PNGS-0009", vendor: "VEN-004", purchaseDate: monthsAgo(45),
      purchaseCost: 65000000, salvageValue: 8000000, usefulLifeYears: 10, location: "Gudang Operasional Surabaya", department: "OPS",
      status: "ACTIVE", condition: "FAIR", warrantyMonths: 24,
    },
    {
      assetCode: "AST-2026-0010", name: "AC Split Ruang Server", category: "MACH", type: "AC", brand: "Panasonic",
      model: "CS-PC18", serialNumber: "SN-PNAC-0010", vendor: "VEN-004", purchaseDate: monthsAgo(22),
      purchaseCost: 8500000, salvageValue: 500000, usefulLifeYears: 10, location: "Ruang Server", department: "IT",
      status: "ACTIVE", condition: "EXCELLENT", warrantyMonths: 24,
    },
    {
      assetCode: "AST-2026-0011", name: "Router Cisco ISR 4321", category: "NET", type: "Router", brand: "Cisco",
      model: "ISR4321/K9", serialNumber: "SN-CSISR-0011", vendor: "VEN-001", purchaseDate: monthsAgo(16),
      purchaseCost: 32000000, salvageValue: 3000000, usefulLifeYears: 5, location: "Ruang Server", department: "IT",
      status: "ACTIVE", condition: "EXCELLENT", warrantyMonths: 36,
    },
    {
      assetCode: "AST-2026-0012", name: "Switch Cisco Catalyst 2960", category: "NET", type: "Switch", brand: "Cisco",
      model: "WS-C2960-24TT-L", serialNumber: "SN-CSCAT-0012", vendor: "VEN-001", purchaseDate: monthsAgo(16),
      purchaseCost: 12500000, salvageValue: 1000000, usefulLifeYears: 5, location: "Ruang Server", department: "IT",
      status: "ACTIVE", condition: "GOOD", warrantyMonths: 36,
    },
    {
      assetCode: "AST-2026-0013", name: "Laptop Dell Vostro 3510", category: "ELEC", type: "Laptop", brand: "Dell",
      model: "Vostro 3510", serialNumber: "SN-DLVOS-0013", vendor: "VEN-001", purchaseDate: monthsAgo(8),
      purchaseCost: 11000000, salvageValue: 1100000, usefulLifeYears: 4, location: "Gudang IT", department: "HR",
      status: "ACTIVE", condition: "EXCELLENT", warrantyMonths: 24,
    },
    {
      assetCode: "AST-2026-0014", name: "Printer HP LaserJet Pro", category: "ELEC", type: "Printer", brand: "HP",
      model: "LaserJet Pro M404dn", serialNumber: "SN-HPLJ-0014", vendor: "VEN-001", purchaseDate: monthsAgo(5),
      purchaseCost: 5200000, salvageValue: 300000, usefulLifeYears: 4, location: "Ruang Marketing", department: "MKT",
      status: "ACTIVE", condition: "EXCELLENT", warrantyMonths: 12,
    },
    {
      assetCode: "AST-2026-0015", name: "Kursi Kantor Rusak", category: "FURN", type: "Kursi Kantor", brand: null,
      model: null, serialNumber: null, vendor: "VEN-002", purchaseDate: monthsAgo(50),
      purchaseCost: 1500000, salvageValue: 100000, usefulLifeYears: 8, location: "Ruang Marketing", department: "MKT",
      status: "DAMAGED", condition: "DAMAGED", warrantyMonths: 0,
    },
    {
      assetCode: "AST-2026-0016", name: "Proyektor Epson EB-X06", category: "ELEC", type: "Printer", brand: "Epson",
      model: "EB-X06", serialNumber: "SN-EPPRJ-0016", vendor: "VEN-001", purchaseDate: monthsAgo(60),
      purchaseCost: 6000000, salvageValue: 0, usefulLifeYears: 4, location: "Gudang IT", department: "IT",
      status: "LOST", condition: "POOR", warrantyMonths: 0,
    },
  ] as const;

  const assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>> = {};

  for (const d of defs) {
    const warrantyStart = d.warrantyMonths > 0 ? d.purchaseDate : undefined;
    const warrantyEnd =
      d.warrantyMonths > 0
        ? new Date(d.purchaseDate.getFullYear(), d.purchaseDate.getMonth() + d.warrantyMonths, d.purchaseDate.getDate())
        : undefined;

    const created = await prisma.asset.create({
      data: {
        assetCode: d.assetCode,
        name: d.name,
        categoryId: refs.categories[d.category],
        typeId: refs.types[d.type],
        brandId: d.brand ? refs.brands[d.brand] : undefined,
        model: d.model ?? undefined,
        serialNumber: d.serialNumber ?? undefined,
        barcode: d.assetCode,
        status: d.status,
        condition: d.condition,
        vendorId: refs.vendors[d.vendor],
        purchaseDate: d.purchaseDate,
        purchaseCost: d.purchaseCost,
        invoiceNumber: `INV-${d.assetCode}`,
        warrantyStart,
        warrantyEnd,
        depreciationMethod: d.assetCode === "AST-2026-0007" || d.assetCode === "AST-2026-0009" ? "DECLINING_BALANCE" : "STRAIGHT_LINE",
        usefulLifeYears: d.usefulLifeYears,
        salvageValue: d.salvageValue,
        locationId: refs.locations[d.location],
        departmentId: refs.departments[d.department],
        createdById: adminId,
      },
    });
    assets[d.assetCode] = created;

    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: "CREATE",
        entityType: "Asset",
        entityId: created.id,
        details: `Aset ${created.name} (${created.assetCode}) diregistrasi`,
      },
    });
  }

  return assets;
}

async function generateDepreciation(assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>) {
  for (const asset of Object.values(assets)) {
    if (!asset.purchaseCost || !asset.purchaseDate || !asset.usefulLifeYears) continue;
    if (asset.status === "LOST") continue;

    const cost = Number(asset.purchaseCost);
    const salvage = asset.salvageValue ? Number(asset.salvageValue) : 0;
    const totalMonths = asset.usefulLifeYears * 12;

    let bookValue = cost;
    let month = 0;
    const start = new Date(asset.purchaseDate.getFullYear(), asset.purchaseDate.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const entries: Prisma.DepreciationEntryCreateManyInput[] = [];

    while (bookValue > salvage) {
      const period = new Date(start.getFullYear(), start.getMonth() + month, 1);
      if (period > endMonth || month >= totalMonths) break;

      let amount: number;
      if (asset.depreciationMethod === "DECLINING_BALANCE") {
        const rate = 2 / totalMonths;
        amount = bookValue * rate;
      } else {
        amount = (cost - salvage) / totalMonths;
      }
      if (bookValue - amount < salvage) amount = bookValue - salvage;
      if (amount <= 0) break;

      const bookValueStart = bookValue;
      const bookValueEnd = bookValue - amount;

      entries.push({
        assetId: asset.id,
        period,
        amount: new Prisma.Decimal(amount.toFixed(2)),
        bookValueStart: new Prisma.Decimal(bookValueStart.toFixed(2)),
        bookValueEnd: new Prisma.Decimal(bookValueEnd.toFixed(2)),
      });

      bookValue = bookValueEnd;
      month += 1;
    }

    if (entries.length > 0) {
      await prisma.depreciationEntry.createMany({ data: entries });
    }
  }
}

async function createAllocationsAndMovements(
  assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>,
  employees: Record<string, string>,
  departments: Record<string, string>,
  projects: Record<string, string>,
  locations: Record<string, string>
) {
  // Active allocation: Laptop HP EliteBook borrowed by Rudi Hartono (Marketing)
  const activeAlloc = await prisma.allocation.create({
    data: {
      assetId: assets["AST-2026-0002"].id,
      type: "BORROW",
      status: "ACTIVE",
      employeeId: employees["EMP-005"],
      assignedDate: daysAgo(20),
      dueDate: daysFromNow(10),
      notes: "Dipinjam untuk kebutuhan presentasi klien",
    },
  });
  await prisma.movementHistory.create({
    data: {
      assetId: assets["AST-2026-0002"].id,
      type: "ALLOCATION",
      toLocationId: locations["Ruang Marketing"],
      notes: "Dialokasikan ke Rudi Hartono",
      movedAt: daysAgo(20),
    },
  });

  // Returned allocation: Laptop Dell Vostro previously assigned to Budi then returned
  await prisma.allocation.create({
    data: {
      assetId: assets["AST-2026-0013"].id,
      type: "ASSIGN",
      status: "RETURNED",
      employeeId: employees["EMP-001"],
      assignedDate: daysAgo(90),
      returnedDate: daysAgo(5),
      notes: "Assignment sementara selama proyek migrasi server",
    },
  });
  await prisma.movementHistory.create({
    data: {
      assetId: assets["AST-2026-0013"].id,
      type: "ALLOCATION",
      toLocationId: locations["Gudang IT"],
      movedAt: daysAgo(90),
    },
  });
  await prisma.movementHistory.create({
    data: {
      assetId: assets["AST-2026-0013"].id,
      type: "RETURN",
      toLocationId: locations["Gudang IT"],
      movedAt: daysAgo(5),
    },
  });

  // Project allocation: Genset allocated to Ekspansi Cabang Surabaya project
  await prisma.allocation.create({
    data: {
      assetId: assets["AST-2026-0009"].id,
      type: "TRANSFER",
      status: "ACTIVE",
      projectId: projects["PRJ-002"],
      assignedDate: daysAgo(45),
      notes: "Digunakan untuk mendukung operasional cabang baru",
    },
  });

  // Department allocation
  await prisma.allocation.create({
    data: {
      assetId: assets["AST-2026-0007"].id,
      type: "ASSIGN",
      status: "ACTIVE",
      departmentId: departments["OPS"],
      assignedDate: daysAgo(60),
    },
  });

  // Extra check-in/out movement history
  await prisma.movementHistory.create({
    data: {
      assetId: assets["AST-2026-0011"].id,
      type: "CHECK_IN",
      toLocationId: locations["Ruang Server"],
      notes: "Instalasi awal di server room",
      movedAt: daysAgo(16 * 30),
    },
  });
  await prisma.movementHistory.create({
    data: {
      assetId: assets["AST-2026-0004"].id,
      type: "CHECK_OUT",
      toLocationId: locations["Kantor Finance"],
      notes: "Dibawa ke vendor servis",
      movedAt: daysAgo(3),
    },
  });

  return activeAlloc;
}

async function createMaintenance(
  assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>,
  users: Record<string, string>,
  vendors: Record<string, string>
) {
  const adminId = users["admin@company.com"];

  // Completed work order for the printer under maintenance
  const schedule1 = await prisma.maintenanceSchedule.create({
    data: {
      assetId: assets["AST-2026-0004"].id,
      type: "CORRECTIVE",
      title: "Perbaikan printer macet kertas berulang",
      scheduledDate: daysAgo(3),
      status: "COMPLETED",
      createdById: adminId,
    },
  });

  const wo1 = await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-0001",
      assetId: assets["AST-2026-0004"].id,
      maintenanceScheduleId: schedule1.id,
      type: "CORRECTIVE",
      priority: "HIGH",
      status: "IN_PROGRESS",
      description: "Printer sering macet kertas dan hasil cetak bergaris",
      vendorId: vendors["VEN-004"],
      startDate: daysAgo(3),
      laborCost: new Prisma.Decimal(350000),
      partsCost: new Prisma.Decimal(180000),
      totalCost: new Prisma.Decimal(530000),
      checklist: [
        { item: "Bersihkan roller kertas", done: true },
        { item: "Ganti cartridge", done: true },
        { item: "Kalibrasi print head", done: false },
      ],
    },
  });
  await prisma.sparePartUsage.create({
    data: { workOrderId: wo1.id, partName: "Roller Kertas", quantity: 1, unitCost: new Prisma.Decimal(180000) },
  });

  // Preventive schedule upcoming for genset
  await prisma.maintenanceSchedule.create({
    data: {
      assetId: assets["AST-2026-0009"].id,
      type: "PREVENTIVE",
      title: "Servis rutin genset triwulan",
      frequencyDays: 90,
      scheduledDate: daysFromNow(12),
      status: "SCHEDULED",
      createdById: adminId,
    },
  });

  // Upcoming preventive for AC
  await prisma.maintenanceSchedule.create({
    data: {
      assetId: assets["AST-2026-0010"].id,
      type: "PREVENTIVE",
      title: "Cuci AC dan cek freon",
      frequencyDays: 180,
      scheduledDate: daysFromNow(20),
      status: "SCHEDULED",
      createdById: adminId,
    },
  });

  // Completed work order for company car
  const wo2 = await prisma.workOrder.create({
    data: {
      woNumber: "WO-2026-0002",
      assetId: assets["AST-2026-0007"].id,
      type: "PREVENTIVE",
      priority: "MEDIUM",
      status: "COMPLETED",
      description: "Servis berkala 40.000 km",
      vendorId: vendors["VEN-003"],
      startDate: daysAgo(35),
      completedDate: daysAgo(34),
      laborCost: new Prisma.Decimal(500000),
      partsCost: new Prisma.Decimal(1200000),
      totalCost: new Prisma.Decimal(1700000),
      checklist: [
        { item: "Ganti oli mesin", done: true },
        { item: "Cek rem", done: true },
        { item: "Rotasi ban", done: true },
      ],
    },
  });
  await prisma.sparePartUsage.create({
    data: { workOrderId: wo2.id, partName: "Oli Mesin 4L", quantity: 1, unitCost: new Prisma.Decimal(650000) },
  });
  await prisma.sparePartUsage.create({
    data: { workOrderId: wo2.id, partName: "Filter Oli", quantity: 1, unitCost: new Prisma.Decimal(150000) },
  });

  return { wo1 };
}

async function createInspections(assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>) {
  await prisma.inspection.create({
    data: {
      assetId: assets["AST-2026-0007"].id,
      scheduledDate: daysAgo(40),
      completedDate: daysAgo(39),
      status: "COMPLETED",
      checklist: [
        { item: "Kondisi ban", done: true },
        { item: "Kondisi mesin", done: true },
        { item: "Kelengkapan surat kendaraan", done: true },
      ],
      conditionFound: "GOOD",
      findings: "Kendaraan dalam kondisi baik, tidak ada temuan signifikan.",
      approved: true,
    },
  });

  await prisma.inspection.create({
    data: {
      assetId: assets["AST-2026-0015"].id,
      scheduledDate: daysAgo(10),
      completedDate: daysAgo(9),
      status: "COMPLETED",
      checklist: [
        { item: "Struktur kursi", done: true },
        { item: "Roda kursi", done: true },
      ],
      conditionFound: "DAMAGED",
      findings: "Sandaran kursi patah, roda tidak berfungsi dengan baik.",
      correctiveAction: "Direkomendasikan untuk dilakukan disposal.",
      approved: true,
    },
  });

  await prisma.inspection.create({
    data: {
      assetId: assets["AST-2026-0009"].id,
      scheduledDate: daysFromNow(12),
      status: "SCHEDULED",
      checklist: [
        { item: "Cek oli genset", done: false },
        { item: "Cek aki", done: false },
      ],
    },
  });
}

async function createWarrantyAndContracts(
  assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>,
  vendors: Record<string, string>
) {
  const warrantyAssets: [string, string, number][] = [
    ["AST-2026-0001", "Dell Indonesia", 36],
    ["AST-2026-0002", "HP Indonesia", 36],
    ["AST-2026-0007", "Toyota Astra Motor", 36],
    ["AST-2026-0011", "Cisco Systems Indonesia", 36],
  ];
  for (const [code, provider, months] of warrantyAssets) {
    const asset = assets[code];
    if (!asset.purchaseDate) continue;
    const endDate = new Date(asset.purchaseDate.getFullYear(), asset.purchaseDate.getMonth() + months, asset.purchaseDate.getDate());
    await prisma.warranty.create({
      data: {
        assetId: asset.id,
        provider,
        startDate: asset.purchaseDate,
        endDate,
        terms: "Garansi resmi termasuk servis dan sparepart",
      },
    });
  }

  // A contract expiring soon (within 30 days) to exercise the "Expiring Soon" UI
  await prisma.vendorContract.create({
    data: {
      vendorId: vendors["VEN-004"],
      contractNumber: "CTR-2026-0001",
      title: "Kontrak Layanan Maintenance Berkala",
      startDate: monthsAgo(11),
      endDate: daysFromNow(18),
      slaDetails: "Respon maksimal 24 jam, on-site service 2x per bulan",
      value: new Prisma.Decimal(36000000),
    },
  });

  await prisma.vendorContract.create({
    data: {
      vendorId: vendors["VEN-001"],
      contractNumber: "CTR-2026-0002",
      title: "Kontrak Supply & Support IT Equipment",
      startDate: monthsAgo(4),
      endDate: daysFromNow(240),
      slaDetails: "Garansi pengadaan 1 tahun, dukungan teknis 5x8",
      value: new Prisma.Decimal(150000000),
    },
  });
}

async function createDisposal(assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>, users: Record<string, string>) {
  const asset = assets["AST-2026-0015"];

  const depSum = await prisma.depreciationEntry.aggregate({
    _sum: { amount: true },
    where: { assetId: asset.id },
  });
  const bookValue = Number(asset.purchaseCost ?? 0) - Number(depSum._sum.amount ?? 0);
  const saleAmount = 200000;
  const gainLoss = saleAmount - bookValue;

  const disposal = await prisma.disposal.create({
    data: {
      assetId: asset.id,
      method: "SCRAP",
      status: "APPROVED",
      reason: "Kursi rusak permanen berdasarkan hasil inspeksi, tidak ekonomis untuk diperbaiki.",
      disposalDate: daysAgo(2),
      saleAmount: new Prisma.Decimal(saleAmount),
      bookValueAtDisposal: new Prisma.Decimal(bookValue.toFixed(2)),
      gainLoss: new Prisma.Decimal(gainLoss.toFixed(2)),
    },
  });

  await prisma.approval.create({
    data: {
      entityType: "DISPOSAL",
      status: "APPROVED",
      actorId: users["admin@company.com"],
      comments: "Disetujui berdasarkan hasil inspeksi dan rekomendasi tim.",
      decidedAt: daysAgo(2),
      disposalId: disposal.id,
    },
  });

  await prisma.asset.update({ where: { id: asset.id }, data: { status: "DISPOSED" } });
  await prisma.movementHistory.create({
    data: { assetId: asset.id, type: "DISPOSAL", notes: "Aset di-scrap setelah disposal disetujui", movedAt: daysAgo(2) },
  });
}

async function createProcurement(
  users: Record<string, string>,
  vendors: Record<string, string>,
  categories: Record<string, string>,
  locations: Record<string, string>,
  departments: Record<string, string>
) {
  const adminId = users["admin@company.com"];
  const managerId = users["manager@company.com"];

  // Fully completed flow: PR -> approved -> PO -> approved -> GR -> new asset registered
  const pr1 = await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-0001",
      requestedById: adminId,
      title: "Pengadaan Laptop untuk Tim Finance",
      justification: "Laptop lama sudah berumur lebih dari 4 tahun dan sering bermasalah",
      status: "APPROVED",
      neededDate: daysFromNow(14),
      createdAt: daysAgo(25),
      items: {
        create: [{ description: "Laptop Lenovo ThinkPad E14", categoryId: categories["ELEC"], quantity: 1, estimatedUnitCost: new Prisma.Decimal(12000000) }],
      },
    },
  });
  await prisma.approval.create({
    data: {
      entityType: "PURCHASE_REQUEST",
      status: "APPROVED",
      actorId: managerId,
      comments: "Disetujui, sesuai kebutuhan operasional",
      decidedAt: daysAgo(23),
      purchaseRequestId: pr1.id,
    },
  });

  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-0001",
      purchaseRequestId: pr1.id,
      vendorId: vendors["VEN-001"],
      status: "APPROVED",
      orderDate: daysAgo(20),
      expectedDate: daysAgo(10),
      totalAmount: new Prisma.Decimal(12000000),
      notes: "Pengiriman ke Kantor Pusat Jakarta",
      createdAt: daysAgo(20),
      items: {
        create: [{ description: "Laptop Lenovo ThinkPad E14", categoryId: categories["ELEC"], quantity: 1, unitCost: new Prisma.Decimal(12000000) }],
      },
    },
    include: { items: true },
  });
  await prisma.approval.create({
    data: {
      entityType: "PURCHASE_ORDER",
      status: "APPROVED",
      actorId: managerId,
      comments: "Vendor terverifikasi, harga kompetitif",
      decidedAt: daysAgo(19),
      purchaseOrderId: po1.id,
    },
  });

  const newAsset = await prisma.asset.create({
    data: {
      assetCode: "AST-2026-0017",
      name: "Laptop Lenovo ThinkPad E14",
      categoryId: categories["ELEC"],
      barcode: "AST-2026-0017",
      status: "ACTIVE",
      condition: "EXCELLENT",
      vendorId: vendors["VEN-001"],
      purchaseDate: daysAgo(8),
      purchaseCost: new Prisma.Decimal(12000000),
      invoiceNumber: "INV-GR-2026-0001",
      usefulLifeYears: 4,
      salvageValue: new Prisma.Decimal(1200000),
      locationId: locations["Kantor Finance"],
      departmentId: departments["FIN"],
      createdById: adminId,
    },
  });

  await prisma.goodsReceipt.create({
    data: {
      grNumber: "GR-2026-0001",
      purchaseOrderId: po1.id,
      receivedDate: daysAgo(8),
      notes: "Barang diterima dalam kondisi baik dan lengkap",
      createdAt: daysAgo(8),
      items: {
        create: [{ purchaseOrderItemId: po1.items[0].id, quantityReceived: 1, assetId: newAsset.id }],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminId,
      action: "CREATE",
      entityType: "Asset",
      entityId: newAsset.id,
      details: `Aset ${newAsset.name} (${newAsset.assetCode}) diregistrasi dari Goods Receipt GR-2026-0001`,
    },
  });

  // Pending PR awaiting approval (demonstrates the approval workflow in progress)
  await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-0002",
      requestedById: managerId,
      title: "Pengadaan AC untuk Ruang Marketing",
      justification: "AC ruangan sering mati dan tidak dingin",
      status: "PENDING",
      neededDate: daysFromNow(21),
      createdAt: daysAgo(4),
      items: {
        create: [{ description: "AC Split 1.5 PK", categoryId: categories["MACH"], quantity: 1, estimatedUnitCost: new Prisma.Decimal(7500000) }],
      },
    },
  });

  // Draft PR
  await prisma.purchaseRequest.create({
    data: {
      requestNumber: "PR-2026-0003",
      requestedById: adminId,
      title: "Pengadaan Meja & Kursi Tambahan",
      status: "DRAFT",
      createdAt: daysAgo(1),
      items: {
        create: [
          { description: "Meja Kerja Standar", categoryId: categories["FURN"], quantity: 3, estimatedUnitCost: new Prisma.Decimal(2500000) },
          { description: "Kursi Kantor", categoryId: categories["FURN"], quantity: 3, estimatedUnitCost: new Prisma.Decimal(1500000) },
        ],
      },
    },
  });

  return { newAsset };
}

async function createStockOpname(assets: Record<string, Awaited<ReturnType<typeof prisma.asset.create>>>) {
  const nonDisposed = Object.values(assets).filter((a) => a.status !== "DISPOSED");

  const opname = await prisma.stockOpname.create({
    data: {
      code: "SO-2026-0001",
      title: "Stock Opname Semester 1 2026",
      status: "COMPLETED",
      startDate: daysAgo(7),
      endDate: daysAgo(5),
      items: {
        create: nonDisposed.map((a, idx) => {
          const isMissing = a.assetCode === "AST-2026-0016"; // the LOST asset
          return {
            assetId: a.id,
            expectedLocationId: a.locationId ?? undefined,
            foundLocationId: isMissing ? undefined : a.locationId ?? undefined,
            found: !isMissing,
            isUnexpected: false,
            scannedAt: isMissing ? undefined : daysAgo(6),
            notes: isMissing ? "Aset tidak ditemukan di lokasi yang diharapkan" : undefined,
          };
        }),
      },
    },
  });

  return opname;
}

async function main() {
  console.log("Seeding database...");

  const users = await createUsers();
  const departments = await createDepartments();
  const branches = await createBranches();
  const locations = await createLocations(branches);
  const employees = await createEmployees(departments);
  const projects = await createProjects();
  const vendors = await createVendors();
  const categories = await createCategories();
  const types = await createTypes(categories);
  const brands = await createBrands();

  const refs: Refs = { categories, types, brands, vendors, locations, departments, users };
  const assets = await createAssets(refs);

  await generateDepreciation(assets);
  await createAllocationsAndMovements(assets, employees, departments, projects, locations);
  await createMaintenance(assets, users, vendors);
  await createInspections(assets);
  await createWarrantyAndContracts(assets, vendors);
  await createDisposal(assets, users);
  const { newAsset } = await createProcurement(users, vendors, categories, locations, departments);

  const allAssetsForAudit = { ...assets, "AST-2026-0017": newAsset };
  await createStockOpname(allAssetsForAudit);

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
