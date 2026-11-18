import { prisma } from "../lib/prisma";

async function main() {
  const soul = await prisma.outlet.findFirst({ where: { code: "SOULMATE_CAFE" } });
  const abu = await prisma.outlet.findFirst({ where: { code: "ABU_ADEL_PATISSERIE" } });

  console.log("=== SOULMATE ITEMS BREAKDOWN ===");
  const soulItems = await prisma.menuItem.findMany({
    where: { outletId: soul?.id },
    select: { id: true, nameAr: true, category: true, itemType: true, price: true },
    orderBy: { category: "asc" }
  });

  console.log(`Total Soul Mate Items: ${soulItems.length}`);
  const byCat: Record<string, number> = {};
  for (const it of soulItems) {
    byCat[it.category] = (byCat[it.category] || 0) + 1;
  }
  console.log("By Category:", byCat);

  console.log("\n=== ABU ADEL ITEMS BREAKDOWN ===");
  const abuItems = await prisma.menuItem.findMany({
    where: { outletId: abu?.id },
    select: { id: true, nameAr: true, category: true, itemType: true, price: true },
    orderBy: { category: "asc" }
  });
  console.log(`Total Abu Adel Items: ${abuItems.length}`);
  const abuByCat: Record<string, number> = {};
  for (const it of abuItems) {
    abuByCat[it.category] = (abuByCat[it.category] || 0) + 1;
  }
  console.log("By Category:", abuByCat);
}

main().catch(console.error).finally(() => prisma.$disconnect());
