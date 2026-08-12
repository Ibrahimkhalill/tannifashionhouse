"use client";

import { Menu, Bell, Package, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Props {
  onMenuClick: () => void;
  title: string;
}

type Order = { id: string; name: string; total: number; status: string; createdAt: string };

export function AdminTopbar({ onMenuClick, title }: Props) {
  const [dateTime, setDateTime] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDateTime(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // Recent orders power the notification bell (refreshed every minute).
  useEffect(() => {
    const load = () => fetch("/api/admin/orders?limit=6")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const newCount = orders.filter((o) => o.status?.toUpperCase() === "PLACED").length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center gap-4 px-4 lg:px-6 shrink-0">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition">
        <Menu className="size-5 text-slate-600" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-slate-800 truncate">{title}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">{dateTime}</p>
      </div>

      {/* Notifications — recent orders */}
      <div ref={ref} className="relative">
        <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-xl hover:bg-slate-100 transition" aria-label="Notifications">
          <Bell className="size-5 text-slate-500" />
          {newCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {newCount > 9 ? "9+" : newCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-80">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-bold text-slate-800">Notifications</p>
              {newCount > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-500">{newCount} new</span>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {orders.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No recent orders</p>
              ) : orders.map((o) => (
                <Link key={o.id} href="/admin/orders" onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <Package className="size-4 text-slate-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">New order · {o.name}</p>
                    <p className="text-xs text-slate-400">{o.id} · ৳{o.total?.toLocaleString?.() ?? o.total}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${o.status?.toUpperCase() === "PLACED" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    {o.status}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/admin/orders" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-[#ef4444] transition hover:bg-slate-50">
              View all orders <ChevronRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
