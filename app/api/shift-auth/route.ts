import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizeDigits(val: string) {
  return String(val || "")
    .trim()
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

async function getOrCreateSettings() {
  let setting = await prisma.systemSettings.findFirst();
  if (!setting) {
    setting = await prisma.systemSettings.create({
      data: {
        id: "default-settings",
        shift1Name: "الوردية الأولى (الصباحية)",
        shift1Pin: "1111",
        shift2Name: "الوردية الثانية (المسائية)",
        shift2Pin: "2222",
      },
    });
  }
  return setting;
}

// GET /api/shift-auth — returns shift names (never exposes PINs)
export async function GET() {
  try {
    const setting = await getOrCreateSettings();
    return NextResponse.json({
      success: true,
      shifts: [
        { code: "SHIFT_1", name: setting.shift1Name || "الوردية الأولى (الصباحية)" },
        { code: "SHIFT_2", name: setting.shift2Name || "الوردية الثانية (المسائية)" },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "فشل جلب الورديات" }, { status: 500 });
  }
}

// POST /api/shift-auth — verify PIN for SHIFT_1 or SHIFT_2
export async function POST(req: NextRequest) {
  try {
    const { shiftCode, pin } = await req.json();
    if (shiftCode !== "SHIFT_1" && shiftCode !== "SHIFT_2") {
      return NextResponse.json({ error: "يرجى اختيار وردية صحيحة" }, { status: 400 });
    }
    const cleanPin = normalizeDigits(pin);
    if (!cleanPin) {
      return NextResponse.json({ error: "يرجى إدخال رمز الـ PIN" }, { status: 400 });
    }

    const setting = await getOrCreateSettings();
    const expectedPin =
      shiftCode === "SHIFT_1"
        ? normalizeDigits(setting.shift1Pin || "1111")
        : normalizeDigits(setting.shift2Pin || "2222");

    if (cleanPin !== expectedPin) {
      return NextResponse.json(
        { success: false, error: "رمز الـ PIN غير صحيح لهذه الوردية! حاول مرة أخرى." },
        { status: 401 }
      );
    }

    const shiftName =
      shiftCode === "SHIFT_1"
        ? setting.shift1Name || "الوردية الأولى (الصباحية)"
        : setting.shift2Name || "الوردية الثانية (المسائية)";

    return NextResponse.json({
      success: true,
      shift: {
        code: shiftCode,
        name: shiftName,
        enteredAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "خطأ في التحقق من الرمز" }, { status: 500 });
  }
}

// PATCH /api/shift-auth — Admin updates shift names and PIN codes
export async function PATCH(req: NextRequest) {
  try {
    const { shift1Name, shift1Pin, shift2Name, shift2Pin } = await req.json();
    const p1 = shift1Pin !== undefined ? normalizeDigits(shift1Pin) : undefined;
    const p2 = shift2Pin !== undefined ? normalizeDigits(shift2Pin) : undefined;

    if (p1 !== undefined && p1.length < 3) {
      return NextResponse.json({ error: "كود الـ PIN للوردية الأولى يجب أن يكون 3 أرقام على الأقل" }, { status: 400 });
    }
    if (p2 !== undefined && p2.length < 3) {
      return NextResponse.json({ error: "كود الـ PIN للوردية الثانية يجب أن يكون 3 أرقام على الأقل" }, { status: 400 });
    }

    await getOrCreateSettings();
    const updated = await prisma.systemSettings.update({
      where: { id: "default-settings" },
      data: {
        ...(shift1Name !== undefined && String(shift1Name).trim() && { shift1Name: String(shift1Name).trim() }),
        ...(p1 !== undefined && { shift1Pin: p1 }),
        ...(shift2Name !== undefined && String(shift2Name).trim() && { shift2Name: String(shift2Name).trim() }),
        ...(p2 !== undefined && { shift2Pin: p2 }),
      },
    });

    return NextResponse.json({
      success: true,
      shift1Name: updated.shift1Name,
      shift2Name: updated.shift2Name,
      message: "تم حفظ أسماء وأكواد الورديتين بنجاح!",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "فشل تحديث إعدادات الورديات" }, { status: 500 });
  }
}
