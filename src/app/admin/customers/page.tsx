"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { AdminTableRowsSkeleton } from "@/components/admin/AdminSkeletons";

type Customer = {
  id: string; name: string; phone: string; email: string | null;
  type: "registered" | "guest";
  orderCount: number; totalSpent: number; lastOrderAt: string | null;
};

type Tab = "all" | "registered" | "guest";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => ({
    all: customers.length,
    registered: customers.filter((c) => c.type === "registered").length,
    guest: customers.filter((c) => c.type === "guest").length,
  }), [customers]);

  const filtered = useMemo(() =>
    customers.filter((c) =>
      (tab === "all" || c.type === tab) &&
      (!search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email ?? "").toLowerCase().includes(search.toLowerCase()))
    ), [customers, search, tab]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">All Customers</h2>
        <p className="text-sm text-slate-400">
          {counts.all} total · {counts.registered} registered · {counts.guest} guest
        </p>
      </div>

      {/* Search + tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition" />
        </div>
        <div className="flex gap-1.5">
          {([
            { key: "all",        label: "All",        n: counts.all },
            { key: "registered", label: "Registered", n: counts.registered },
            { key: "guest",      label: "Guest",      n: counts.guest },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3.5 h-8 rounded-lg text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}>
              {t.label} <span className="opacity-70">{t.n}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Orders</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <AdminTableRowsSkeleton rows={6} cols={6} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400">
                  {customers.length === 0 ? "No customers yet" : "No customers found"}
                </td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <span className={`w-fit text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          c.type === "registered"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}>
                          {c.type === "registered" ? "Registered" : "Guest"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 hidden sm:table-cell">{c.phone}</td>
                  <td className="px-4 py-3.5 text-slate-400 hidden md:table-cell">{c.email ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag className="size-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{c.orderCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">৳{c.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 hidden lg:table-cell">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
