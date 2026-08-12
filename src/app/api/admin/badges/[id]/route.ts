import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { BadgeSchema, parseBody } from "@/lib/validators";

const CONFIG_KEY = "badges";

type Badge = { id: string; label: string; tone: "new" | "sale" | "trending"; status: "active" | "inactive" };

async function readBadges(): Promise<Badge[]> {
  const row = await db.siteConfig.findUnique({ where: { key: CONFIG_KEY } });
  if (!row) return [];
  try {
    return JSON.parse(row.value) as Badge[];
  } catch {
    return [];
  }
}

async function writeBadges(badges: Badge[]) {
  await db.siteConfig.upsert({
    where:  { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(badges) },
    update: { value: JSON.stringify(badges) },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = parseBody(BadgeSchema, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const badges = await readBadges();
  const idx = badges.findIndex((b) => b.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  badges[idx] = { ...parsed.data, status: parsed.data.status ?? "active", id };
  await writeBadges(badges);

  return NextResponse.json({ badge: badges[idx] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const badges = (await readBadges()).filter((b) => b.id !== id);
  await writeBadges(badges);

  return NextResponse.json({ ok: true });
}
