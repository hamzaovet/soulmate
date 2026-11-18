import { prisma } from "../lib/prisma";

async function main() {
  const abuAdel = await prisma.outlet.findFirst({
    where: { code: "ABU_ADEL_PATISSERIE" }
  });
  const soulMate = await prisma.outlet.findFirst({
    where: { code: "SOULMATE_CAFE" }
  });

  if (!abuAdel || !soulMate) {
    console.log("Could not find outlets");
    return;
  }

  const abuBeverages = await prisma.menuItem.findMany({
    where: {
      outletId: abuAdel.id,
      OR: [
        { itemType: "PREPARED_BEVERAGE" },
        { category: { in: ["HOT_DRINKS", "ICE_COFFEE", "HOT_COFFEE", "COLD_COFFEE", "SMOOTHIE", "MILKSHAKE", "FRESH_JUICE", "MOJITO"] } }
      ]
    }
  });

  console.log(`Beverages in Abu Adel: ${abuBeverages.length}`);
  for (const b of abuBeverages) {
    console.log(`  - ${b.nameAr} (${b.category})`);
  }

  const soulPastries = await prisma.menuItem.findMany({
    where: {
      outletId: soulMate.id,
      OR: [
        { category: { in: ["ORIENTAL_SWEETS", "KAHK_NOVAM", "BAKERY_FETEER", "CHOCOLATE_SWEETS"] } }
      ]
    }
  });

  console.log(`Oriental pastries in Soul Mate: ${soulPastries.length}`);
  for (const p of soulPastries) {
    console.log(`  - ${p.nameAr} (${p.category})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
