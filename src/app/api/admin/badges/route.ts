import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { BadgeSchema, parseBody } from "@/lib/validators";

const CONFIG_KEY = "badges";

type Badge = { id: string; label: string; tone: "new" | "sale" | "trending"; status: "active" | "inactive" };

const DEFAULT_BADGES: Badge[] = [
  { id: "badge-1", label: "NEW",      tone: "new",      status: "active" },
  { id: "badge-2", label: "SALE",     tone: "sale",     status: "active" },
  { id: "badge-3", label: "TRENDING", tone: "trending", status: "active" },
];

async function readBadges(): Promise<Badge[]> {
  const row = await db.siteConfig.findUnique({ where: { key: CONFIG_KEY } });
  if (!row) return DEFAULT_BADGES;
  try {
    return JSON.parse(row.value) as Badge[];
  } catch {
    return DEFAULT_BADGES;
  }
}

async function writeBadges(badges: Badge[]) {
  await db.siteConfig.upsert({
    where:  { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(badges) },
    update: { value: JSON.stringify(badges) },
  });
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const badges = await readBadges();
  return NextResponse.json({ badges });
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body   = await req.json().catch(() => null);
  const parsed = parseBody(BadgeSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const badges = await readBadges();
  const badge: Badge = { ...parsed.data, status: parsed.data.status ?? "active", id: `badge-${Date.now()}` };
  badges.push(badge);
  await writeBadges(badges);

  return NextResponse.json({ badge }, { status: 201 });
}
