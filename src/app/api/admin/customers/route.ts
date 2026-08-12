import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/customers — all paying customers, real-world style.
// Merges registered accounts (User, role CUSTOMER) with guest checkouts
// (orders with no linked account), grouped by phone. Each customer is
// tagged `type: "registered" | "guest"` so the admin can tell them apart.
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [users, orders] = await Promise.all([
    db.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, phone: true, email: true, createdAt: true },
    }),
    // userId links an order to a registered account; phone/name/email are the
    // checkout details (may differ from the account, e.g. shipping to someone else).
    db.order.findMany({
      select: { userId: true, phone: true, name: true, email: true, total: true, createdAt: true },
    }),
  ]);

  type Customer = {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    type: "registered" | "guest";
    createdAt: Date;
    orderCount: number;
    totalSpent: number;
    lastOrderAt: Date | null;
  };

  // Identity resolution, registered-account first:
  //   1. order.userId points to a registered customer → that account owns it,
  //      regardless of the phone/name typed at checkout.
  //   2. otherwise, the checkout phone matches a registered customer → attribute there.
  //   3. otherwise it's a true guest → group by checkout phone.
  // (An order whose userId belongs to a NON-customer, e.g. an admin, is not in
  //  usersById, so it falls through to phone matching and shows as a guest.)
  const byKey = new Map<string, Customer>();
  const usersById = new Map(users.map((u) => [u.id, u]));
  const userIdByPhone = new Map(users.map((u) => [u.phone, u.id]));

  // Seed registered accounts, keyed by their user id.
  for (const u of users) {
    byKey.set(u.id, {
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      type: "registered",
      createdAt: u.createdAt,
      orderCount: 0,
      totalSpent: 0,
      lastOrderAt: null,
    });
  }

  for (const o of orders) {
    const key =
      o.userId && usersById.has(o.userId) ? o.userId :
      userIdByPhone.has(o.phone)          ? userIdByPhone.get(o.phone)! :
      `guest:${o.phone}`;

    let c = byKey.get(key);
    if (!c) {
      c = {
        id: key,
        name: o.name,
        phone: o.phone,
        email: o.email,
        type: "guest",
        createdAt: o.createdAt,
        orderCount: 0,
        totalSpent: 0,
        lastOrderAt: null,
      };
      byKey.set(key, c);
    }
    c.orderCount += 1;
    c.totalSpent += o.total;
    if (!c.lastOrderAt || o.createdAt > c.lastOrderAt) c.lastOrderAt = o.createdAt;
  }

  // Most recently active first; accounts that never ordered fall to the bottom by signup date.
  const customers = [...byKey.values()].sort((a, b) => {
    const at = a.lastOrderAt?.getTime() ?? 0;
    const bt = b.lastOrderAt?.getTime() ?? 0;
    if (at !== bt) return bt - at;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return NextResponse.json({
    customers,
    total: customers.length,
    registeredCount: customers.filter((c) => c.type === "registered").length,
    guestCount: customers.filter((c) => c.type === "guest").length,
  });
}
