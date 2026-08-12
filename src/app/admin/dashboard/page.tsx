"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { OrderStatusChart } from "@/components/admin/OrderStatusChart";
import type { Order } from "@/lib/store";
import {
  TrendingUp, ShoppingCart, Package, Users, Clock, CheckCircle, Tag, Heart,
} from "lucide-react";
import Link from "next/link";
import { AdminDashboardSkeleton } from "@/components/admin/AdminSkeletons";

const STATUS_BADGE: Record<string, string> = {
  PLACED:    "bg-blue-100 text-blue-700",
  PACKED:    "bg-yellow-100 text-yellow-700",
  SHIPPED:   "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

type ApiOrder = {
  id: string; name: string; phone: string; total: number; status: string;
  createdAt: string; items: { id: string }[];
};
type Stats = {
  totalOrders: number; totalRevenue: number; pendingOrders: number;
  totalProducts: number; totalCustomers: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats ?? null);
        setRecentOrders(data.recentOrders ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Charts expect the store's lowercase-status Order shape — adapt the admin API orders.
  const chartOrders: Order[] = recentOrders.map((o) => ({
    id: o.id,
    items: o.items.map((it) => ({ id: it.id, qty: 1 })),
    total: o.total,
    status: o.status.toLowerCase() as Order["status"],
    createdAt: new Date(o.createdAt).getTime(),
    payment: "",
    address: "",
    name: o.name,
    phone: o.phone,
  }));

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Admin Dashboard</h2>
        <p className="text-sm text-slate-400 mt-0.5">Manage all aspects of your e-commerce platform</p>
      </div>

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={`৳${(stats?.totalRevenue ?? 0).toLocaleString()}`} subtitle="All time" icon={TrendingUp} color="green" />
        <StatCard title="Total Orders"  value={stats?.totalOrders ?? 0} subtitle={`${stats?.pendingOrders ?? 0} pending`} icon={ShoppingCart} color="blue" />
        <StatCard title="Total Products" value={stats?.totalProducts ?? 0} subtitle="Active products" icon={Package} color="orange" />
        <StatCard title="Customers" value={stats?.totalCustomers ?? 0} subtitle="Registered buyers" icon={Users} color="purple" />
      </div>

      {/* Stat cards row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Orders" value={stats?.pendingOrders ?? 0} subtitle="Need attention" icon={Clock} color="yellow" />
        <StatCard title="Delivered" value={recentOrders.filter((o) => o.status === "DELIVERED").length} subtitle="Recent completed" icon={CheckCircle} color="teal" />
        <StatCard title="Recent Orders" value={recentOrders.length} subtitle="Last 10 orders" icon={Tag} color="red" />
        <StatCard title="Avg Order Value" value={stats?.totalOrders ? `৳${Math.round((stats.totalRevenue) / stats.totalOrders).toLocaleString()}` : "৳0"} subtitle="Per order" icon={Heart} color="pink" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart orders={chartOrders} />
        </div>
        <div>
          <OrderStatusChart orders={chartOrders} />
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Orders</h3>
          <Link href="/admin/orders" className="text-xs text-[#ef4444] font-semibold hover:underline">View All</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order ID</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Items</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{o.id.slice(0, 12)}…</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{o.name}</p>
                      <p className="text-xs text-slate-400">{o.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 hidden sm:table-cell">{o.items.length} pcs</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">৳{o.total.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[o.status]}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 hidden md:table-cell">
                      {new Date(o.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
