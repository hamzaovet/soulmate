import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/categories";

export const dynamic = "force-dynamic";

function formatDateDMY(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${m}-${y}`;
}

function formatDateTimeDMY(d: Date): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDateDMY(d)} ${hh}:${mm}`;
}

/**
 * GET /api/reports/daily-summary?date=YYYY-MM-DD&shiftCode=ALL|SHIFT_1|SHIFT_2
 * Computes BOTH Photo 9 (Category Items Breakdown) and Photo 10 (Financial Summary)
 * Read-only so any shift can view & print the other shift's report without editing it.
 */
export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date");
    const startDateParam = req.nextUrl.searchParams.get("startDate") || dateParam;
    const endDateParam = req.nextUrl.searchParams.get("endDate") || startDateParam;
    const shiftParam = req.nextUrl.searchParams.get("shiftCode") || "ALL"; // ALL | SHIFT_1 | SHIFT_2

    const now = new Date();
    let startOfDay: Date;
    let endOfDay: Date;

    if (startDateParam && /^\d{4}-\d{2}-\d{2}$/.test(startDateParam)) {
      const [y, m, d] = startDateParam.split("-").map(Number);
      startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    } else {
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    if (endDateParam && /^\d{4}-\d{2}-\d{2}$/.test(endDateParam)) {
      const [y, m, d] = endDateParam.split("-").map(Number);
      endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      endOfDay = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), startOfDay.getDate(), 23, 59, 59, 999);
    }

    // Safety check if user selects an end date earlier than start date
    if (endOfDay < startOfDay) {
      const temp = startOfDay;
      startOfDay = new Date(endOfDay.getFullYear(), endOfDay.getMonth(), endOfDay.getDate(), 0, 0, 0, 0);
      endOfDay = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate(), 23, 59, 59, 999);
    }

    const orderWhere: any = {
      createdAt: { gte: startOfDay, lte: endOfDay },
    };
    if (shiftParam === "SHIFT_1" || shiftParam === "SHIFT_2") {
      orderWhere.shiftCode = shiftParam;
    }

    const [orders, expenses, menuItems, setting, shifts] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.findMany({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } },
      }),
      prisma.menuItem.findMany({
        select: { id: true, nameAr: true, nameEn: true, category: true },
      }),
      prisma.systemSettings.findFirst(),
      prisma.shift.findMany({
        where: {
          openedAt: { gte: startOfDay, lte: endOfDay },
          ...(shiftParam === "SHIFT_1" || shiftParam === "SHIFT_2" ? { shiftCode: shiftParam } : {}),
        },
        orderBy: { openedAt: "asc" },
      }),
    ]);

    const menuMap = new Map(menuItems.map((m) => [m.id, m]));
    const paidOrders = orders.filter((o) => o.paymentStatus === "PAID" && o.status !== "CANCELLED");
    const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

    // Talabat classifier
    const isTalabat = (o: any) =>
      o.orderType === "TALABAT" || (o.paymentMethod || "").toUpperCase() === "TALABAT";

    const talabatOrders = paidOrders.filter(isTalabat);
    const inStorePaidOrders = paidOrders.filter((o) => !isTalabat(o));

    // 1. Payment Breakdown (Photo 10)
    // Talabat is excluded from cash drawer so it does not cause an artificial cash deficit
    const sumByPay = (codes: string[]) =>
      inStorePaidOrders
        .filter((o) => codes.includes((o.paymentMethod || "CASH").toUpperCase()))
        .reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);

    const cash = sumByPay(["CASH"]);
    const visa = sumByPay(["CARD", "VISA"]);
    const instapay = sumByPay(["INSTAPAY"]);
    const vodafoneCash = sumByPay(["VODAFONE_CASH"]);
    const staff = sumByPay(["STAFF"]);
    const hospitality = sumByPay(["HOSPITALITY"]);
    const credit = sumByPay(["CREDIT"]);
    const tips = paidOrders.reduce((s, o) => s + (Number(o.tipAmount) || 0), 0);

    // 2. Talabat Accounting (Gross, Commission, Net Receivable - outside drawer)
    const talabatGross = talabatOrders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
    const talabatCommissionPercent = Number(setting?.talabatCommissionPercent ?? 25) || 25;
    const talabatCommission = talabatOrders.reduce(
      (s, o) =>
        s +
        (Number(o.commissionAmount) ||
          ((Number(o.finalAmount) || 0) * talabatCommissionPercent) / 100),
      0
    );
    const talabatNet = Math.max(0, talabatGross - talabatCommission);
    const talabatCount = talabatOrders.length;

    // 3. Order Types Breakdown (Photo 10)
    const takeawayOrders = paidOrders.filter((o) => o.orderType === "TAKEAWAY" && !isTalabat(o));
    const dineInOrders = paidOrders.filter((o) => o.orderType === "DINE_IN");
    const deliveryOrders = paidOrders.filter((o) => o.orderType === "DELIVERY" && !isTalabat(o));

    const takeawaySales = takeawayOrders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
    const dineInSales = dineInOrders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
    const dineInService = dineInOrders.reduce((s, o) => s + (Number(o.serviceCharge) || 0), 0);

    // Explicitly separate delivery product sales from delivery fees
    const deliveryGrossSales = deliveryOrders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
    const deliveryFees = deliveryOrders.reduce((s, o) => s + (Number(o.deliveryFee) || 0), 0);
    const deliveryFoodSales = Math.max(0, deliveryGrossSales - deliveryFees);

    const grandTotalSales = paidOrders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);
    // Pure product sales (food & drinks) without delivery fees
    const productSalesOnly = Math.max(0, grandTotalSales - deliveryFees);

    const expensesTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const returnsTotal = cancelledOrders.reduce((s, o) => s + (Number(o.finalAmount) || 0), 0);

    // 3. Category-Grouped Items Breakdown (Photo 9)
    const catMap = new Map<string, Map<string, { name: string; qty: number; total: number }>>();
    for (const o of paidOrders) {
      let items: any[] = [];
      try {
        items = typeof o.items === "string" ? JSON.parse(o.items) : o.items || [];
      } catch {
        items = [];
      }
      for (const it of items) {
        const meta = it.menuItemId ? menuMap.get(it.menuItemId) : null;
        const catCode = it.category || meta?.category || "OTHER";
        const catLabel = getCategoryLabel(catCode) || catCode;
        const itemName = it.nameEn || meta?.nameEn || it.nameAr || "صنف";
        const qty = Number(it.qty) || 1;
        const total = (Number(it.price) || 0) * qty;

        if (!catMap.has(catLabel)) catMap.set(catLabel, new Map());
        const itemsMap = catMap.get(catLabel)!;
        const prev = itemsMap.get(itemName) || { name: itemName, qty: 0, total: 0 };
        prev.qty += qty;
        prev.total += total;
        itemsMap.set(itemName, prev);
      }
    }

    const categories = Array.from(catMap.entries()).map(([categoryName, map]) => {
      const items = Array.from(map.values()).sort((a, b) => b.total - a.total);
      return {
        categoryName,
        items,
        totalQty: items.reduce((s, i) => s + i.qty, 0),
        totalAmount: items.reduce((s, i) => s + i.total, 0),
      };
    });

    const shift1Name = setting?.shift1Name || "الوردية الأولى (الصباحية)";
    const shift2Name = setting?.shift2Name || "الوردية الثانية (المسائية)";
    const isSingleDay = formatDateDMY(startOfDay) === formatDateDMY(endOfDay);
    const dateStr = isSingleDay
      ? formatDateDMY(startOfDay)
      : `${formatDateDMY(startOfDay)} إلى ${formatDateDMY(endOfDay)}`;

    const shiftLabel =
      shiftParam === "SHIFT_1"
        ? shift1Name
        : shiftParam === "SHIFT_2"
        ? shift2Name
        : isSingleDay
        ? "إجمالي اليوم (كل الورديات)"
        : `إجمالي مبيعات الفترة (${dateStr})`;

    const firstShift = shifts[0];
    const lastShift = shifts[shifts.length - 1];
    const openingBalance = shifts.reduce((s, sh) => s + (Number(sh.openingCashFloat) || 0), 0);
    const totalMovement = cash - expensesTotal;
    const closingBalance = openingBalance + totalMovement;
    const difference = shifts.reduce((s, sh) => s + (Number(sh.difference) || 0), 0);

    const dayNumber = `${startOfDay.getFullYear().toString().slice(-2)}${String(startOfDay.getMonth() + 1).padStart(2, "0")}${String(startOfDay.getDate()).padStart(2, "0")}`;

    return NextResponse.json({
      success: true,
      shiftNames: { SHIFT_1: shift1Name, SHIFT_2: shift2Name },
      report: {
        reportNumber: dayNumber,
        shiftCode: shiftParam,
        shiftLabel,
        dateStr,
        openedAt: firstShift?.openedAt ? formatDateTimeDMY(new Date(firstShift.openedAt)) : formatDateTimeDMY(startOfDay),
        openedBy: firstShift?.openedBy || paidOrders[paidOrders.length - 1]?.cashierName || "كاشير سول ميت",
        openingBalance,
        closedAt: lastShift?.closedAt ? formatDateTimeDMY(new Date(lastShift.closedAt)) : formatDateTimeDMY(now),
        closedBy: lastShift?.closedBy || paidOrders[0]?.cashierName || "كاشير سول ميت",
        closingBalance,
        totalMovement,
        cash,
        visa,
        instapay,
        vodafoneCash,
        staff,
        hospitality,
        credit,
        tips,
        expenses: expensesTotal,
        returnsTotal,
        returnsCount: cancelledOrders.length,
        purchasesTotal: 0,
        purchaseReturnsTotal: 0,
        deletedQty: 0,
        takeawaySales,
        takeawayCount: takeawayOrders.length,
        dineInSales,
        dineInCount: dineInOrders.length,
        dineInService,
        deliverySales: deliveryGrossSales,
        deliveryFoodSales,
        deliveryCount: deliveryOrders.length,
        deliveryFees,
        talabatGross,
        talabatCommissionPercent,
        talabatCommission,
        talabatNet,
        talabatCount,
        productSalesOnly,
        grandTotalSales,
        difference,
        categories,
      },
      // Today's orders table (exact columns from Photo 6: رقم البون، التاريخ، مصدر الفاتورة، الطاولة، الإجمالي، المدفوع، المتبقي، حالة الفاتورة، الوردية، طرق الدفع)
      orders: orders.map((o) => ({
        id: o.id,
        dailyTicketNo: o.dailyTicketNo,
        orderNumber: o.orderNumber,
        orderType: o.orderType,
        isTalabat: isTalabat(o),
        tableNumber: o.tableNumber,
        cashierName: o.cashierName || "كاشير",
        waiterName: o.waiterName || "",
        shiftCode: o.shiftCode || "SHIFT_1",
        shiftName: (o.shiftCode || "SHIFT_1") === "SHIFT_2" ? shift2Name : shift1Name,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        finalAmount: o.finalAmount,
        deliveryFee: Number(o.deliveryFee) || 0,
        commissionAmount: Number(o.commissionAmount) || 0,
        paidAmount: o.paymentStatus === "PAID" ? o.finalAmount : 0,
        remainingAmount: o.paymentStatus === "PAID" ? 0 : o.finalAmount,
        notes: o.notes,
        items: o.items,
        createdAt: o.createdAt,
      })),
    });
  } catch (err: any) {
    console.error("[DAILY_SUMMARY_GET]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
