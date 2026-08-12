import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SHIPPING_POLICY_KEY,
  DEFAULT_SHIPPING_POLICY,
  normalizePolicy,
} from "@/lib/shipping-policy";

// Cache for 5 minutes — this almost never changes and is fetched on every
// product page view.
export const revalidate = 300;

// GET /api/shipping-policy — public. Read by the product page's Shipping tab.
export async function GET() {
  const row = await db.siteConfig.findUnique({ where: { key: SHIPPING_POLICY_KEY } });
  let policy = DEFAULT_SHIPPING_POLICY;
  if (row) {
    try {
      policy = normalizePolicy(JSON.parse(row.value));
    } catch {
      policy = DEFAULT_SHIPPING_POLICY;
    }
  }
  return NextResponse.json({ policy });
}
