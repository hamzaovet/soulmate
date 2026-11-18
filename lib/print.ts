/**
 * Soulmate Dessert & Coffee — Exact-Replica 80mm Thermal Print Engine
 * Prints via hidden iframe with `@page { size: 80mm auto; margin: 0 }` so
 * browser URLs/dates never appear and text is never clipped on thermal rolls.
 */

export function printThermalHtml(html: string) {
  if (typeof window === "undefined") return;
  try {
    let iframe = document.getElementById("__soulmate_print_frame__") as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "__soulmate_print_frame__";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (e) {
        console.error("[Soulmate Print Error]", e);
      }
    }, 280);
  } catch (err) {
    console.error("[Soulmate Print Engine]", err);
  }
}

const COMMON_THERMAL_CSS = `
  @page {
    size: 80mm auto;
    margin: 0mm !important;
  }
  * {
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    width: 72mm;
    max-width: 72mm;
    margin: 0 auto !important;
    padding: 1.5mm 1.5mm 4mm 1.5mm !important;
    background: #ffffff !important;
    color: #000000 !important;
    font-family: "Segoe UI", Tahoma, Arial, sans-serif !important;
    direction: rtl;
    font-size: 11px;
    line-height: 1.3;
  }
`;

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateDMY(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${m}-${y}`;
}

function formatTimePA(d: Date): string {
  const h24 = d.getHours();
  const suffix = h24 >= 12 ? "P" : "A";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${suffix} ${String(h12).padStart(2, "0")}:${min}`;
}

