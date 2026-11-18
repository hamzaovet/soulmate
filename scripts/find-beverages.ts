import { prisma } from "../lib/prisma";

async function main() {
  const items = await prisma.menuItem.findMany({
    include: { outlet: true },
    orderBy: { outletId: "asc" }
  });

  console.log(`Total items in database: ${items.length}`);

  // Search for any beverages/drinks
  const beverageKeywords = [
    "اسبريسو", "espresso", "كابتشينو", "cappuccino", "لاتيه", "latte", 
    "موكا", "mocha", "امريكانو", "americano", "قهوة", "coffee", 
    "ميكياتو", "macchiato", "كورتادو", "cortado", "فلات وايت", "flat white",
    "شاي", "tea", "سحلب", "هوت شوكليت", "hot chocolate", "نسكافيه",
    "سموذي", "smoothie", "ميلك شيك", "milkshake", "فرابيه", "frappe",
    "عصير", "juice", "موهيتو", "mojito", "ريد بول", "red bull",
    "سودا", "soda", "مياه", "water", "بيبسي", "pepsi", "سفن", "كوكاكولا"
  ];

  console.log("\n=== BEVERAGE ITEMS ACROSS BOTH OUTLETS ===");
  for (const it of items) {
    const isBev = beverageKeywords.some(k => 
      it.nameAr.toLowerCase().includes(k) || 
      (it.nameEn && it.nameEn.toLowerCase().includes(k)) ||
      ["HOT_COFFEE", "COLD_COFFEE", "BEVERAGES", "HOT_DRINKS"].includes(it.category) ||
      it.itemType === "PREPARED_BEVERAGE"
    );

    if (isBev) {
      console.log(`[${it.outlet.name}] (${it.outlet.code}) -> ID: ${it.id} | Name: ${it.nameAr} | Category: ${it.category} | Type: ${it.itemType}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
