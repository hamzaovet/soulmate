"use client";

import React from "react";
import Link from "next/link";
import { Coffee, QrCode, Lock, Monitor, Sparkles, UtensilsCrossed, Bike } from "lucide-react";
import PwaInstallButton from "@/components/PwaInstallButton";
import { ThemeToggle } from "@/components/ThemeProviderAndToggle";

export default function SoulmateHomePage() {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 dark:bg-[#0c0908] text-slate-900 dark:text-amber-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors"
    >
      {/* Ambient Espresso & Gold Glows */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-emerald-600/10 dark:bg-emerald-600/15 blur-[140px]" />

      <div className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-slate-200 dark:border-amber-500/25 bg-white/95 dark:bg-[#15110f]/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-6 sm:space-y-8 text-center transition-colors">
        {/* Top Floating Utility Bar (Theme Switcher + Status) */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>المنظومة السحابية المستقلة</span>
          </div>

          <ThemeToggle compact />
        </div>

        {/* Brand Emblem */}
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center text-black shadow-xl shadow-amber-500/25">
            <Coffee className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-wide text-slate-900 dark:text-amber-100">
              Soulmate
            </h1>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300/80 tracking-widest uppercase mt-1">
              Dessert &amp; Coffee
            </p>
          </div>
        </div>

        {/* Main Action Cards (Hall + Delivery/Takeaway + Admin/POS) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
          {/* 1. Dine-In Hall QR */}
          <Link
            href="/order"
            className="group rounded-3xl border border-amber-400/50 dark:border-amber-500/35 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-gradient-to-br dark:from-amber-500/15 dark:to-black/50 hover:border-amber-500 dark:hover:border-amber-400 p-5 flex flex-col justify-between gap-4 transition shadow-md hover:shadow-lg dark:hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center group-hover:scale-110 transition">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-amber-100 flex items-center gap-1.5">
                <span>منيو الصالة (QR)</span>
                <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </h2>
              <p className="text-xs text-slate-600 dark:text-amber-100/65 mt-1 leading-relaxed">
                لعملاء الصالة فقط — اختر طاولتك، اطلب واكتب ملاحظتك للباريستا، واطلب الحساب في أي وقت.
              </p>
            </div>
          </Link>

          {/* 2. Delivery & Takeaway */}
          <Link
            href="/delivery"
            className="group rounded-3xl border border-emerald-400/50 dark:border-emerald-500/35 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-gradient-to-br dark:from-emerald-500/15 dark:to-black/50 hover:border-emerald-500 dark:hover:border-emerald-400 p-5 flex flex-col justify-between gap-4 transition shadow-md hover:shadow-lg dark:hover:shadow-emerald-500/10"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-110 transition">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-emerald-100 flex items-center gap-1.5">
                <span>دليفري وتيك أواي</span>
                <span className="text-sm">🛵</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-emerald-100/70 mt-1 leading-relaxed">
                اطلب قهوتك وحلوياتك توصيل لحد باب البيت أو تجهيز سريع للاستلام من الكافيه مع متابعة لحظية.
              </p>
            </div>
          </Link>

          {/* 3. Staff & Admin Portal */}
          <Link
            href="/login"
            className="group rounded-3xl border border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-100 dark:bg-gradient-to-br dark:from-white/[0.06] dark:to-black/50 hover:border-amber-400/60 p-5 flex flex-col justify-between gap-4 transition shadow-md hover:shadow-lg"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-amber-200 flex items-center justify-center group-hover:scale-110 transition">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">بوابة الكاشير والإدارة</h2>
              <p className="text-xs text-slate-600 dark:text-white/60 mt-1 leading-relaxed">
                نقطة البيع (POS)، نظام الورديتين، شاشة الباريستا (KDS)، والتقارير الحرارية 80mm.
              </p>
            </div>
          </Link>
        </div>

        {/* Windows Desktop Icon Install Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-amber-200/70">
            <Monitor className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>ثبّت أيقونة Soulmate على سطح مكتب الويندوز لفتح الكاشير بضغطة واحدة</span>
          </div>
          <PwaInstallButton variant="button" />
        </div>

        {/* Table Stickers Print Action Banner */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-amber-200/70">
            <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>استيكرات طاولات الصالة (طاولة 1 إلى 8) جاهزة للطباعة على ورق A4</span>
          </div>
          <a
            href="/table-stickers.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition shrink-0"
          >
            <span>🖨️ طباعة استيكرات الطاولات (8)</span>
          </a>
        </div>

        {/* Orca Tech Developer Signature */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/5 text-[11px] text-slate-500 dark:text-amber-200/55 flex flex-wrap items-center justify-center gap-2">
          <span>
            تطوير <strong className="text-amber-700 dark:text-amber-300">شركة أوركا للحلول البرمجية (Orca Tech) 🐬</strong>
          </span>
          <span>•</span>
          <a href="tel:01018671000" className="font-mono font-bold text-slate-700 dark:text-amber-200/80 hover:text-amber-600 dark:hover:text-amber-300">
            📞 01018671000
          </a>
        </div>
      </div>
    </div>
  );
}
