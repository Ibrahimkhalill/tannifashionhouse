import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import {
  SHIPPING_POLICY_KEY,
  DEFAULT_SHIPPING_POLICY,
  normalizePolicy,
} from "@/lib/shipping-policy";

async function readPolicy() {
  const row = await db.siteConfig.findUnique({ where: { key: SHIPPING_POLICY_KEY } });
  if (!row) return DEFAULT_SHIPPING_POLICY;
  try {
    return normalizePolicy(JSON.parse(row.value));
  } catch {
    return DEFAULT_SHIPPING_POLICY;
  }
}

// GET /api/admin/shipping-policy — current policy for the admin editor
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json({ policy: await readPolicy() });
}

// PUT /api/admin/shipping-policy — save the edited policy
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  // Normalize/clamp before persisting so bad input can never corrupt the storefront.
  const policy = normalizePolicy(body.policy ?? body);
  await db.siteConfig.upsert({
    where: { key: SHIPPING_POLICY_KEY },
    create: { key: SHIPPING_POLICY_KEY, value: JSON.stringify(policy) },
    update: { value: JSON.stringify(policy) },
  });

  return NextResponse.json({ policy });
}
