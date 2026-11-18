"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Printer,
  RefreshCw,
  FileText,
  Receipt,
  Calendar,
  Search,
  Lock,
  Sun,
  Moon,
  Layers,
} from "lucide-react";
import {
  printThermalHtml,
  generateSoulmateReceiptHtml,
  generateDailyItemsReportHtml,
  generateDailyFinancialSummaryHtml,
  type DailyReportPayload,
} from "@/lib/print";

interface DailyOrdersAndReportsModalProps {
  open: boolean;
  onClose: () => void;
  settings?: any;
  defaultTab?: "ORDERS" | "REPORTS";
  activeShiftCode?: "SHIFT_1" | "SHIFT_2";
}

function getTodayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatPaymentBadge(method?: string) {
  switch ((method || "CASH").toUpperCase()) {
    case "CARD":
    case "VISA":
      return "فيزا";
    case "INSTAPAY":
      return "إنستاباي";
    case "VODAFONE_CASH":
      return "محفظة كاش";
    case "STAFF":
      return "ستاف";
    case "HOSPITALITY":
      return "ضيافة";
    case "CREDIT":
      return "آجل";
    default:
      return "كاش";
  }
}

function formatOrderTypeAr(type?: string) {
  if (type === "DINE_IN") return "صالة";
  if (type === "DELIVERY") return "دليفري";
  if (type === "TALABAT") return "طلبات";
  return "تيك أواي";
}

