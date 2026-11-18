import { prisma } from "../lib/prisma";

async function main() {
  const outlets = await prisma.outlet.findMany();
  console.log("=== OUTLETS ===");
  for (const o of outlets) {
    const itemCount = await prisma.menuItem.count({ where: { outletId: o.id } });
    console.log(`Outlet: ${o.name} | Code: ${o.code} | ID: ${o.id} | Items: ${itemCount}`);
  }

  console.log("\n=== CHECKING ABU ADEL ITEMS FOR CAFE DRINKS (like espresso) ===");
  const abuAdel = outlets.find(o => o.code === "ABU_ADEL_PATISSERIE" || o.name.includes("أبو عادل"));
  const soulMate = outlets.find(o => o.code === "SOULMATE_CAFE" || o.name.includes("سول ميت"));

  if (abuAdel) {
    const abuItems = await prisma.menuItem.findMany({
      where: { outletId: abuAdel.id },
      select: { id: true, nameAr: true, category: true, itemType: true, price: true }
    });
    console.log(`Total Abu Adel Items: ${abuItems.length}`);
    const suspiciousCafeItems = abuItems.filter(i => 
      /اسبريسو|قهوة|كافيه|لاتيه|موكا|كابتشينو|شاي|نسكافيه|عصير|سموزي|ميلك|مشروب|كوكتيل|بيبسي|مياه|سودا|فريب|فرابيه/i.test(i.nameAr) ||
      ["HOT_COFFEE", "COLD_COFFEE", "BEVERAGES"].includes(i.category) ||
      i.itemType === "PREPARED_BEVERAGE"
    );
    console.log(`Found ${suspiciousCafeItems.length} suspicious cafe items in Abu Adel:`);
    for (const item of suspiciousCafeItems) {
      console.log(`  - [${item.id}] ${item.nameAr} (Category: ${item.category}, Type: ${item.itemType}, Price: ${item.price})`);
    }
  }

  if (soulMate) {
    const soulItems = await prisma.menuItem.findMany({
      where: { outletId: soulMate.id },
      select: { id: true, nameAr: true, category: true, itemType: true }
    });
    console.log(`\nTotal Soul Mate Items: ${soulItems.length}`);
    const suspiciousPastry = soulItems.filter(i =>
      /بسبوسة|كنافة|جاتوه|تورتة|بقلاوة|بلح الشام|زلابية|قطايف|كحك|بيتي فور|غريبة|هريسة|حلويات شرقية/i.test(i.nameAr) &&
      !/وافل|بان كيك|كيك|ايس كريم/i.test(i.nameAr)
    );
    console.log(`Found ${suspiciousPastry.length} suspicious oriental pastry items in Soul Mate:`);
    for (const item of suspiciousPastry) {
      console.log(`  - [${item.id}] ${item.nameAr} (Category: ${item.category})`);
    }
  }

  console.log("\n=== USERS AND ROLES ===");
  const users = await prisma.user.findMany({
    include: { outlet: true }
  });
  for (const u of users) {
    console.log(`User: ${u.username} (${u.name}) | Role: ${u.role} | Outlet: ${u.outlet?.name || 'ALL'}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