function formatTimeAMPM(d: Date): string {
  const h24 = d.getHours();
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${suffix} ${String(h12).padStart(2, "0")}:${min}`;
}

function paymentLabelEn(method?: string): string {
  switch ((method || "CASH").toUpperCase()) {
    case "CARD":
    case "VISA":
      return "Visa";
    case "INSTAPAY":
      return "InstaPay";
    case "VODAFONE_CASH":
      return "Vodafone Cash";
    case "STAFF":
      return "Staff";
    case "HOSPITALITY":
      return "ضيافة";
    case "CREDIT":
      return "اجل";
    default:
      return "Cash";
  }
}

/**
 * 1. Exact Replica of Soulmate Customer Receipt (Photo 7)
 */
export function generateSoulmateReceiptHtml(order: any, settings?: any): string {
  const created = order.createdAt ? new Date(order.createdAt) : new Date();
  let items: any[] = [];
  try {
    items = typeof order.items === "string" ? JSON.parse(order.items) : order.items || [];
  } catch {
    items = [];
  }

  const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 1), 0);
  const subtotal = Number(order.subtotal ?? order.finalAmount ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const tax = Number(order.taxAmount ?? 0);
  const service = Number(order.serviceCharge ?? 0);
  const finalAmount = Number(order.finalAmount ?? subtotal - discount + tax + service);

  const ticketNo =
    order.dailyTicketNo ||
    String(order.orderNumber || "1").replace(/\D/g, "").slice(-4) ||
    "1";

  const orderTypeTitle =
    order.orderType === "DINE_IN"
      ? `اوردر صالة - بون رقم ${ticketNo}`
      : order.orderType === "DELIVERY"
      ? `اوردر دليفري - بون رقم ${ticketNo}`
      : `اوردر تيك أواي - بون رقم ${ticketNo}`;

  const tableDisplay = order.tableNumber
    ? String(order.tableNumber).replace(/^T-0?/i, "")
    : "";

  const address = settings?.cafeAddress || "99st zamza mn elshisk 8orab";
  const phone = settings?.soulmatePhone || settings?.whatsapp || "01271673463";

  const rowsHtml = items
    .map((it) => {
      const qty = Number(it.qty) || 1;
      const price = Number(it.price) || 0;
      const lineTotal = (price * qty).toFixed(2);
      const displayName = it.nameEn ? `${it.nameEn}${it.nameAr ? ` / ${it.nameAr}` : ""}` : it.nameAr || "صنف";
      const noteLine = it.notes ? `<div style="font-size:9px;color:#222;margin-top:1px;">* ${it.notes}</div>` : "";
      return `
        <tr>
          <td style="text-align:right;font-weight:600;padding:3px 4px;">${displayName}${noteLine}</td>
          <td style="text-align:center;font-family:monospace;">${price.toFixed(0)}</td>
          <td style="text-align:center;font-family:monospace;font-weight:700;">${qty}</td>
          <td style="text-align:center;font-family:monospace;font-weight:700;">${lineTotal}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Soulmate Receipt</title>
  <style>
    ${COMMON_THERMAL_CSS}
    .logo-wrap { text-align: center; margin-bottom: 4px; }
    .logo-brand {
      font-family: "Brush Script MT", "Segoe Script", Georgia, serif;
      font-size: 27px;
      font-weight: 900;
      font-style: italic;
      line-height: 1;
      letter-spacing: 0.5px;
    }
    .logo-sub {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      margin-top: 1px;
    }
    .bon-box {
      border: 1.5px solid #000;
      text-align: center;
      font-size: 13px;
      font-weight: 900;
      padding: 3px 6px;
      margin: 5px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      margin: 2px 2px;
    }
    table.items-tbl {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 10.5px;
    }
    table.items-tbl th {
      border-bottom: 1.5px solid #000;
      padding: 3px 2px;
      font-weight: 900;
      text-align: center;
    }
    table.items-tbl td {
      border: 1px solid #000;
      padding: 3px 2px;
      vertical-align: middle;
    }
    .sum-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 4px;
      border-bottom: 1px solid #000;
      font-weight: 800;
      font-size: 11px;
    }
    .sum-thick {
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      margin-top: 4px;
      font-size: 12px;
      font-weight: 900;
    }
    .net-box {
      border: 1.5px solid #000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 8px;
      margin-top: 5px;
      font-size: 14px;
      font-weight: 900;
    }
    .pay-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 8px;
      font-size: 11.5px;
      font-weight: 800;
    }
    .footer-block {
      text-align: center;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px dashed #000;
      font-size: 10.5px;
      font-weight: 700;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="logo-wrap">
    <svg width="42" height="24" viewBox="0 0 64 36" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto 2px;">
      <path d="M24 10 C24 5, 30 5, 32 9 C34 5, 40 5, 40 10 C40 14, 32 18, 32 18 C32 18, 24 14, 24 10 Z" fill="none" stroke="#000" stroke-width="2.2"/>
      <path d="M18 20 H44 V26 C44 31, 39 34, 31 34 C23 34, 18 31, 18 26 Z" fill="none" stroke="#000" stroke-width="2.5"/>
      <path d="M44 21 H48 C51 21, 51 28, 44 28" fill="none" stroke="#000" stroke-width="2.2"/>
      <line x1="12" y1="35" x2="50" y2="35" stroke="#000" stroke-width="2"/>
    </svg>
    <div class="logo-brand">Soulmate</div>
    <div class="logo-sub">Dessert &amp; coffee</div>
  </div>

  <div class="bon-box">${orderTypeTitle}</div>

  ${
    order.orderType === "DINE_IN"
      ? `<div class="meta-row">
          <span>الصالة: صالة 1</span>
          <span>الطاولة: ${tableDisplay || "-"}</span>
        </div>`
      : order.customerName
      ? `<div class="meta-row">
          <span>العميل: ${order.customerName}</span>
          <span>${order.customerPhone || ""}</span>
        </div>`
      : ""
  }

  <div class="meta-row" dir="ltr">
    <span>${formatTimePA(created)}</span>
    <span>${formatDateYMD(created)}</span>
  </div>

  ${
    order.notes
      ? `<div style="border:1px dashed #000;padding:3px 5px;margin-top:4px;font-size:10px;font-weight:700;">ملاحظة للباريستا: ${order.notes}</div>`
      : ""
  }

  <table class="items-tbl">
    <thead>
      <tr>
        <th style="width:46%;">الصنف</th>
        <th style="width:16%;">السعر</th>
        <th style="width:14%;">الكمية</th>
        <th style="width:24%;">الاجمالى</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sum-line sum-thick">
    <span>الاجمالى</span>
    <span style="font-family:monospace;">${totalQty}</span>
    <span style="font-family:monospace;">${subtotal.toFixed(2)}</span>
  </div>

  <div class="sum-line">
    <span>الخصم</span>
    <span style="font-family:monospace;">${discount.toFixed(2)}</span>
    <span>الضريبة</span>
    <span style="font-family:monospace;">${tax.toFixed(2)}</span>
  </div>

  <div class="sum-line">
    <span>الخدمة</span>
    <span style="font-family:monospace;">${service.toFixed(2)}</span>
  </div>

  <div class="net-box">
    <span>الصافى</span>
    <span style="font-family:monospace;">${finalAmount.toFixed(2)}</span>
  </div>

  <div class="pay-row">
    <span>${paymentLabelEn(order.paymentMethod)}</span>
    <span style="font-family:monospace;">${finalAmount.toFixed(2)}</span>
  </div>

  <div class="footer-block">
    <div style="font-size:12px;font-weight:900;">Soulmate</div>
    <div dir="ltr">${address}</div>
    <div dir="ltr" style="font-family:monospace;font-size:11.5px;font-weight:900;">${phone}</div>
  </div>
</body>
</html>`;
}

export interface DailyReportCategorySection {
  categoryName: string;
  items: { name: string; qty: number; total: number }[];
  totalQty: number;
  totalAmount: number;
}

export interface DailyReportPayload {
  reportNumber: string;
  shiftLabel: string;
  dateStr: string;
  openedAt?: string;
  openedBy: string;
  openingBalance: number;
  closedAt?: string;
  closedBy: string;
  closingBalance: number;
  totalMovement: number;
  cash: number;
  visa: number;
  instapay: number;
  vodafoneCash: number;
  staff: number;
  hospitality: number;
  credit: number;
  tips: number;
  expenses: number;
  returnsTotal: number;
  returnsCount: number;
  purchasesTotal: number;
  purchaseReturnsTotal: number;
  deletedQty: number;
  takeawaySales: number;
  takeawayCount: number;
  dineInSales: number;
  dineInCount: number;
  dineInService: number;
  deliverySales: number;
  deliveryFoodSales?: number;
  deliveryCount: number;
  deliveryFees: number;
  talabatGross?: number;
  talabatCommissionPercent?: number;
  talabatCommission?: number;
  talabatNet?: number;
  talabatCount?: number;
  productSalesOnly?: number;
  grandTotalSales: number;
  difference: number;
  categories: DailyReportCategorySection[];
}

/**
 * 2. Exact Replica of Photo 9 — Daily/Shift Items Breakdown by Category
 */
export function generateDailyItemsReportHtml(data: DailyReportPayload): string {
  const sectionsHtml = data.categories
    .map(
      (cat) => `
      <div class="cat-title">قسم &nbsp; ${cat.categoryName}</div>
      <table class="cat-tbl">
        <thead>
          <tr>
            <th style="width:58%;">الصنف</th>
            <th style="width:18%;">الكمية</th>
            <th style="width:24%;">الاجمالى</th>
          </tr>
        </thead>
        <tbody>
          ${cat.items
            .map(
              (it) => `
            <tr>
              <td style="text-align:center;font-weight:600;">${it.name}</td>
              <td style="text-align:center;font-family:monospace;font-weight:700;">${it.qty}</td>
              <td style="text-align:center;font-family:monospace;font-weight:700;">${it.total.toFixed(0)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
      <div class="cat-sub">
        <span>اجمالى القسم ${cat.categoryName}</span>
        <span style="font-family:monospace;">${cat.totalQty}</span>
        <span style="font-family:monospace;">${cat.totalAmount.toFixed(0)}</span>
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير مبيعات الأصناف</title>
  <style>
    ${COMMON_THERMAL_CSS}
    .title { text-align: center; font-size: 16px; font-weight: 900; margin-bottom: 2px; }
    .subtitle { text-align: center; font-size: 12px; font-weight: 800; margin-bottom: 8px; }
    .cat-title { text-align: center; font-size: 13px; font-weight: 900; margin: 8px 0 3px; }
    table.cat-tbl { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    table.cat-tbl th {
      background: #000 !important;
      color: #fff !important;
      padding: 4px 3px;
      border: 1px solid #000;
      font-weight: 900;
      text-align: center;
    }
    table.cat-tbl td {
      border: 1px solid #000;
      padding: 3px 3px;
    }
    .cat-sub {
      display: flex;
      justify-content: space-between;
      padding: 3px 6px;
      font-size: 11px;
      font-weight: 900;
      border-bottom: 1.5px dashed #000;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="title">${data.dateStr?.includes("إلى") ? "تقرير مبيعات الفترة" : "تقرير مبيعات اليوم"}</div>
  <div class="subtitle">${data.shiftLabel}</div>
  ${sectionsHtml || '<div style="text-align:center;padding:12px;">لا توجد مبيعات مسجلة في هذه الفترة</div>'}
</body>
</html>`;
}

/**
 * 3. Exact Replica of Photo 10 — Daily/Shift Financial Summary Report
 */
export function generateDailyFinancialSummaryHtml(data: DailyReportPayload): string {
  const now = new Date();
  const row = (label: string, value: string, bold = false) => `
    <div class="f-row ${bold ? "f-bold" : ""}">
      <span>${label}</span>
      <span dir="ltr" class="f-val">${value}</span>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير مبيعات اليوم - الملخص المالي</title>
  <style>
    ${COMMON_THERMAL_CSS}
    .title { text-align: center; font-size: 16px; font-weight: 900; margin-bottom: 6px; }
    .box { border: 1.5px solid #000; }
    .sec-head {
      text-align: center;
      font-weight: 900;
      font-size: 11.5px;
      padding: 4px;
      border-top: 1.5px solid #000;
      border-bottom: 1px solid #000;
      background: #f1f5f9 !important;
    }
    .f-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5px 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .f-bold { font-weight: 900; font-size: 12px; }
    .f-val { font-family: monospace; font-weight: 800; }
    .div-line { border-top: 1px solid #000; margin: 2px 0; }
    .footer-ts {
      text-align: center;
      font-family: monospace;
      font-size: 11px;
      font-weight: 900;
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="title">${data.dateStr?.includes("إلى") ? "تقرير مبيعات الفترة" : "تقرير مبيعات اليوم"}</div>
  <div style="text-align:center;font-size:11px;font-weight:800;margin-bottom:5px;">${data.shiftLabel}</div>

  <div class="box">
    ${row("يوم رقم", data.reportNumber, true)}
    ${row("التاريخ", data.dateStr)}
    <div class="div-line"></div>
    ${row("وقت فتح اليوم", data.openedAt || formatDateDMY(now))}
    ${row("قام بفتح الوردية", data.openedBy)}
    ${row("الرصيد عند فتح اليوم", data.openingBalance.toFixed(2))}
    <div class="div-line"></div>
    ${row("وقت غلق الوردية", data.closedAt || `${formatDateDMY(now)} ${formatTimeAMPM(now)}`)}
    ${row("قام بغلق اليوم", data.closedBy)}
    ${row("الرصيد عند غلق اليوم", data.closingBalance.toFixed(2))}
    <div class="div-line"></div>
    ${row("اجمالى الحركة", data.totalMovement.toFixed(2), true)}

    <div class="sec-head">تفاصيل ايرادات مبيعات اليوم</div>
    ${row("Cash", data.cash.toFixed(2))}
    ${row("Visa", data.visa.toFixed(2))}
    ${row("Insta Pay", data.instapay.toFixed(2))}
    ${row("Vodafone Cash", data.vodafoneCash.toFixed(2))}
    ${row("Staff", data.staff.toFixed(2))}
    ${row("ضيافة", data.hospitality.toFixed(2))}
    ${row("اجل", data.credit.toFixed(2))}
    ${row("Tips", data.tips.toFixed(2))}

    <div class="div-line"></div>
    ${row("اجمالى المصروفات", data.expenses.toFixed(2))}
    ${row("اجمالى مرتجع المبيعات", data.returnsTotal.toFixed(2))}
    ${row("عدد فواتير المرتجع", String(data.returnsCount))}
    <div class="div-line"></div>
    ${row("اجمالى المشتريات", data.purchasesTotal.toFixed(2))}
    ${row("اجمالى مرتجع المشتريات", data.purchaseReturnsTotal.toFixed(2))}
    ${row("اجمالى الكميات المحذوفة", String(data.deletedQty))}

    <div class="div-line"></div>
    ${row("قيمة مبيعات تيك اوي", data.takeawaySales.toFixed(2))}
    ${row("عدد الفواتير التيك اوي", String(data.takeawayCount))}
    <div class="div-line"></div>
    ${row("قيمة مبيعات الصالة", data.dineInSales.toFixed(2))}
    ${row("عدد الفواتير الصالة", String(data.dineInCount))}
    ${row("قيمة خدمة الصالة", data.dineInService.toFixed(2))}
    <div class="div-line"></div>
    ${row("مبيعات اصناف الدليفري", (data.deliveryFoodSales ?? Math.max(0, data.deliverySales - data.deliveryFees)).toFixed(2))}
    ${row("رسوم خدمة التوصيل", data.deliveryFees.toFixed(2))}
    ${row("اجمالى مبيعات الدليفري", data.deliverySales.toFixed(2))}
    ${row("عدد الفواتير الدليفري", String(data.deliveryCount))}

    ${(data.talabatGross || 0) > 0 ? `
    <div class="sec-head" style="background:#fed7aa !important; color:#7c2d12;">حسابات تطبيق طلبات (Talabat) — تسوية الشركة</div>
    ${row("اجمالى مبيعات طلبات", (data.talabatGross || 0).toFixed(2))}
    ${row(`عمولة طلبات (${data.talabatCommissionPercent || 25}%)`, `-${(data.talabatCommission || 0).toFixed(2)}`)}
    ${row("صافى المستحق من طلبات", (data.talabatNet || 0).toFixed(2), true)}
    ${row("عدد فواتير طلبات", String(data.talabatCount || 0))}
    <div style="font-size:9.5px;color:#78350f;padding:2px 6px;text-align:center;">* مبيعات طلبات تسوّى مع الشركة وخارج درج الكاشير</div>
    ` : ""}

    <div class="div-line"></div>
    ${row("صافى مبيعات الاصناف (اغذية ومشروبات)", (data.productSalesOnly ?? Math.max(0, data.grandTotalSales - data.deliveryFees)).toFixed(2), true)}
    ${row("اجمالى المبيعات والتحصيل (شامل التوصيل)", data.grandTotalSales.toFixed(2), true)}
    <div class="div-line"></div>
    ${row("اجمالى الفرق", data.difference.toFixed(2), true)}
  </div>

  <div class="footer-ts" dir="ltr">${formatTimeAMPM(now)} &nbsp; ${formatDateDMY(now)}</div>
</body>
</html>`;
}
