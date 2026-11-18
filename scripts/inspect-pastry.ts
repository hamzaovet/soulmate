import { prisma } from "../lib/prisma";

async function main() {
  const abuAdel = await prisma.outlet.findFirst({ where: { code: "ABU_ADEL_PATISSERIE" } });
  const soulMate = await prisma.outlet.findFirst({ where: { code: "SOUL_MATE_CAFE" } });
  console.log("Abu Adel ID:", abuAdel?.id);
  console.log("Soul Mate ID:", soulMate?.id);

  // Look at where query from app/api/pastry-inventory/route.ts
  const pastryWhere: any = {
    OR: [
      { outlet: { code: "ABU_ADEL_PATISSERIE" } },
      ...(abuAdel ? [{ outletId: abuAdel.id }] : []),
      { itemType: "READY_PASTRY" },
    ],
  };

  const pastryItems = await prisma.menuItem.findMany({
    where: pastryWhere,
    include: { outlet: true },
  });

  console.log("Total pastry items returned by api/pastry-inventory:", pastryItems.length);

  const notAbuAdel = pastryItems.filter(p => p.outletId !== abuAdel?.id);
  console.log("Pastry items NOT assigned to Abu Adel outlet ID:", notAbuAdel.length);
  for (const it of notAbuAdel) {
    console.log(`- [${it.id}] ${it.nameAr} | outlet: ${it.outlet?.code} | type: ${it.itemType} | cat: ${it.category}`);
  }

  // Also check if any items belonging to Abu Adel have categories like beverage
  const allAbu = await prisma.menuItem.findMany({
    where: { outletId: abuAdel?.id },
  });
  console.log("Total items with outletId = Abu Adel:", allAbu.length);

  const abuBeverages = allAbu.filter(i => 
    i.category.includes("مشروب") || 
    i.category.includes("قهوة") || 
    i.nameAr.includes("ريد بول") || 
    i.nameAr.includes("مياه") || 
    i.nameAr.includes("كانز") ||
    i.nameAr.includes("آيس كريم") ||
    i.nameAr.includes("ايس كريم")
  );
  console.log("Abu Adel items with beverage / ice cream keywords in name/category:", abuBeverages.length);
  for (const it of abuBeverages) {
    console.log(`* [${it.id}] ${it.nameAr} | type: ${it.itemType} | cat: ${it.category}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
