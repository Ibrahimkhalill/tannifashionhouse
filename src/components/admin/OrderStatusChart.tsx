"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Order } from "@/lib/store";
import { useMemo } from "react";

const STATUS_COLORS: Record<Order["status"], string> = {
  placed:    "#3b82f6",
  packed:    "#f59e0b",
  shipped:   "#8b5cf6",
  delivered: "#10b981",
};

const STATUS_LABELS: Record<Order["status"], string> = {
  placed: "Placed", packed: "Packed", shipped: "Shipped", delivered: "Delivered",
};

export function OrderStatusChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { placed: 0, packed: 0, shipped: 0, delivered: 0 };
    orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({ name: STATUS_LABELS[k as Order["status"]], value: v, key: k }));
  }, [orders]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center h-full min-h-[280px]">
        <p className="text-slate-400 text-sm">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-800">Order Status</h3>
        <p className="text-xs text-slate-400">{orders.length} total orders breakdown</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
            {data.map((entry) => (
              <Cell key={entry.key} fill={STATUS_COLORS[entry.key as Order["status"]]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
