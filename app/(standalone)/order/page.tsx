"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Coffee,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Search,
  CheckCircle2,
  Copy,
  Check,
  MessageCircle,
  Banknote,
  Zap,
  Smartphone,
  Sparkles,
  X,
  StickyNote,
  UtensilsCrossed,
  ChevronUp,
  Bell,
  Home,
  Bike,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProviderAndToggle";
import { getCategoryLabel } from "@/lib/categories";
import {
  registerAudioUnlockListeners,
  playCustomerUpdateChime,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "@/lib/alertSound";

interface MenuItem {
  id: string;
  outletId: string;
  nameAr: string;
  nameEn?: string | null;
  category: string;
  price: number;
  description?: string | null;
  image?: string | null;
  itemType: string;
  isAvailable: boolean;
}

interface CartItem {
  menuItemId: string;
  nameAr: string;
  nameEn?: string | null;
  price: number;
  qty: number;
  category: string;
  itemType: string;
  notes?: string;
}

interface DiningTable {
  id: string;
  tableNumber: string;
  zone: string;
  capacity: number;
  status: string;
  activeOrderId?: string | null;
  activeOrder?: {
    id: string;
    orderNumber: string;
    dailyTicketNo?: number;
    status: string;
    paymentStatus?: string;
    billPaymentMethod?: string | null;
    subtotal: number;
    serviceCharge?: number;
    taxAmount?: number;
    discountAmount?: number;
    finalAmount: number;
    notes?: string | null;
    items: string | any[];
    createdAt: string;
  } | null;
}

function normalizeEgyptWa(phone?: string | null): string {
  const digits = String(phone || "01557879033").replace(/[^\d]/g, "");
  if (digits.startsWith("20") && digits.length >= 12) return digits;
  if (digits.startsWith("0")) return `2${digits}`;
  return `20${digits}`;
}

function SoulmateHallOrderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTableParam = searchParams.get("table") || "";
  const modeParam = searchParams.get("mode") || "";

  useEffect(() => {
    if (modeParam === "delivery" || modeParam === "takeaway") {
      router.replace("/delivery");
    }
  }, [modeParam, router]);

  useEffect(() => {
    return registerAudioUnlockListeners();
  }, []);

  const [tables, setTables] = useState<DiningTable[]>([]);
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>(initialTableParam);
  const [showTablePicker, setShowTablePicker] = useState<boolean>(!initialTableParam);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("soulmate_menu_cache_v1");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [settings, setSettings] = useState<any>(null);
  const [outletId, setOutletId] = useState<string>("");
  const [hallPasscodeInput, setHallPasscodeInput] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("soulmate_hall_passcode") || "";
    } catch {
      return "";
    }
  });
  const [showPasscodePrompt, setShowPasscodePrompt] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [baristaNote, setBaristaNote] = useState<string>("");
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [liveNotif, setLiveNotif] = useState<{ title: string; body: string } | null>(null);
  const prevOrderStateRef = useRef<{ id: string | null; status: string | null }>({
    id: null,
    status: null,
  });

  // Mobile cart/check sheet
  const [mobileSheetOpen, setMobileSheetOpen] = useState<boolean>(false);

  // Bill & Payment modal
  const [showBillModal, setShowBillModal] = useState<boolean>(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<"CASH" | "INSTAPAY" | "VODAFONE_CASH" | null>(null);
  const [requestingBill, setRequestingBill] = useState<boolean>(false);
  const [billRequestedResult, setBillRequestedResult] = useState<{
    method: "CASH" | "INSTAPAY" | "VODAFONE_CASH";
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg((prev) => (prev === msg ? null : prev)), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [menuRes, tablesRes, settingsRes] = await Promise.all([
        fetch("/api/menu?outletId=SOULMATE_CAFE"),
        fetch("/api/tables"),
        fetch("/api/settings"),
      ]);
      const [menuData, tablesData, settingsData] = await Promise.all([
        menuRes.json(),
        tablesRes.json(),
        settingsRes.json(),
      ]);

      if (menuData.success && Array.isArray(menuData.items)) {
        const available = menuData.items.filter((i: MenuItem) => i.isAvailable !== false);
        setMenuItems(available);
        try {
          localStorage.setItem("soulmate_menu_cache_v1", JSON.stringify(available));
        } catch {}
        if (available[0]?.outletId) setOutletId(available[0].outletId);
      }
      if (tablesData.success && Array.isArray(tablesData.tables)) {
        setTables(tablesData.tables);
        if (!outletId && tablesData.tables[0]?.outletId) {
          setOutletId(tablesData.tables[0].outletId);
        }
      }
      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings);
      }
    } catch (e) {
      console.error("Error loading Soulmate Hall Menu", e);
    } finally {
      setLoadingMenu(false);
    }
  }, [outletId]);

  useEffect(() => {
    loadData();
    // Fast 3-second real-time sync so hall customers receive instant barista/cashier updates!
    const interval = setInterval(() => {
      fetch("/api/tables", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.tables)) setTables(d.tables);
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Match selected table object
  const activeTableObj = useMemo(() => {
    if (!selectedTableNumber) return null;
    const clean = selectedTableNumber.trim().replace(/^[^\d]*/, "") || selectedTableNumber.trim();
    return (
      tables.find(
        (t) =>
          t.tableNumber === selectedTableNumber.trim() ||
          t.tableNumber === clean ||
          t.tableNumber.replace(/^[^\d]*/, "") === clean
      ) || null
    );
  }, [tables, selectedTableNumber]);

  const activeOrder = activeTableObj?.activeOrder || null;

  // Real-Time Customer Notifications when Barista / Cashier updates the table order!
  useEffect(() => {
    if (!selectedTableNumber) return;
    const prev = prevOrderStateRef.current;
    const currId = activeOrder?.id || null;
    const currStatus = activeOrder?.status || null;

    // Order status changed on the same active order
    if (prev.id && currId === prev.id && prev.status && currStatus && prev.status !== currStatus) {
      let title = `تحديث طلب طاولة ${selectedTableNumber} — Soulmate ☕`;
      let body = "";
      if (currStatus === "PREPARING") {
        body = "👨‍🍳 الباريستا استلم طلبك وبدأ تحضيره الآن!";
      } else if (currStatus === "READY_TO_SERVE") {
        body = "✅ طلبك جاهز الآن — يمكنك استلامه من الباريستا ☕";
      } else if (currStatus === "COMPLETED") {
        body = "🎉 تم إقفال الشيك بنجاح — شكراً لزيارتك Soulmate!";
      }
      if (body) {
        playCustomerUpdateChime();
        setLiveNotif({ title, body });
        showBrowserNotification(title, body);
      }
    } else if (prev.id && !currId) {
      // Table check was settled and closed by cashier!
      const title = `تم تسوية شيك طاولة ${selectedTableNumber} ✅`;
      const body = "شكراً لزيارتك Soulmate Dessert & Coffee — نتمنى لك يوماً سعيداً ☕💛";
      playCustomerUpdateChime();
      setLiveNotif({ title, body });
      showBrowserNotification(title, body);
    }

    prevOrderStateRef.current = { id: currId, status: currStatus };
  }, [activeOrder?.id, activeOrder?.status, selectedTableNumber]);

  const openCheckItems = useMemo(() => {
    if (!activeOrder?.items) return [];
    try {
      return typeof activeOrder.items === "string"
        ? JSON.parse(activeOrder.items)
        : activeOrder.items;
    } catch {
      return [];
    }
  }, [activeOrder]);

  // Categories list from live Soulmate menu
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of menuItems) {
      map.set(item.category, (map.get(item.category) || 0) + 1);
    }
    return Array.from(map.entries()).map(([code, count]) => ({
      code,
      label: getCategoryLabel(code) || code,
      count,
    }));
  }, [menuItems]);

  // Grouped / Filtered menu items
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (activeCategory !== "ALL" && item.category !== activeCategory) return false;
      if (q) {
        return (
          item.nameAr.toLowerCase().includes(q) ||
          (item.nameEn || "").toLowerCase().includes(q) ||
          (getCategoryLabel(item.category) || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups: { code: string; label: string; items: MenuItem[] }[] = [];
    const byCat = new Map<string, MenuItem[]>();
    for (const item of filteredItems) {
      if (!byCat.has(item.category)) byCat.set(item.category, []);
      byCat.get(item.category)!.push(item);
    }
    for (const [code, items] of byCat.entries()) {
      groups.push({ code, label: getCategoryLabel(code) || code, items });
    }
    return groups;
  }, [filteredItems]);

  // Cart actions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItemId === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          price: item.price,
          qty: 1,
          category: item.category,
          itemType: item.itemType,
        },
      ];
    });
  };

  const updateCartQty = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === menuItemId ? { ...c, qty: c.qty + delta } : c))
        .filter((c) => c.qty > 0)
    );
  };

  const updateCartItemNote = (menuItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menuItemId === menuItemId ? { ...c, notes: note } : c))
    );
  };

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const cartSubtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  // Submit new order or append to open table check
  const handleSendOrder = async () => {
    if (!selectedTableNumber) {
      setShowTablePicker(true);
      return;
    }
    if (cart.length === 0) return;

    // If Admin enabled Daily Hall Passcode anti-prank protection, verify guest has code
    if (settings?.hallPasscodeEnabled && !hallPasscodeInput.trim()) {
      setShowPasscodePrompt(true);
      return;
    }

    requestBrowserNotificationPermission();
    setSubmittingOrder(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outletId: outletId || undefined,
          orderType: "DINE_IN",
          tableId: activeTableObj?.id || undefined,
          tableNumber: selectedTableNumber,
          hallPasscode: hallPasscodeInput.trim() || undefined,
          items: cart.map((c) => ({
            menuItemId: c.menuItemId,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            price: c.price,
            qty: c.qty,
            category: c.category,
            itemType: c.itemType,
            notes: c.notes?.trim() || undefined,
          })),
          notes: baristaNote.trim() || undefined,
          paymentMethod: "CASH",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.requireHallPasscode) {
          setHallPasscodeInput("");
          setShowPasscodePrompt(true);
        }
        showToast(data.error || "حدث خطأ أثناء إرسال الطلب");
        return;
      }
      if (hallPasscodeInput.trim()) {
        try {
          sessionStorage.setItem("soulmate_hall_passcode", hallPasscodeInput.trim());
        } catch {}
      }
      setCart([]);
      setBaristaNote("");
      showToast(
        data.isAppended
          ? `تمت إضافة الأصناف لشيك طاولة ${selectedTableNumber} وجاري التحضير ☕✨`
          : `تم إرسال طلبك للباريستا (طاولة ${selectedTableNumber}) وجاري التحضير ☕✨`
      );
      // Refresh tables immediately to show updated Open Check
      const tRes = await fetch("/api/tables");
      const tData = await tRes.json();
      if (tData.success && Array.isArray(tData.tables)) setTables(tData.tables);
    } catch {
      showToast("تعذر الاتصال بالسيرفر، حاول مرة أخرى");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Request Bill with chosen payment method
  const handleChoosePaymentAndRequestBill = async (
    method: "CASH" | "INSTAPAY" | "VODAFONE_CASH"
  ) => {
    setSelectedPayMethod(method);
    if (!activeOrder) return;

    setRequestingBill(true);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: activeOrder.id,
          action: "REQUEST_BILL",
          billPaymentMethod: method,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBillRequestedResult({
          method,
          message:
            method === "CASH"
              ? "تم إخطار الباريستا والكاشير! جاري طباعة الريسيت وتوصيله لطاولتك الآن 🧾☕"
              : "تم تسجيل اختيار الدفع! قم بالتحويل الآن وأرسل صورة إيصال التحويل على واتساب الكافيه ✅",
        });
        // refresh table status
        fetch("/api/tables")
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.tables)) setTables(d.tables);
          })
          .catch(() => {});
      }
    } catch {
      showToast("تعذر إرسال طلب الحساب، حاول مرة أخرى");
    } finally {
      setRequestingBill(false);
    }
  };

  const handleCopy = (val: string, key: string) => {
    navigator.clipboard?.writeText(val).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const instapayValue = settings?.instapayAccount || "01271673463";
  const walletValue = settings?.vodafoneCashNumber || settings?.soulmatePhone || "01557879033";
  const receiptWhatsappRaw = settings?.whatsapp || settings?.soulmatePhone || "01557879033";
  const receiptWhatsappWa = normalizeEgyptWa(receiptWhatsappRaw);

  const buildWhatsappReceiptLink = (methodLabel: string) => {
    const totalVal = Number(activeOrder?.finalAmount || 0).toFixed(2);
    const ticketNo = activeOrder?.dailyTicketNo || activeOrder?.orderNumber || "";
    const msg = encodeURIComponent(
      `أهلاً Soulmate ☕\nمرفق صورة إيصال الدفع (${methodLabel})\n• الطاولة: ${selectedTableNumber}\n• رقم الشيك: #${ticketNo}\n• الإجمالي: ${totalVal} ج.م`
    );
    return `https://wa.me/${receiptWhatsappWa}?text=${msg}`;
  };

  // Cart & Check Panel JSX (reused for Desktop Sidebar & Mobile Sheet)
  const renderCartAndCheckContent = () => (
    <div className="flex flex-col h-full">
      {/* Section 1: New Order Cart */}
      <div className="p-4 border-b border-amber-500/15 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-amber-200 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            سلة الطلب الجديد ({cartCount})
          </h3>
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setCart([])}
              className="text-[11px] text-rose-300/80 hover:text-rose-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              إفراغ
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-5 text-center text-xs text-amber-100/45">
            اختر مشروباتك أو حلوياتك من المنيو لإضافتها للسلة ☕
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pl-1">
              {cart.map((item) => (
                <div
                  key={item.menuItemId}
                  className="rounded-2xl bg-white/[0.04] border border-white/10 p-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-amber-50 truncate">{item.nameAr}</div>
                      <div className="text-[11px] text-amber-300 font-mono font-bold">
                        {(item.price * item.qty).toFixed(0)} ج.م
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/30 flex items-center justify-center text-amber-100 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black font-mono">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-black transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={item.notes || ""}
                    onChange={(e) => updateCartItemNote(item.menuItemId, e.target.value)}
                    placeholder="ملاحظة خاصة بهذا الصنف (اختياري)..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-amber-50 placeholder:text-white/30 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              ))}
            </div>

            {/* General Barista Note */}
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-200/80 mb-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                ملاحظة للباريستا على الطلب (سكر خفيف، بدون ثلج...)
              </label>
              <textarea
                rows={2}
                value={baristaNote}
                onChange={(e) => setBaristaNote(e.target.value)}
                placeholder="اكتب أي تعليق أو طلب خاص للباريستا هنا..."
                className="w-full rounded-xl bg-black/50 border border-amber-500/25 px-3 py-2 text-xs text-amber-50 placeholder:text-white/30 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSendOrder}
              disabled={submittingOrder}
              className="w-full py-3 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-60 transition"
            >
              <Coffee className="w-4 h-4" />
              {submittingOrder
                ? "جاري إرسال الطلب..."
                : activeOrder
                ? `إضافة للشيك وإرسال للباريستا (${cartSubtotal.toFixed(0)} ج.م)`
                : `تأكيد الطلب وإرساله للباريستا (${cartSubtotal.toFixed(0)} ج.م)`}
            </button>
          </>
        )}
      </div>

      {/* Section 2: Open Check for This Table */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-black/20">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              الشيك المفتوح — طاولة {selectedTableNumber || "?"}
            </h3>
            {activeOrder && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                بون #{activeOrder.dailyTicketNo || activeOrder.orderNumber}
              </span>
            )}
          </div>

          {!activeOrder || openCheckItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center text-xs text-white/40">
              لا توجد طلبات مفتوحة على الطاولة بعد
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
                <span className="text-[11px] font-bold text-white/65">حالة التحضير الآن:</span>
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    activeOrder.status === "READY_TO_SERVE"
                      ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/40"
                      : activeOrder.status === "PREPARING"
                      ? "bg-sky-500/25 text-sky-300 border border-sky-400/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/35"
                  }`}
                >
                  {activeOrder.status === "READY_TO_SERVE"
                    ? "✅ جاهز — يمكنك استلامه من الباريستا"
                    : activeOrder.status === "PREPARING"
                    ? "☕ الباريستا يحضّر طلبك"
                    : "⏳ تم الإرسال — بانتظار الباريستا"}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pl-1">
                {openCheckItems.map((it: any, idx: number) => (
                  <div
                    key={`${it.menuItemId || idx}-${idx}`}
                    className="flex items-start justify-between gap-2 text-xs border-b border-white/5 pb-1.5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-amber-50">
                        {it.nameAr || it.nameEn}{" "}
                        <span className="text-amber-300 font-mono">×{it.qty || 1}</span>
                      </div>
                      {it.notes && (
                        <div className="text-[10px] text-amber-200/70">📝 {it.notes}</div>
                      )}
                    </div>
                    <span className="font-black font-mono text-amber-200 shrink-0">
                      {(Number(it.price || 0) * Number(it.qty || 1)).toFixed(0)} ج
                    </span>
                  </div>
                ))}
              </div>

              {activeOrder.notes && (
                <div className="text-[11px] text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5">
                  📝 ملاحظات الباريستا: {activeOrder.notes}
                </div>
              )}

              <div className="pt-2 border-t border-white/10 space-y-1 text-xs">
                {Number(activeOrder.serviceCharge || 0) > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>الخدمة</span>
                    <span className="font-mono">{Number(activeOrder.serviceCharge).toFixed(2)} ج.م</span>
                  </div>
                )}
                {Number(activeOrder.taxAmount || 0) > 0 && (
                  <div className="flex justify-between text-white/60">
                    <span>الضريبة</span>
                    <span className="font-mono">{Number(activeOrder.taxAmount).toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 text-sm font-black text-emerald-300">
                  <span>إجمالي الشيك</span>
                  <span className="font-mono text-base">
                    {Number(activeOrder.finalAmount || 0).toFixed(2)} ج.م
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeOrder && (
          <button
            type="button"
            onClick={() => {
              setBillRequestedResult(null);
              setSelectedPayMethod(null);
              setShowBillModal(true);
            }}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
          >
            <Receipt className="w-4 h-4" />
            طلب الحساب / الشيك ({Number(activeOrder.finalAmount || 0).toFixed(0)} ج.م)
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-[#0e0b0a] text-amber-50 flex flex-col">
      {/* Real-Time Customer Update Notification Banner */}
      {liveNotif && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[130] max-w-md w-[94%] rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 text-black px-4 py-3.5 shadow-2xl border-2 border-amber-200 flex items-start gap-3 animate-bounce">
          <Bell className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs sm:text-sm font-black">{liveNotif.title}</div>
            <div className="text-[11px] sm:text-xs font-bold mt-0.5">{liveNotif.body}</div>
          </div>
          <button
            type="button"
            onClick={() => setLiveNotif(null)}
            className="p-1 rounded-lg bg-black/15 hover:bg-black/25"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[120] max-w-md w-[92%] rounded-2xl bg-emerald-600 text-white px-4 py-3 shadow-2xl border border-emerald-300/40 flex items-center gap-2 text-xs md:text-sm font-black">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Minimalist Clean Header with Theme Toggle & Multi-Channel Navigation */}
      <header className="sticky top-0 z-30 bg-[#14100e]/95 backdrop-blur-md border-b border-amber-500/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 hover:scale-105 transition"
              title="العودة للشاشة الرئيسية"
            >
              <Coffee className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wide text-amber-100 leading-none">
                  Soulmate
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  صالة ☕
                </span>
              </div>
              <p className="text-[11px] text-amber-300/75 font-bold mt-0.5">
                Dessert &amp; Coffee • منيو الصالة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            {/* Quick Switch to Delivery / Takeaway */}
            <Link
              href="/delivery"
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-1.5 transition shrink-0"
              title="التبديل إلى خدمة دليفري وتيك أواي"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">دليفري وتيك أواي 🛵</span>
              <span className="sm:hidden">دليفري 🛵</span>
            </Link>

            {/* Home Navigation */}
            <Link
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-200 transition shrink-0"
              title="العودة للرئيسية"
            >
              <Home className="w-4 h-4" />
            </Link>

            {/* Theme Toggle (Day / Night Mode) */}
            <ThemeToggle compact />

            {/* Active Table Pill */}
            <button
              type="button"
              onClick={() => setShowTablePicker(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-black flex items-center gap-1.5 shrink-0 transition"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-300" />
              {selectedTableNumber ? `طاولة ${selectedTableNumber}` : "اختر طاولتك"}
            </button>

            {/* Search */}
            <div className="relative flex-1 sm:w-44">
              <Search className="w-4 h-4 text-amber-300/60 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث..."
                className="w-full pr-9 pl-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-amber-50 placeholder:text-white/35 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap border transition ${
              activeCategory === "ALL"
                ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                : "bg-white/5 text-amber-100/75 border-white/10 hover:bg-white/10"
            }`}
          >
            كل الأقسام ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.code}
              type="button"
              onClick={() => setActiveCategory(cat.code)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap border transition ${
                activeCategory === cat.code
                  ? "bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-white/5 text-amber-100/75 border-white/10 hover:bg-white/10"
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </header>

      {/* Main 2-Column Content: Menu + Side Cart/Check */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 pb-28 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Menu Grid (8 cols on desktop) */}
        <section className="lg:col-span-8 space-y-6">
          {loadingMenu && menuItems.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center text-xs font-bold text-amber-300/80 py-2">
                ☕ جاري تجهيز منيو Soulmate...
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-[#171210] p-3 flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-16 h-16 rounded-xl bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/10 rounded w-3/4" />
                      <div className="h-2.5 bg-white/5 rounded w-1/2" />
                      <div className="h-5 bg-amber-500/15 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : groupedByCategory.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] py-16 text-center text-white/40 font-bold">
              لا توجد أصناف مطابقة للبحث
            </div>
          ) : (
            groupedByCategory.map((group) => (
              <div key={group.code} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h2 className="text-base font-black text-amber-200">{group.label}</h2>
                  <span className="text-[11px] text-amber-200/50 font-bold">
                    ({group.items.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.map((item) => {
                    const inCart = cart.find((c) => c.menuItemId === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3 flex items-center gap-3 transition ${
                          inCart
                            ? "bg-amber-500/10 border-amber-400/45 shadow-lg shadow-amber-500/5"
                            : "bg-[#171210] border-white/10 hover:border-amber-500/30"
                        }`}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.nameAr}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10 bg-black/40"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400/70">
                            <Coffee className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-amber-50 leading-snug truncate">
                            {item.nameAr}
                          </h3>
                          {item.nameEn && (
                            <p className="text-[11px] text-amber-200/50 truncate" dir="ltr">
                              {item.nameEn}
                            </p>
                          )}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-black text-amber-300 font-mono">
                              {item.price} <span className="text-[10px] font-sans">ج.م</span>
                            </span>

                            {inCart ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-rose-500/30 flex items-center justify-center text-white transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-5 text-center text-xs font-black font-mono">
                                  {inCart.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-black transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black text-xs font-black flex items-center gap-1 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                إضافة
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* Desktop Sticky Side Panel: Cart + Open Check (4 cols) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-32 max-h-[calc(100vh-8.5rem)] overflow-y-auto rounded-3xl border border-amber-500/25 bg-[#161210] shadow-2xl">
          {renderCartAndCheckContent()}
        </aside>
      </main>

      {/* Orca Tech Developer Footer */}
      <footer className="pb-24 lg:pb-6 pt-3 text-center text-[11px] text-amber-200/45 border-t border-white/5">
        تطوير <strong className="text-amber-300/80">شركة أوركا للحلول البرمجية (Orca Tech) 🐬</strong> •{" "}
        <a href="tel:01018671000" className="font-mono hover:text-amber-300">
          01018671000
        </a>
      </footer>

      {/* Optional Hall Passcode Prompt Modal (Anti-Prank Protection when enabled by Admin) */}
      {showPasscodePrompt && (
        <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#161210] border border-amber-500/40 p-6 space-y-4 text-center shadow-2xl">
            <h3 className="text-base font-black text-amber-200">🛡️ كود تأكيد التواجد بالصالة</h3>
            <p className="text-xs text-amber-100/70">
              يرجى إدخال كود الصالة اليومي الموجود على الكاونتر أو لدى الباريستا لتأكيد الطلب
            </p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={hallPasscodeInput}
              onChange={(e) => setHallPasscodeInput(e.target.value)}
              placeholder="مثال: 2026"
              className="w-full text-center tracking-[0.4em] text-2xl font-black py-3 rounded-2xl bg-black/60 border border-amber-500/40 text-amber-200 focus:outline-none focus:border-amber-400 font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPasscodePrompt(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-white/80"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!hallPasscodeInput.trim()) return;
                  setShowPasscodePrompt(false);
                  handleSendOrder();
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-xs font-black"
              >
                تأكيد وإرسال الطلب ☕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Floating Bar (Cart + Open Check Quick Access) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-gradient-to-t from-[#0e0b0a] via-[#0e0b0a]/95 to-transparent">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 text-black font-black text-sm flex items-center justify-between shadow-2xl shadow-amber-500/25"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 ? `السلة (${cartCount})` : "السلة والشيك"}
            </span>
            <span className="flex items-center gap-1 font-mono">
              {cartCount > 0
                ? `${cartSubtotal.toFixed(0)} ج.م`
                : activeOrder
                ? `الشيك: ${Number(activeOrder.finalAmount || 0).toFixed(0)} ج.م`
                : "عرض"}
              <ChevronUp className="w-4 h-4" />
            </span>
          </button>

          {activeOrder && (
            <button
              type="button"
              onClick={() => {
                setBillRequestedResult(null);
                setSelectedPayMethod(null);
                setShowBillModal(true);
              }}
              className="py-3.5 px-4 rounded-2xl bg-emerald-500 text-black font-black text-xs flex items-center gap-1.5 shadow-xl shrink-0"
            >
              <Receipt className="w-4 h-4" />
              الحساب
            </button>
          )}
        </div>
      </div>

      {/* Mobile Expandable Cart & Check Drawer */}
      {mobileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end">
          <div className="w-full max-h-[88vh] rounded-t-3xl bg-[#161210] border-t border-amber-500/30 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-black text-amber-200">
                سلة الطلب والشيك — طاولة {selectedTableNumber || "?"}
              </span>
              <button
                type="button"
                onClick={() => setMobileSheetOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 text-amber-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">{renderCartAndCheckContent()}</div>
          </div>
        </div>
      )}

      {/* Modal 1: Table Selector (Shown immediately on QR scan if no ?table= param) */}
      {showTablePicker && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#161210] border border-amber-500/35 p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-black shadow-lg shadow-amber-500/20">
                <Coffee className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-amber-100">أهلاً بك في Soulmate ☕</h2>
              <p className="text-xs text-amber-200/70">
                من فضلك اختر رقم الطاولة الخاصة بك داخل الصالة لفتح المنيو
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {(tables.length > 0
                ? tables.map((t) => t.tableNumber)
                : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
              ).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setSelectedTableNumber(num);
                    setShowTablePicker(false);
                  }}
                  className={`py-3.5 rounded-2xl border-2 text-base font-black font-mono transition active:scale-95 ${
                    selectedTableNumber === num
                      ? "bg-amber-500 text-black border-amber-300 shadow-lg shadow-amber-500/20"
                      : "bg-white/5 border-white/10 text-amber-100 hover:border-amber-400/60 hover:bg-amber-500/15"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {selectedTableNumber && (
              <button
                type="button"
                onClick={() => setShowTablePicker(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 text-xs font-bold text-amber-200"
              >
                إغلاق
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: Request Check & Dynamic Payment Methods (Cash / InstaPay / Vodafone Cash + WhatsApp Receipt) */}
      {showBillModal && activeOrder && (
        <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#161210] border border-amber-500/35 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-amber-500/10">
              <div>
                <h2 className="text-base font-black text-amber-100 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  طلب الحساب — طاولة {selectedTableNumber}
                </h2>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  الإجمالي المطلوب:{" "}
                  <span className="font-black font-mono text-emerald-300 text-sm">
                    {Number(activeOrder.finalAmount || 0).toFixed(2)} ج.م
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="p-2 rounded-xl bg-white/10 text-amber-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-amber-100/80">
                اختر وسيلة الدفع المناسبة لك:
              </p>

              {/* 3 Payment Method Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={requestingBill}
                  onClick={() => handleChoosePaymentAndRequestBill("CASH")}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                    selectedPayMethod === "CASH"
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-emerald-400/50"
                  }`}
                >
                  <Banknote className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-black">كاش</span>
                </button>

                <button
                  type="button"
                  disabled={requestingBill}
                  onClick={() => handleChoosePaymentAndRequestBill("INSTAPAY")}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                    selectedPayMethod === "INSTAPAY"
                      ? "border-purple-400 bg-purple-500/20 text-purple-200"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-purple-400/50"
                  }`}
                >
                  <Zap className="w-6 h-6 text-purple-400" />
                  <span className="text-xs font-black">إنستاباي</span>
                </button>

                <button
                  type="button"
                  disabled={requestingBill}
                  onClick={() => handleChoosePaymentAndRequestBill("VODAFONE_CASH")}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition ${
                    selectedPayMethod === "VODAFONE_CASH"
                      ? "border-rose-400 bg-rose-500/20 text-rose-200"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-rose-400/50"
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-rose-400" />
                  <span className="text-xs font-black">محفظة كاش</span>
                </button>
              </div>

              {/* Dynamic Payment Details & WhatsApp Receipt Button */}
              {billRequestedResult && (
                <div className="rounded-2xl border border-white/15 bg-black/40 p-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{billRequestedResult.message}</span>
                  </div>

                  {billRequestedResult.method === "INSTAPAY" && (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-purple-500/15 border border-purple-400/30 p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-purple-200/75 font-bold">
                            حساب / رقم إنستاباي (InstaPay)
                          </div>
                          <div className="text-sm font-black font-mono text-purple-100 mt-0.5" dir="ltr">
                            {instapayValue}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(instapayValue, "instapay")}
                          className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-black text-xs font-black flex items-center gap-1"
                        >
                          {copiedKey === "instapay" ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              تم النسخ
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              نسخ
                            </>
                          )}
                        </button>
                      </div>

                      <a
                        href={buildWhatsappReceiptLink("إنستاباي InstaPay")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        إرسال صورة إيصال الدفع على واتساب ({receiptWhatsappRaw})
                      </a>
                    </div>
                  )}

                  {billRequestedResult.method === "VODAFONE_CASH" && (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-rose-500/15 border border-rose-400/30 p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-rose-200/75 font-bold">
                            رقم المحفظة (فودافون / كاش)
                          </div>
                          <div className="text-sm font-black font-mono text-rose-100 mt-0.5" dir="ltr">
                            {walletValue}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(walletValue, "wallet")}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-black flex items-center gap-1"
                        >
                          {copiedKey === "wallet" ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              تم النسخ
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              نسخ
                            </>
                          )}
                        </button>
                      </div>

                      <a
                        href={buildWhatsappReceiptLink("محفظة كاش")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        إرسال صورة إيصال الدفع على واتساب ({receiptWhatsappRaw})
                      </a>
                    </div>
                  )}

                  {billRequestedResult.method === "CASH" && (
                    <div className="text-xs text-amber-100/75 text-center pt-1">
                      شكراً لزيارتك Soulmate Dessert &amp; Coffee ☕💛
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SoulmateHallOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e0b0a] flex items-center justify-center text-amber-300 font-black">
          جاري تحميل منيو Soulmate ☕...
        </div>
      }
    >
      <SoulmateHallOrderInner />
    </Suspense>
  );
}
