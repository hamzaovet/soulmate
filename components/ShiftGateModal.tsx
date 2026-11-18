"use client";

import React, { useEffect, useState } from "react";
import { Lock, Sun, Moon, ArrowRightLeft, Delete, CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ActiveShiftInfo {
  shiftCode: "SHIFT_1" | "SHIFT_2";
  shiftName: string;
  activatedAt: string;
}

const STORAGE_KEY = "soulmate_active_shift";

export function getStoredShift(): ActiveShiftInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.shiftCode === "SHIFT_1" || parsed?.shiftCode === "SHIFT_2") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredShift(info: ActiveShiftInfo) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    window.dispatchEvent(new CustomEvent("soulmate-shift-changed", { detail: info }));
  } catch {
    // ignore storage errors
  }
}

export function clearStoredShift() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface ShiftGateModalProps {
  open: boolean;
  canClose?: boolean;
  currentShiftCode?: "SHIFT_1" | "SHIFT_2" | null;
  onClose?: () => void;
  onShiftSelected: (shift: ActiveShiftInfo) => void;
}

export default function ShiftGateModal({
  open,
  canClose = false,
  currentShiftCode = null,
  onClose,
  onShiftSelected,
}: ShiftGateModalProps) {
  const [shiftNames, setShiftNames] = useState<{ SHIFT_1: string; SHIFT_2: string }>({
    SHIFT_1: "الوردية الأولى (الصباحية)",
    SHIFT_2: "الوردية الثانية (المسائية)",
  });
  const [selected, setSelected] = useState<"SHIFT_1" | "SHIFT_2">(
    currentShiftCode === "SHIFT_1" ? "SHIFT_2" : "SHIFT_1"
  );
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setError(null);
    setSelected(currentShiftCode === "SHIFT_1" ? "SHIFT_2" : "SHIFT_1");
    fetch("/api/shift-auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.shifts) {
          const s1 = d.shifts.find((s: any) => s.code === "SHIFT_1")?.name;
          const s2 = d.shifts.find((s: any) => s.code === "SHIFT_2")?.name;
          setShiftNames({
            SHIFT_1: s1 || "الوردية الأولى (الصباحية)",
            SHIFT_2: s2 || "الوردية الثانية (المسائية)",
          });
        }
      })
      .catch(() => {});
  }, [open, currentShiftCode]);

  if (!open) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 8) return;
    setError(null);
    setPin((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError("يرجى إدخال الرقم السري (PIN) الخاص بالوردية");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shift-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftCode: selected, pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "الرقم السري (PIN) غير صحيح");
        setPin("");
        return;
      }
      const activeShift: ActiveShiftInfo = {
        shiftCode: data.shiftCode,
        shiftName: data.shiftName,
        activatedAt: new Date().toISOString(),
      };
      setStoredShift(activeShift);
      onShiftSelected(activeShift);
    } catch {
      setError("تعذر الاتصال بالسيرفر، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#14110f] text-amber-50 shadow-2xl overflow-hidden">
        {/* Top Accent */}
        <div className="bg-gradient-to-l from-amber-600/20 via-amber-500/10 to-transparent px-6 py-5 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              {canClose ? <ArrowRightLeft className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-50">
                {canClose ? "تحويل الوردية — Soulmate" : "اختيار الوردية — Soulmate"}
              </h2>
              <p className="text-xs text-amber-200/70">
                اختر الوردية وأدخل الرقم السري (PIN) لبدء العمل
              </p>
            </div>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-200/80 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-5">
          {/* Shift Cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelected("SHIFT_1");
                setPin("");
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selected === "SHIFT_1"
                  ? "border-amber-400 bg-amber-500/15 text-amber-200 shadow-lg shadow-amber-500/10"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <Sun className={`w-6 h-6 ${selected === "SHIFT_1" ? "text-amber-300" : "text-white/40"}`} />
              <span className="text-sm font-black text-center leading-snug">{shiftNames.SHIFT_1}</span>
              {currentShiftCode === "SHIFT_1" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  الحالية
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelected("SHIFT_2");
                setPin("");
                setError(null);
              }}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                selected === "SHIFT_2"
                  ? "border-indigo-400 bg-indigo-500/15 text-indigo-200 shadow-lg shadow-indigo-500/10"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <Moon className={`w-6 h-6 ${selected === "SHIFT_2" ? "text-indigo-300" : "text-white/40"}`} />
              <span className="text-sm font-black text-center leading-snug">{shiftNames.SHIFT_2}</span>
              {currentShiftCode === "SHIFT_2" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  الحالية
                </span>
              )}
            </button>
          </div>

          {/* PIN Display + Keyboard input */}
          <div>
            <label className="block text-xs font-bold text-amber-200/80 mb-1.5">
              الرقم السري (PIN) للوردية المختارة
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setError(null);
                setPin(e.target.value);
              }}
              placeholder="••••"
              className="w-full text-center tracking-[0.6em] text-2xl font-black py-3 rounded-2xl bg-black/50 border border-amber-500/30 text-amber-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Touch Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(d)}
                className="py-3 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-lg font-black text-amber-50 active:scale-95 transition"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPin("");
                setError(null);
              }}
              className="py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-bold text-rose-300 active:scale-95 transition"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="py-3 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 text-lg font-black text-amber-50 active:scale-95 transition"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-amber-200 active:scale-95 transition"
              title="حذف رقم"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2.5 text-xs font-bold text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-60 transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{loading ? "جاري التحقق..." : "دخول وتفعيل الوردية"}</span>
          </button>

          <p className="text-[11px] text-center text-amber-200/50">
            يمكن لكل وردية الاطلاع على تقرير الوردية الأخرى وطباعته فقط بدون تعديل
          </p>
        </form>
      </div>
    </div>
  );
}
