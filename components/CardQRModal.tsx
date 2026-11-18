"use client";

import React, { useEffect, useState } from "react";
import { X, Printer, QrCode, Coffee, Copy, Check } from "lucide-react";

interface CardQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotline?: string;
  abuAdelPhone?: string;
  soulmatePhone?: string;
  activeTable?: string;
}

export default function CardQRModal({
  isOpen,
  onClose,
  soulmatePhone = "01271673463",
}: CardQRModalProps) {
  const [origin, setOrigin] = useState("https://soulmate-navy.vercel.app");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const landingUrl = `${origin}/`;
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&color=1c130d&bgcolor=fffdf8&data=${encodeURIComponent(
    landingUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(landingUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintCard = () => {
    const win = window.open("", "_blank", "width=760,height=960");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Soulmate QR Card</title>
  <style>
    @page { size: A5 portrait; margin: 0; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #120d0a;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .card {
      width: 132mm;
      padding: 12mm 10mm;
      border-radius: 22px;
      background: linear-gradient(160deg, #1b1410 0%, #0e0a08 100%);
      border: 2.5px solid #d97706;
      color: #fef3c7;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .brand {
      font-family: "Brush Script MT", "Segoe Script", Georgia, serif;
      font-size: 52px;
      font-style: italic;
      font-weight: 900;
      color: #fbbf24;
      line-height: 1;
    }
    .sub {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #fde68a;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .headline {
      margin-top: 16px;
      font-size: 20px;
      font-weight: 900;
      color: #ffffff;
    }
    .desc {
      margin-top: 6px;
      font-size: 13px;
      color: #d6c5b3;
    }
    .qr-box {
      margin: 18px auto;
      width: 240px;
      height: 240px;
      padding: 12px;
      border-radius: 20px;
      background: #fffdf8;
      border: 3px solid #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box img { width: 100%; height: 100%; display: block; }
    .steps {
      margin-top: 14px;
      display: flex;
      justify-content: space-around;
      font-size: 12px;
      font-weight: 800;
      color: #fcd34d;
      border-top: 1px dashed rgba(251,191,36,0.35);
      padding-top: 12px;
    }
    .footer {
      margin-top: 12px;
      font-size: 11px;
      color: #a89582;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">Soulmate</div>
    <div class="sub">Dessert &amp; Coffee</div>
    <div class="headline">امسح الكود واختر خدمتك ☕✨</div>
    <div class="desc">منيو الصالة الذكية • دليفري وتيك أواي • تسجيل الإدارة</div>
    <div class="qr-box">
      <img src="${qrImgSrc}" alt="Soulmate QR" />
    </div>
    <div class="steps">
      <span>1️⃣ امسح الكود</span>
      <span>2️⃣ اختر (صالة / دليفري)</span>
      <span>3️⃣ اطلب واستمتع ☕</span>
    </div>
    <div class="footer">تطوير شركة أوركا للحلول البرمجية (Orca Tech) 🐬 • 📞 01018671000</div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 450); };</script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-3xl bg-[#15110f] border border-amber-500/35 text-amber-50 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-amber-100">كارت QR الموحد — Soulmate</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-black">
            <Coffee className="w-3.5 h-3.5" />
            <span>يفتح شاشة الاختيارات (صالة / دليفري / إدارة)</span>
          </div>

          <div className="mx-auto w-56 h-56 p-3 rounded-2xl bg-[#fffdf8] border-2 border-amber-400 shadow-xl">
            <img src={qrImgSrc} alt="Soulmate QR" className="w-full h-full object-contain" />
          </div>

          <div className="rounded-xl bg-black/50 border border-white/10 px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="font-mono text-amber-200 truncate" dir="ltr">
              {landingUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 font-bold flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "تم" : "نسخ"}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintCard}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            طباعة كارت QR بجودة عالية
          </button>
        </div>
      </div>
    </div>
  );
}
