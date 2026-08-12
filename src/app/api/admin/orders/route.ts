import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/orders — all orders, with filters
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit  = 20;
  const skip   = (page - 1) * limit;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const where = {
    ...(status ? { status: status as "PLACED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED" } : {}),
    ...(search ? {
      OR: [
        { id:    { contains: search, mode: "insensitive" as const } },
        { name:  { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
      ],
    } : {}),
  };

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        items: {
          include: { product: { select: { name: true, images: true } } },
        },
      },
    }),
    db.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
}
