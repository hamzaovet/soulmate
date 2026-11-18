import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("☕ Seeding Standalone Soulmate Dessert & Coffee Database...");

  // 1. System Settings (Pure Soulmate)
  await prisma.systemSettings.upsert({
    where: { id: "default-settings" },
    update: {
      brandNameAr: "سول ميت كافيه — Soulmate Dessert & Coffee",
      brandNameEn: "Soulmate Dessert & Coffee",
      cafeAddress: "99st zamza mn elshisk 8orab",
      soulmatePhone: "01557879033",
      abuAdelPhone: "01557879033",
      hotline: "01557879033",
      whatsapp: "01557879033",
      instapayAccount: "soulmate@instapay",
      vodafoneCashNumber: "01557879033",
      serviceChargePercent: 0,
      taxPercent: 0,
      isServiceChargeEnabled: false,
      isTaxEnabled: false,
      isLoyaltyEnabled: false,
      shift1Name: "الوردية الأولى (الصباحية)",
      shift1Pin: "1111",
      shift2Name: "الوردية الثانية (المسائية)",
      shift2Pin: "2222",
      receiptFooterNotes: "Soulmate Dessert & Coffee • 99st zamza mn elshisk 8orab • 01557879033",
    },
    create: {
      id: "default-settings",
      brandNameAr: "سول ميت كافيه — Soulmate Dessert & Coffee",
      brandNameEn: "Soulmate Dessert & Coffee",
      cafeAddress: "99st zamza mn elshisk 8orab",
      soulmatePhone: "01557879033",
      abuAdelPhone: "01557879033",
      hotline: "01557879033",
      whatsapp: "01557879033",
      instapayAccount: "soulmate@instapay",
      vodafoneCashNumber: "01557879033",
      serviceChargePercent: 0,
      taxPercent: 0,
      isServiceChargeEnabled: false,
      isTaxEnabled: false,
      isLoyaltyEnabled: false,
      shift1Name: "الوردية الأولى (الصباحية)",
      shift1Pin: "1111",
      shift2Name: "الوردية الثانية (المسائية)",
      shift2Pin: "2222",
      receiptFooterNotes: "Soulmate Dessert & Coffee • 99st zamza mn elshisk 8orab • 01557879033",
    },
  });

  // 2. Single Outlet: SOULMATE_CAFE ONLY
  const soulmate = await prisma.outlet.upsert({
    where: { code: "SOULMATE_CAFE" },
    update: {
      name: "سول ميت كافيه (Soulmate Dessert & Coffee)",
      type: "CAFE",
      address: "99st zamza mn elshisk 8orab",
      phone: "01557879033",
      whatsapp: "01557879033",
      logoUrl: "/soulmate-logo.png",
      isActive: true,
    },
    create: {
      code: "SOULMATE_CAFE",
      name: "سول ميت كافيه (Soulmate Dessert & Coffee)",
      type: "CAFE",
      address: "99st zamza mn elshisk 8orab",
      phone: "01557879033",
      whatsapp: "01557879033",
      logoUrl: "/soulmate-logo.png",
      isActive: true,
    },
  });

  // 3. Pure Soulmate Users
  const users = [
    {
      username: "maestro",
      name: "أ / حمزة عباس (المايسترو - المالك)",
      passwordHash: "123456789",
      pin: "157230",
      role: "owner",
      outletId: soulmate.id,
      phone: "01018671000",
      isActive: true,
    },
    {
      username: "manager-soulmate",
      name: "مدير كافيه سول ميت",
      passwordHash: "soulmate@2026",
      pin: "782015",
      role: "branch_manager",
      outletId: soulmate.id,
      phone: "01557879033",
      isActive: true,
    },
    {
      username: "cashier-soulmate",
      name: "كاشير سول ميت كافيه",
      passwordHash: "cashier@soulmate",
      pin: "1111",
      role: "cashier",
      outletId: soulmate.id,
      phone: "01557879033",
      isActive: true,
    },
    {
      username: "barista-soulmate",
      name: "كابتن الباريستا (KDS)",
      passwordHash: "barista@soulmate",
      pin: "2222",
      role: "barista",
      outletId: soulmate.id,
      phone: "01557879033",
      isActive: true,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: u,
      create: u,
    });
  }

  // 4. 12 Dining Tables for Soulmate Hall
  const tables = [
    { tableNumber: "1", zone: "INDOOR", capacity: 4 },
    { tableNumber: "2", zone: "INDOOR", capacity: 4 },
    { tableNumber: "3", zone: "INDOOR", capacity: 2 },
    { tableNumber: "4", zone: "INDOOR", capacity: 6 },
    { tableNumber: "5", zone: "INDOOR", capacity: 4 },
    { tableNumber: "6", zone: "INDOOR", capacity: 4 },
    { tableNumber: "7", zone: "OUTDOOR", capacity: 4 },
    { tableNumber: "8", zone: "OUTDOOR", capacity: 4 },
    { tableNumber: "9", zone: "OUTDOOR", capacity: 6 },
    { tableNumber: "10", zone: "OUTDOOR", capacity: 4 },
    { tableNumber: "11", zone: "VIP_LOUNGE", capacity: 4 },
    { tableNumber: "12", zone: "VIP_LOUNGE", capacity: 4 },
  ];

  for (const t of tables) {
    const existing = await prisma.diningTable.findFirst({
      where: { outletId: soulmate.id, tableNumber: t.tableNumber },
    });
    if (!existing) {
      await prisma.diningTable.create({
        data: {
          outletId: soulmate.id,
          tableNumber: t.tableNumber,
          zone: t.zone,
          capacity: t.capacity,
          status: "AVAILABLE",
          qrCodeUrl: `/order?table=${t.tableNumber}`,
        },
      });
    }
  }

  // 5. Core Bar Raw Materials
  const rawMaterialsData = [
    { nameAr: "بن إسبريسو كولومبي حبوب فاخر", unit: "GRAM", currentStock: 5000, minStockAlert: 1000, costPerUnit: 0.8 },
    { nameAr: "حليب طازج مبستر كامل الدسم", unit: "ML", currentStock: 30000, minStockAlert: 5000, costPerUnit: 0.04 },
    { nameAr: "صوص لوتس بلجيكي أصلي", unit: "GRAM", currentStock: 4000, minStockAlert: 800, costPerUnit: 0.25 },
    { nameAr: "سيرب فانيليا فرنسي مركز", unit: "ML", currentStock: 2500, minStockAlert: 500, costPerUnit: 0.2 },
    { nameAr: "سيرب كراميل مملح غني", unit: "ML", currentStock: 2500, minStockAlert: 500, costPerUnit: 0.2 },
    { nameAr: "بودرة كاكاو وشوكولاتة بلجيكي", unit: "GRAM", currentStock: 3000, minStockAlert: 500, costPerUnit: 0.35 },
    { nameAr: "أكواب ورقية دبل مع أغطية حرارية", unit: "PIECE", currentStock: 1000, minStockAlert: 150, costPerUnit: 2.5 },
    { nameAr: "شاليموه كوشيه معقم مع مناديل", unit: "PIECE", currentStock: 1500, minStockAlert: 200, costPerUnit: 0.5 },
  ];

  for (const rm of rawMaterialsData) {
    const existing = await prisma.rawMaterial.findFirst({
      where: { outletId: soulmate.id, nameAr: rm.nameAr },
    });
    if (!existing) {
      await prisma.rawMaterial.create({ data: { outletId: soulmate.id, ...rm } });
    }
  }

  console.log("✅ Soulmate base entities seeded! Now run seed_real_soulmate_menu.ts for full menu.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
