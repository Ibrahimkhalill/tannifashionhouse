"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Order } from "@/lib/store";
import { useMemo } from "react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function RevenueChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const year = new Date().getFullYear();
    const map = Object.fromEntries(MONTHS.map((m, i) => [i, { month: m, revenue: 0, orders: 0 }]));
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === year) {
        map[d.getMonth()].revenue += o.total;
        map[d.getMonth()].orders += 1;
      }
    });
    return Object.values(map);
  }, [orders]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">Revenue Overview</h3>
          <p className="text-xs text-slate-400">Monthly earnings — {new Date().getFullYear()}</p>
        </div>
        <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full">
          ৳{orders.reduce((s, o) => s + o.total, 0).toLocaleString()} total
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
            formatter={(v: number) => [`৳${v.toLocaleString()}`, "Revenue"]}
          />
          <Bar dataKey="revenue" fill="#ef4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