export default function DailyOrdersAndReportsModal({
  open,
  onClose,
  settings,
  defaultTab = "ORDERS",
  activeShiftCode = "SHIFT_1",
}: DailyOrdersAndReportsModalProps) {
  const [activeTab, setActiveTab] = useState<"ORDERS" | "REPORTS">(defaultTab);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayYMD());
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "SHIFT_1" | "SHIFT_2">("ALL");
  const [orderTypeTab, setOrderTypeTab] = useState<"ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [report, setReport] = useState<DailyReportPayload | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [shiftNames, setShiftNames] = useState<{ SHIFT_1: string; SHIFT_2: string }>({
    SHIFT_1: "الوردية الأولى (الصباحية)",
    SHIFT_2: "الوردية الثانية (المسائية)",
  });

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reports/daily-summary?date=${encodeURIComponent(selectedDate)}&shiftCode=${shiftFilter}`
      );
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setOrders(data.orders || []);
        if (data.shiftNames) setShiftNames(data.shiftNames);
      }
    } catch (e) {
      console.error("Failed loading daily summary", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, shiftFilter]);

  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    fetchSummary();
  }, [open, fetchSummary]);

  if (!open) return null;

  const filteredOrders = orders.filter((o) => {
    if (orderTypeTab !== "ALL" && o.orderType !== orderTypeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hitBon = String(o.dailyTicketNo || "").includes(q);
      const hitNum = String(o.orderNumber || "").toLowerCase().includes(q);
      const hitTbl = String(o.tableNumber || "").toLowerCase().includes(q);
      return hitBon || hitNum || hitTbl;
    }
    return true;
  });

  const handlePrintItemsReport = () => {
    if (!report) return;
    printThermalHtml(generateDailyItemsReportHtml(report));
  };

  const handlePrintFinancialReport = () => {
    if (!report) return;
    printThermalHtml(generateDailyFinancialSummaryHtml(report));
  };

  const handlePrintBoth = () => {
    if (!report) return;
    printThermalHtml(generateDailyItemsReportHtml(report));
    setTimeout(() => {
      printThermalHtml(generateDailyFinancialSummaryHtml(report));
    }, 1200);
  };

  const isViewingOtherShift =
    shiftFilter !== "ALL" && shiftFilter !== activeShiftCode;

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
    >
      <div className="w-full max-w-6xl max-h-[92vh] rounded-3xl bg-[#14110f] border border-amber-500/25 text-amber-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-l from-amber-600/15 via-transparent to-transparent flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-black text-amber-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              أوردرات اليوم وتقارير الورديات — Soulmate
            </h2>
            <p className="text-xs text-amber-200/60 mt-0.5">
              تقرير مطابق 100% للطباعة الحرارية 80mm • كل وردية منفصلة للعرض والطباعة فقط بدون تعديل
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Main Tabs */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("ORDERS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                  activeTab === "ORDERS"
                    ? "bg-amber-500 text-black"
                    : "text-amber-100/70 hover:text-white"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                أوردرات اليوم ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("REPORTS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                  activeTab === "REPORTS"
                    ? "bg-amber-500 text-black"
                    : "text-amber-100/70 hover:text-white"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                تقرير مبيعات اليوم / الوردية
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-amber-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar: Date + Shift Selector */}
        <div className="px-5 py-3 border-b border-white/10 bg-black/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-amber-50 focus:outline-none"
              />
            </div>

            {/* Shift Tabs (Read-Only cross-shift viewing!) */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setShiftFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  shiftFilter === "ALL" ? "bg-amber-500/90 text-black" : "text-amber-100/70 hover:bg-white/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                إجمالي اليوم
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter("SHIFT_1")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  shiftFilter === "SHIFT_1" ? "bg-amber-400 text-black" : "text-amber-100/70 hover:bg-white/5"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                {shiftNames.SHIFT_1}
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter("SHIFT_2")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  shiftFilter === "SHIFT_2" ? "bg-indigo-400 text-black" : "text-amber-100/70 hover:bg-white/5"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {shiftNames.SHIFT_2}
              </button>
            </div>

            {isViewingOtherShift && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30">
                <Lock className="w-3 h-3" />
                وضع القراءة والطباعة فقط (وردية أخرى)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "ORDERS" ? (
            <div className="space-y-4">
              {/* Sub-tabs matching Photo 6 (تيك أواي | صالة | استلام الفرع) + search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { key: "ALL", label: "الكل" },
                    { key: "DINE_IN", label: "صالة" },
                    { key: "TAKEAWAY", label: "تيك أواي" },
                    { key: "DELIVERY", label: "دليفري / استلام" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setOrderTypeTab(t.key as any)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black border transition ${
                        orderTypeTab === t.key
                          ? "bg-amber-500/20 border-amber-400 text-amber-200"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-amber-300/60 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم البون أو الطاولة..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-amber-50 placeholder:text-white/30 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Orders Table (Photo 6 columns) */}
              <div className="rounded-2xl border border-white/10 overflow-x-auto bg-black/25">
                <table className="w-full text-right text-xs">
                  <thead className="bg-white/5 text-amber-200/80 border-b border-white/10">
                    <tr>
                      <th className="py-3 px-3 font-black">رقم البون</th>
                      <th className="py-3 px-3 font-black">التاريخ</th>
                      <th className="py-3 px-3 font-black">مصدر الفاتورة</th>
                      <th className="py-3 px-3 font-black">الطاولة</th>
                      <th className="py-3 px-3 font-black">الإجمالي</th>
                      <th className="py-3 px-3 font-black">المدفوع</th>
                      <th className="py-3 px-3 font-black">المتبقي</th>
                      <th className="py-3 px-3 font-black">حالة الفاتورة</th>
                      <th className="py-3 px-3 font-black">الوردية</th>
                      <th className="py-3 px-3 font-black">طرق الدفع</th>
                      <th className="py-3 px-3 font-black text-center">إعادة طباعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-10 text-center text-white/40 font-bold">
                          لا توجد فواتير مسجلة في هذا التاريخ / الوردية
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => {
                        const dt = new Date(o.createdAt);
                        const dateFormatted = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
                        const statusAr =
                          o.status === "CANCELLED"
                            ? "ملغاة"
                            : o.paymentStatus === "PAID"
                            ? "منتهي"
                            : "مفتوحة";
                        return (
                          <tr key={o.id} className="hover:bg-white/5 transition">
                            <td className="py-2.5 px-3 font-black text-amber-300 font-mono">
                              #{o.dailyTicketNo || o.orderNumber}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-white/75" dir="ltr">
                              {dateFormatted}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {formatOrderTypeAr(o.orderType)} — {o.cashierName || "كاشير"}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {o.tableNumber ? `طاولة ${o.tableNumber}` : "—"}
                            </td>
                            <td className="py-2.5 px-3 font-black font-mono">
                              {Number(o.finalAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-300 font-mono">
                              {Number(o.paidAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-amber-300 font-mono">
                              {Number(o.remainingAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  o.status === "CANCELLED"
                                    ? "bg-rose-500/20 text-rose-300"
                                    : o.paymentStatus === "PAID"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-amber-500/20 text-amber-300"
                                }`}
                              >
                                {statusAr}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-white/80 font-bold">
                              {o.shiftCode === "SHIFT_2" ? "وردية 2" : "وردية 1"}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {formatPaymentBadge(o.paymentMethod)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  printThermalHtml(generateSoulmateReceiptHtml(o, settings))
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black font-bold transition"
                                title="طباعة الريسيت الحراري 80mm"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                طباعة
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* REPORTS TAB (Exact Photos 9 & 10 Preview + Thermal Print Buttons) */
            <div className="space-y-5">
              {/* Action Print Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4">
                <div>
                  <h3 className="text-sm font-black text-amber-200">
                    {report?.shiftLabel || "تقرير مبيعات اليوم"} — {report?.dateStr}
                  </h3>
                  <p className="text-xs text-amber-100/70">
                    تقرير مطابق 100% للريسيت الحراري 80mm (الأصناف بالأقسام + الملخص المالي لليوم)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintItemsReport}
                    disabled={!report}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-50 text-xs font-black flex items-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4 text-amber-300" />
                    طباعة تقرير الأصناف بالأقسام
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintFinancialReport}
                    disabled={!report}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-50 text-xs font-black flex items-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4 text-emerald-300" />
                    طباعة الملخص المالي لليوم
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintBoth}
                    disabled={!report}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Printer className="w-4 h-4" />
                    طباعة التقريرين معاً
                  </button>
                </div>
              </div>

              {report && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left: Financial Summary Card (Photo 10) */}
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3">
                    <h4 className="text-sm font-black text-amber-300 border-b border-white/10 pb-2">
                      الملخص المالي لليوم / الوردية
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 flex justify-between">
                        <span className="text-white/60">Cash (كاش)</span>
                        <span className="font-black font-mono text-emerald-300">{report.cash.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 flex justify-between">
                        <span className="text-white/60">Visa (فيزا)</span>
                        <span className="font-black font-mono text-sky-300">{report.visa.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 flex justify-between">
                        <span className="text-white/60">Insta Pay</span>
                        <span className="font-black font-mono text-purple-300">{report.instapay.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 flex justify-between">
                        <span className="text-white/60">Vodafone Cash</span>
                        <span className="font-black font-mono text-rose-300">{report.vodafoneCash.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 flex justify-between">
                        <span className="text-white/60">Staff / ضيافة</span>
                        <span className="font-black font-mono">{(report.staff + report.hospitality).toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 flex justify-between">
                        <span className="text-white/60">المصروفات / المرتجعات</span>
                        <span className="font-black font-mono text-amber-300">
                          {report.expenses.toFixed(2)} / {report.returnsTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <div className="text-white/60">صالة ({report.dineInCount})</div>
                        <div className="font-black font-mono text-amber-200 mt-1">{report.dineInSales.toFixed(2)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                        <div className="text-white/60">تيك أواي ({report.takeawayCount})</div>
                        <div className="font-black font-mono text-sky-200 mt-1">{report.takeawaySales.toFixed(2)}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <div className="text-white/60">دليفري ({report.deliveryCount})</div>
                        <div className="font-black font-mono text-emerald-200 mt-1">{report.deliverySales.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-l from-amber-500/20 to-emerald-500/15 border border-amber-400/30 flex items-center justify-between">
                      <span className="font-black text-sm">إجمالي قيمة المبيعات</span>
                      <span className="font-black font-mono text-xl text-amber-300">
                        {report.grandTotalSales.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Right: Category-Grouped Items Breakdown (Photo 9) */}
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 space-y-3 max-h-[420px] overflow-y-auto">
                    <h4 className="text-sm font-black text-amber-300 border-b border-white/10 pb-2">
                      الأصناف المباعة مقسمة بالأقسام ({report.categories.length} قسم)
                    </h4>

                    {report.categories.length === 0 ? (
                      <div className="py-10 text-center text-white/40 text-xs font-bold">
                        لا توجد أصناف مباعة في هذه الفترة
                      </div>
                    ) : (
                      report.categories.map((cat) => (
                        <div key={cat.categoryName} className="rounded-xl border border-white/10 overflow-hidden">
                          <div className="bg-amber-500/15 px-3 py-1.5 flex items-center justify-between text-xs font-black text-amber-200">
                            <span>قسم {cat.categoryName}</span>
                            <span className="font-mono">
                              الكمية: {cat.totalQty} • {cat.totalAmount.toFixed(0)} ج.م
                            </span>
                          </div>
                          <div className="divide-y divide-white/5">
                            {cat.items.map((it) => (
                              <div
                                key={it.name}
                                className="px-3 py-1.5 flex items-center justify-between text-xs"
                              >
                                <span className="font-bold text-white/90">{it.name}</span>
                                <div className="flex items-center gap-4 font-mono">
                                  <span className="text-amber-300 font-bold">×{it.qty}</span>
                                  <span className="font-black min-w-[48px] text-left">
                                    {it.total.toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
