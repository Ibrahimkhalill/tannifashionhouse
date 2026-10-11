import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientIp, limitOrNull, MINUTE } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Stops brute-forcing the list of valid coupon codes.
  const limited = await limitOrNull(`coupon:ip:${clientIp(req)}`, 15, 10 * MINUTE,
    "Too many coupon attempts — please try again in a few minutes.");
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const code    = (body?.code as string | undefined)?.trim().toUpperCase();
  const subtotal = Number(body?.subtotal ?? 0);

  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const offer = await db.offer.findUnique({ where: { code } });

  if (!offer || offer.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
  }
  if (new Date() > offer.expiryDate) {
    return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
  }
  if (offer.minOrder > 0 && subtotal < offer.minOrder) {
    return NextResponse.json({ error: `Minimum order ৳${offer.minOrder} required` }, { status: 400 });
  }
  if (offer.maxUses > 0 && offer.usedCount >= offer.maxUses) {
    return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
  }

  // Same cap as the order route: never more than 100% or more than the subtotal.
  const raw =
    offer.type === "PERCENT"
      ? Math.round(subtotal * (Math.min(offer.value, 100) / 100))
      : offer.value;
  const discount = Math.max(0, Math.min(raw, subtotal));

  return NextResponse.json({ discount, type: offer.type, value: offer.value });
}
