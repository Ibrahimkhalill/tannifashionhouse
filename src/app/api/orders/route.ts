import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlaceOrderSchema, parseBody } from "@/lib/validators";
import { sendOrderEmails } from "@/lib/email";
import { DEFAULT_SHIPPING_POLICY, normalizePolicy, SHIPPING_POLICY_KEY } from "@/lib/shipping-policy";
import { findVariant, unitPrice } from "@/lib/variant-pricing";
import { clientIp, limitOrNull, HOUR } from "@/lib/rate-limit";

// The order ID doubles as the guest tracking token, so it must not be guessable.
// 8 chars from a 32-symbol alphabet (no 0/O/1/I) ≈ 10^12 combinations per year.
const ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateOrderId(): string {
  const year  = new Date().getFullYear();
  const bytes = randomBytes(8);
  const rand  = Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
  return `BD-${year}-${rand}`;
}

// Thrown inside the order transaction to abort it with a user-facing message.
class OrderError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}

// POST /api/orders — place an order
// Works for BOTH guests (no auth) and logged-in users
// Body: PlaceOrderSchema
export async function POST(req: Request) {
  const session = await auth(); // null for guests — that's fine

  // Staff accounts manage the store; they don't shop through it. Blocking this
  // keeps admin-placed orders from polluting customer data (an order stamped with
  // an admin's userId but a customer's checkout details creates identity mismatches).
  if (session?.user?.role && session.user.role !== "CUSTOMER") {
    return NextResponse.json(
      { error: "Admin accounts can't place customer orders. Please sign out or use a customer account." },
      { status: 403 },
    );
  }

  // Per-IP cap on top of the per-phone guard below — stops fake COD orders
  // spread across many phone numbers.
  const limited = await limitOrNull(`order:ip:${clientIp(req)}`, 10, HOUR,
    "Too many orders from this network — please try again later or contact us.");
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const parsed = parseBody(PlaceOrderSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { name, phone, email, address, district, division, notes,
          deliveryArea, payment, couponCode, items } = parsed.data;

  // ── 1. Resolve products and calculate price server-side ─────────────────
  // The client sends productId as either the slug (URL-friendly id used on the
  // storefront) or the cuid, so match on both.
  const productIds = items.map((i) => i.productId);
  const products   = await db.product.findMany({
    where: {
      OR: [{ id: { in: productIds } }, { slug: { in: productIds } }],
      status: "ACTIVE",
    },
    select: {
      id: true, slug: true, price: true, stock: true, name: true, images: true,
      variants: { select: { id: true, size: true, color: true, price: true, stock: true } },
    },
  });

  if (products.length === 0) {
    return NextResponse.json({ error: "No valid products in cart" }, { status: 400 });
  }

  // Map by BOTH id and slug so productMap.get(i.productId) works either way.
  const productMap = new Map<string, (typeof products)[number]>();
  for (const p of products) {
    productMap.set(p.id, p);
    productMap.set(p.slug, p);
  }

  // ── Fraud / spam guard (COD) — rate-limit by phone ────────────────────────
  // Runs before anything is reserved so a rejected request never uses up a
  // coupon or stock.
  const nowMs = Date.now();
  const dupe = await db.order.findFirst({
    where: { phone, createdAt: { gte: new Date(nowMs - 90_000) } }, // same number within 90s
    select: { id: true },
  });
  if (dupe) {
    return NextResponse.json(
      { error: "You just placed an order — please wait a minute before ordering again." },
      { status: 429 },
    );
  }
  const dayCount = await db.order.count({
    where: { phone, createdAt: { gte: new Date(nowMs - 24 * 60 * 60_000) } }, // last 24h
  });
  if (dayCount >= 8) {
    return NextResponse.json(
      { error: "Too many orders from this number today. Please contact us to continue." },
      { status: 429 },
    );
  }

  // ── 2. Build order items with price snapshots ─────────────────────────────
  // Price comes from the matching size/color variant (same unitPrice() the
  // storefront displays), falling back to the base price.
  const orderItems = items.flatMap((i) => {
    const p = productMap.get(i.productId);
    if (!p) return [];
    return [{
      productId: p.id,
      qty:       i.qty,
      size:      i.size  ?? null,
      color:     i.color ?? null,
      price:     unitPrice(p, i.size, i.color), // snapshot — never changes after order
    }];
  });

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.qty, 0);

  // ── 3. Validate coupon if provided ────────────────────────────────────────
  // usedCount is incremented inside the order transaction below, so it only
  // counts orders that were actually created.
  let discount = 0;
  let offer: { id: string; maxUses: number } | null = null;
  if (couponCode) {
    const found = await db.offer.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    if (!found || found.status !== "ACTIVE" || found.expiryDate < new Date()) {
      return NextResponse.json({ error: "Coupon is invalid or has expired" }, { status: 400 });
    }
    if (found.maxUses > 0 && found.usedCount >= found.maxUses) {
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });
    }
    if (subtotal >= found.minOrder) {
      const raw = found.type === "PERCENT"
        ? Math.round(subtotal * Math.min(found.value, 100) / 100)
        : found.value;
      discount = Math.min(raw, subtotal); // never discount below zero
      offer    = { id: found.id, maxUses: found.maxUses };
    }
  }

  let shippingPolicy = DEFAULT_SHIPPING_POLICY;
  const policyRow = await db.siteConfig.findUnique({ where: { key: SHIPPING_POLICY_KEY } });
  if (policyRow?.value) {
    try {
      shippingPolicy = normalizePolicy(JSON.parse(policyRow.value));
    } catch {
      shippingPolicy = DEFAULT_SHIPPING_POLICY;
    }
  }
  const shippingCost = shippingPolicy.deliveryAreas[deliveryArea]?.price ?? DEFAULT_SHIPPING_POLICY.deliveryAreas[deliveryArea].price;
  const total        = subtotal - discount + shippingCost;

  // ── 4. Generate unique order ID (retry on collision) ─────────────────────
  let orderId = generateOrderId();
  for (let i = 0; i < 5; i++) {
    const exists = await db.order.findUnique({ where: { id: orderId } });
    if (!exists) break;
    orderId = generateOrderId();
  }

  // ── 5. Reserve stock + coupon and create the order atomically ────────────
  // Each decrement is conditional (stock >= qty), so two buyers racing for the
  // last unit can't both succeed — the loser's transaction rolls back.
  const qtyByProduct = new Map<string, number>();
  for (const it of orderItems) qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) ?? 0) + it.qty);

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      for (const [productId, qty] of qtyByProduct) {
        const res = await tx.product.updateMany({
          where: { id: productId, stock: { gte: qty } },
          data:  { stock: { decrement: qty } },
        });
        if (res.count === 0) {
          const p = productMap.get(productId);
          throw new OrderError(`Sorry, "${p?.name ?? "an item"}" is out of stock or doesn't have enough quantity left.`);
        }
      }

      // The chosen size/color variant must have enough stock too — and it's kept
      // in sync because the admin form derives the product total from variants.
      for (const it of orderItems) {
        const p = productMap.get(it.productId);
        const variant = findVariant(p?.variants, it.size, it.color);
        if (!variant) continue;
        const res = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: it.qty } },
          data:  { stock: { decrement: it.qty } },
        });
        if (res.count === 0) {
          const opt = [it.size, it.color].filter(Boolean).join(" / ");
          throw new OrderError(`Sorry, "${p?.name ?? "an item"}"${opt ? ` (${opt})` : ""} is out of stock or doesn't have enough quantity left.`);
        }
      }

      if (offer) {
        const res = await tx.offer.updateMany({
          where: { id: offer.id, ...(offer.maxUses > 0 ? { usedCount: { lt: offer.maxUses } } : {}) },
          data:  { usedCount: { increment: 1 } },
        });
        if (res.count === 0) throw new OrderError("Coupon usage limit reached", 400);
      }

      return tx.order.create({
        data: {
          id:           orderId,
          userId:       session?.user?.id ?? null,
          name,
          phone,
          email:        email || null,
          address,
          district,
          division,
          notes:        notes ?? null,
          subtotal,
          shippingCost,
          discount,
          total,
          payment,
          items: { createMany: { data: orderItems } },
        },
        include: { items: true },
      });
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  // ── 6. Send confirmation email to customer + notify admin (never blocks the order) ──
  try {
    await sendOrderEmails({
      id: order.id, name, phone, email: email || null,
      address, district, division,
      notes: notes ?? null, payment,
      deliveryLabel: shippingPolicy.deliveryAreas[deliveryArea]?.label,
      items: orderItems.map((it) => ({
        name: productMap.get(it.productId)?.name ?? "Item",
        image: productMap.get(it.productId)?.images[0] ?? null,
        qty: it.qty, price: it.price, size: it.size, color: it.color,
      })),
      subtotal, shippingCost, discount, total,
    });
  } catch (e) {
    console.error("[order email] failed:", e);
  }

  // ── 7. Clear the user's server-side cart if logged in ────────────────────
  if (session?.user?.id) {
    db.cartItem.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
  }

  return NextResponse.json({ order }, { status: 201 });
}

// GET /api/orders — returns logged-in user's orders
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 10;
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: {
          include: { product: { select: { name: true, images: true, slug: true } } },
        },
      },
    }),
    db.order.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
}
