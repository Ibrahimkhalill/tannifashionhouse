import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

// GET /api/admin/dashboard — summary stats for the dashboard
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [
    totalOrders,
    totalRevenue,
    pendingOrders,
    totalProducts,
    totalCustomers,
    recentOrders,
  ] = await Promise.all([
    db.order.count(),
    db.order.aggregate({
      _sum: { total: true },
      where: { status: { not: "CANCELLED" } },
    }),
    db.order.count({ where: { status: { in: ["PLACED", "PACKED"] } } }),
    db.product.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        items: { include: { product: { select: { name: true, images: true } } } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      totalOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      pendingOrders,
      totalProducts,
      totalCustomers,
    },
    recentOrders,
  });
}
