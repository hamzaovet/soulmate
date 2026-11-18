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
  ArrowLeftRight,
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

function formatPaymentBadge(method?: string, isTalabat?: boolean) {
  if (isTalabat || (method || "").toUpperCase() === "TALABAT") {
    return "طلبات (شركة)";
  }
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

function formatOrderTypeAr(type?: string, isTalabat?: boolean) {
  if (isTalabat || type === "TALABAT") return "طلبات (Talabat)";
  if (type === "DINE_IN") return "صالة";
  if (type === "DELIVERY") return "دليفري";
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
  const [startDate, setStartDate] = useState<string>(getTodayYMD());
  const [endDate, setEndDate] = useState<string>(getTodayYMD());
  const [isRangeMode, setIsRangeMode] = useState<boolean>(false);

  const [shiftFilter, setShiftFilter] = useState<"ALL" | "SHIFT_1" | "SHIFT_2">("ALL");
  const [orderTypeTab, setOrderTypeTab] = useState<"ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "TALABAT">("ALL");
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
      const url = isRangeMode
        ? `/api/reports/daily-summary?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&shiftCode=${shiftFilter}`
        : `/api/reports/daily-summary?date=${encodeURIComponent(startDate)}&shiftCode=${shiftFilter}`;
      const res = await fetch(url);
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
  }, [startDate, endDate, isRangeMode, shiftFilter]);

  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    fetchSummary();
  }, [open, fetchSummary]);

  const setQuickPreset = (type: "TODAY" | "YESTERDAY" | "LAST_7" | "THIS_MONTH") => {
    const today = new Date();
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (type === "TODAY") {
      const t = fmt(today);
      setStartDate(t);
      setEndDate(t);
      setIsRangeMode(false);
    } else if (type === "YESTERDAY") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = fmt(y);
      setStartDate(yStr);
      setEndDate(yStr);
      setIsRangeMode(false);
    } else if (type === "LAST_7") {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      setStartDate(fmt(past));
      setEndDate(fmt(today));
      setIsRangeMode(true);
    } else if (type === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(fmt(firstDay));
      setEndDate(fmt(today));
      setIsRangeMode(true);
    }
  };

  if (!open) return null;

  const filteredOrders = orders.filter((o) => {
    const isTal = Boolean(
      o.isTalabat ||
      o.orderType === "TALABAT" ||
      (o.paymentMethod || "").toUpperCase() === "TALABAT"
    );
    if (orderTypeTab === "TALABAT") {
      if (!isTal) return false;
    } else if (orderTypeTab !== "ALL") {
      if (isTal || o.orderType !== orderTypeTab) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hitBon = String(o.dailyTicketNo || "").includes(q);
      const hitNum = String(o.orderNumber || "").toLowerCase().includes(q);
      const hitTbl = String(o.tableNumber || "").toLowerCase().includes(q);
      const hitNotes = String(o.notes || "").toLowerCase().includes(q);
      return hitBon || hitNum || hitTbl || hitNotes;
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
      className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div className="w-full max-w-6xl max-h-[94vh] rounded-3xl bg-white dark:bg-[#14110f] border border-slate-200 dark:border-amber-500/25 text-slate-900 dark:text-amber-50 shadow-2xl flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gradient-to-l dark:from-amber-600/15 dark:via-transparent dark:to-transparent flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-amber-50 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              أوردرات اليوم وتقارير الورديات — Soulmate
            </h2>
            <p className="text-xs text-slate-500 dark:text-amber-200/60 mt-0.5">
              تقرير مطابق 100% للطباعة الحرارية 80mm • يدعم استخراج التقارير ليوم محدد أو فترة مخصصة بين تاريخين
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Main Tabs (Orders vs Reports) */}
            <div className="flex bg-slate-200/80 dark:bg-black/40 p-1 rounded-xl border border-slate-300 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("ORDERS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                  activeTab === "ORDERS"
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-slate-700 dark:text-amber-100/70 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                أوردرات الفترة ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("REPORTS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                  activeTab === "REPORTS"
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-slate-700 dark:text-amber-100/70 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                تقرير المبيعات والورديات
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/15 text-slate-700 dark:text-amber-100 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar: Single Day vs Date Range + Quick Presets + Shifts */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-black/35 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Toggle (Single Day vs Range) */}
            <div className="flex bg-white dark:bg-white/5 p-0.5 rounded-xl border border-slate-300 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsRangeMode(false);
                  setEndDate(startDate);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition ${
                  !isRangeMode
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-slate-600 dark:text-amber-100/70 hover:text-slate-900"
                }`}
              >
                يوم واحد 📅
              </button>
              <button
                type="button"
                onClick={() => setIsRangeMode(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition ${
                  isRangeMode
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-slate-600 dark:text-amber-100/70 hover:text-slate-900"
                }`}
              >
                بين تاريخين 🗓️
              </button>
            </div>

            {/* Date Pickers */}
            {!isRangeMode ? (
              <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-slate-500 dark:text-amber-200/60">التاريخ:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setEndDate(e.target.value);
                  }}
                  className="bg-transparent text-xs font-black text-slate-900 dark:text-amber-50 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl p-1 shadow-sm">
                <div className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-amber-200/60">من:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-900 dark:text-amber-50 focus:outline-none"
                  />
                </div>
                <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400 dark:text-white/30" />
                <div className="flex items-center gap-1.5 px-2 py-0.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-amber-200/60">إلى:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-900 dark:text-amber-50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQuickPreset("TODAY")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-amber-200 transition"
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("YESTERDAY")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-amber-200 transition"
              >
                أمس
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("LAST_7")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-amber-200 transition"
              >
                آخر 7 أيام
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset("THIS_MONTH")}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-amber-200 transition"
              >
                هذا الشهر
              </button>
            </div>

            {/* Shift Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-slate-300 dark:border-white/10 shadow-sm">
              <button
                type="button"
                onClick={() => setShiftFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                  shiftFilter === "ALL"
                    ? "bg-amber-500 text-black shadow-sm"
                    : "text-slate-600 dark:text-amber-100/70 hover:bg-slate-200 dark:hover:bg-white/5"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {isRangeMode ? "كل الورديات" : "إجمالي اليوم"}
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter("SHIFT_1")}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                  shiftFilter === "SHIFT_1"
                    ? "bg-amber-400 text-black shadow-sm"
                    : "text-slate-600 dark:text-amber-100/70 hover:bg-slate-200 dark:hover:bg-white/5"
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-700 dark:text-black" />
                {shiftNames.SHIFT_1}
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter("SHIFT_2")}
                className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                  shiftFilter === "SHIFT_2"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-amber-100/70 hover:bg-slate-200 dark:hover:bg-white/5"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                {shiftNames.SHIFT_2}
              </button>
            </div>

            {isViewingOtherShift && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                <Lock className="w-3 h-3" />
                وضع القراءة والطباعة فقط
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-xs font-black text-slate-800 dark:text-amber-100 flex items-center gap-1.5 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-600 dark:text-amber-400" : ""}`} />
            تحديث
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "ORDERS" ? (
            <div className="space-y-4">
              {/* Sub-tabs (All | Dine-In | Takeaway | Delivery) + Search */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { key: "ALL", label: "الكل" },
                    { key: "DINE_IN", label: "صالة" },
                    { key: "TAKEAWAY", label: "تيك أواي" },
                    { key: "DELIVERY", label: "دليفري / استلام" },
                    { key: "TALABAT", label: "طلبات 🟠" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setOrderTypeTab(t.key as any)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black border transition ${
                        orderTypeTab === t.key
                          ? t.key === "TALABAT"
                            ? "bg-orange-500/20 border-orange-500 text-orange-950 dark:text-orange-200 shadow-sm"
                            : "bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm"
                          : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 dark:text-amber-300/60 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم البون أو الطاولة..."
                    className="w-full pr-9 pl-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-amber-50 placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto bg-white dark:bg-black/25 shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-amber-200/80 border-b border-slate-200 dark:border-white/10">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-white/40 font-bold">
                          لا توجد فواتير مسجلة في هذه الفترة / الوردية
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
                          <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition text-slate-800 dark:text-white/90">
                            <td className="py-2.5 px-3 font-black text-amber-700 dark:text-amber-300 font-mono">
                              #{o.dailyTicketNo || o.orderNumber}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-white/75" dir="ltr">
                              {dateFormatted}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {o.isTalabat || o.orderType === "TALABAT" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-500/20 text-orange-900 dark:text-orange-200 border border-orange-500/30">
                                  طلبات 🟠
                                </span>
                              ) : (
                                `${formatOrderTypeAr(o.orderType)} — ${o.cashierName || "كاشير"}`
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {o.tableNumber ? `طاولة ${o.tableNumber}` : o.isTalabat ? "طلب عبر التطبيق" : "—"}
                            </td>
                            <td className="py-2.5 px-3 font-black font-mono">
                              {Number(o.finalAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-300 font-mono">
                              {Number(o.paidAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-amber-700 dark:text-amber-300 font-mono">
                              {Number(o.remainingAmount || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                  o.status === "CANCELLED"
                                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                                    : o.paymentStatus === "PAID"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {statusAr}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-white/80 font-bold">
                              {o.shiftCode === "SHIFT_2" ? "وردية 2" : "وردية 1"}
                            </td>
                            <td className="py-2.5 px-3 font-bold">
                              {o.isTalabat || (o.paymentMethod || "").toUpperCase() === "TALABAT" ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-orange-500/20 text-orange-900 dark:text-orange-200 border border-orange-500/30">
                                  طلبات (تسوية شركة)
                                </span>
                              ) : (
                                formatPaymentBadge(o.paymentMethod)
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  printThermalHtml(generateSoulmateReceiptHtml(o, settings))
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-800 dark:text-amber-200 hover:text-black font-black transition border border-amber-500/30"
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
            /* REPORTS TAB (Full Financial Summary + Category-Grouped Items) */
            <div className="space-y-4">
              {/* Action Print Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4">
                <div>
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-200">
                    {report?.shiftLabel || "تقرير مبيعات الفترة"} — {report?.dateStr}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-amber-100/70 mt-0.5">
                    تقرير مطابق 100% للريسيت الحراري 80mm (الأصناف بالأقسام + الملخص المالي الكامل)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintItemsReport}
                    disabled={!report}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-300 dark:border-transparent text-slate-800 dark:text-amber-50 text-xs font-black flex items-center gap-2 transition shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                    طباعة تقرير الأصناف بالأقسام
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintFinancialReport}
                    disabled={!report}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-300 dark:border-transparent text-slate-800 dark:text-amber-50 text-xs font-black flex items-center gap-2 transition shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                    طباعة الملخص المالي
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Financial Summary Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/35 p-4 space-y-3 shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 dark:text-amber-300 border-b border-slate-200 dark:border-white/10 pb-2">
                      الملخص المالي للفترة / الوردية
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex justify-between shadow-xs">
                        <span className="text-slate-500 dark:text-white/60 font-bold">Cash (كاش)</span>
                        <span className="font-black font-mono text-emerald-600 dark:text-emerald-300">{report.cash.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex justify-between shadow-xs">
                        <span className="text-slate-500 dark:text-white/60 font-bold">Visa (فيزا)</span>
                        <span className="font-black font-mono text-sky-600 dark:text-sky-300">{report.visa.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex justify-between shadow-xs">
                        <span className="text-slate-500 dark:text-white/60 font-bold">Insta Pay</span>
                        <span className="font-black font-mono text-purple-600 dark:text-purple-300">{report.instapay.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex justify-between shadow-xs">
                        <span className="text-slate-500 dark:text-white/60 font-bold">Vodafone Cash</span>
                        <span className="font-black font-mono text-rose-600 dark:text-rose-300">{report.vodafoneCash.toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex justify-between shadow-xs">
                        <span className="text-slate-500 dark:text-white/60 font-bold">Staff / ضيافة</span>
                        <span className="font-black font-mono text-slate-800 dark:text-white">{(report.staff + report.hospitality).toFixed(2)}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent flex justify-between shadow-xs">
                        <span className="text-slate-500 dark:text-white/60 font-bold">المصروفات / المرتجعات</span>
                        <span className="font-black font-mono text-amber-700 dark:text-amber-300">
                          {report.expenses.toFixed(2)} / {report.returnsTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* 4 Sales Channels */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <div className="text-slate-600 dark:text-white/60 font-bold">صالة ({report.dineInCount})</div>
                        <div className="font-black font-mono text-amber-800 dark:text-amber-200 mt-1">{report.dineInSales.toFixed(2)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                        <div className="text-slate-600 dark:text-white/60 font-bold">تيك أواي ({report.takeawayCount})</div>
                        <div className="font-black font-mono text-sky-800 dark:text-sky-200 mt-1">{report.takeawaySales.toFixed(2)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <div className="text-slate-600 dark:text-white/60 font-bold">دليفري ({report.deliveryCount})</div>
                        <div className="font-black font-mono text-emerald-800 dark:text-emerald-200 mt-1">{report.deliverySales.toFixed(2)}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                        <div className="text-slate-600 dark:text-white/60 font-bold">طلبات 🟠 ({report.talabatCount || 0})</div>
                        <div className="font-black font-mono text-orange-800 dark:text-orange-300 mt-1">{(report.talabatGross || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Dedicated Talabat Settlement Card (Gross, Commission %, Net Receivable) */}
                    {((report.talabatGross || 0) > 0 || (report.talabatCount || 0) > 0) && (
                      <div className="rounded-xl border border-orange-500/35 bg-orange-500/10 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-orange-950 dark:text-orange-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                            حسابات تطبيق طلبات (Talabat) 🟠 — تسوية الشركة (خارج الدرج)
                          </span>
                          <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300">
                            {report.talabatCount || 0} أوردر
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 rounded-lg bg-white/70 dark:bg-black/40 border border-orange-500/20">
                            <div className="text-[10px] text-slate-500 dark:text-white/60 font-bold">إجمالي مبيعات طلبات</div>
                            <div className="font-black font-mono text-orange-700 dark:text-orange-300 mt-0.5">
                              {(report.talabatGross || 0).toFixed(2)} ج.م
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-white/70 dark:bg-black/40 border border-orange-500/20">
                            <div className="text-[10px] text-slate-500 dark:text-white/60 font-bold">
                              عمولة طلبات ({report.talabatCommissionPercent || 25}%)
                            </div>
                            <div className="font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                              -{(report.talabatCommission || 0).toFixed(2)} ج.م
                            </div>
                          </div>
                          <div className="p-2 rounded-lg bg-white/70 dark:bg-black/40 border border-orange-500/20">
                            <div className="text-[10px] text-slate-500 dark:text-white/60 font-bold">صافي المستحق من طلبات</div>
                            <div className="font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {(report.talabatNet || 0).toFixed(2)} ج.م
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-orange-900/80 dark:text-orange-200/80 font-bold text-center">
                          💡 لا تُحسب ضمن نقدية الدرج الفعلي للكاشير منعاً لأي عجز وهمي، وتُسوّى دورياً مع شركة طلبات.
                        </p>
                      </div>
                    )}

                    {/* Food & Beverage Sales vs Delivery Fees Separation */}
                    <div className="rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-3 space-y-1.5 text-xs shadow-xs">
                      <div className="flex justify-between items-center text-slate-700 dark:text-white/80">
                        <span className="font-bold">صافي مبيعات الأصناف (الأغذية والمشروبات):</span>
                        <span className="font-black font-mono text-slate-900 dark:text-white">
                          {(report.productSalesOnly ?? Math.max(0, report.grandTotalSales - report.deliveryFees)).toFixed(2)} ج.م
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700 dark:text-white/80">
                        <span className="font-bold">رسوم وخدمة التوصيل (Delivery Fees):</span>
                        <span className="font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {report.deliveryFees.toFixed(2)} ج.م
                        </span>
                      </div>
                      <div className="border-t border-dashed border-slate-200 dark:border-white/10 pt-1.5 flex justify-between items-center">
                        <span className="font-black text-sm text-slate-900 dark:text-white">إجمالي المبيعات والتحصيل (شامل التوصيل):</span>
                        <span className="font-black font-mono text-xl text-amber-700 dark:text-amber-300">
                          {report.grandTotalSales.toFixed(2)} ج.م
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Category-Grouped Items Breakdown */}
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/35 p-4 space-y-3 max-h-[460px] overflow-y-auto shadow-sm">
                    <h4 className="text-sm font-black text-slate-900 dark:text-amber-300 border-b border-slate-200 dark:border-white/10 pb-2">
                      الأصناف المباعة مقسمة بالأقسام ({report.categories.length} قسم)
                    </h4>

                    {report.categories.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 dark:text-white/40 text-xs font-bold">
                        لا توجد أصناف مباعة في هذه الفترة
                      </div>
                    ) : (
                      report.categories.map((cat) => (
                        <div key={cat.categoryName} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent overflow-hidden shadow-xs">
                          <div className="bg-amber-500/15 px-3 py-1.5 flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-200 border-b border-amber-500/20">
                            <span>قسم {cat.categoryName}</span>
                            <span className="font-mono">
                              الكمية: {cat.totalQty} • {cat.totalAmount.toFixed(0)} ج.م
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-white/5">
                            {cat.items.map((it) => (
                              <div
                                key={it.name}
                                className="px-3 py-1.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                              >
                                <span className="font-bold text-slate-800 dark:text-white/90">{it.name}</span>
                                <div className="flex items-center gap-4 font-mono">
                                  <span className="text-amber-700 dark:text-amber-300 font-bold">×{it.qty}</span>
                                  <span className="font-black min-w-[48px] text-left text-slate-900 dark:text-white">
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
