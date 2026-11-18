import { prisma } from "../lib/prisma";

async function main() {
  const items = await prisma.menuItem.findMany({
    select: { id: true, nameAr: true, outletId: true, outlet: { select: { code: true } } },
  });
  const noOutlet = items.filter((i) => !i.outletId);
  console.log("Items with NO outletId:", noOutlet.length);
  const byCode: Record<string, number> = {};
  for (const i of items) {
    const c = i.outlet?.code || "NULL";
    byCode[c] = (byCode[c] || 0) + 1;
  }
  console.log("Items by outlet code:", byCode);
}

main().catch(console.error).finally(() => prisma.$disconnect());
