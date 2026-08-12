"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, X, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { AdminTableRowsSkeleton } from "@/components/admin/AdminSkeletons";

type Status = "PLACED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type ApiOrderItem = { id: string; productId: string; qty: number; size: string | null; price: number; product: { name: string; images: string[] } };
type ApiOrder = {
  id: string; name: string; phone: string; email: string | null; address: string;
  total: number; status: Status; createdAt: string; items: ApiOrderItem[];
};

const STATUS_OPTIONS: Status[] = ["PLACED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const STATUS_BADGE: Record<Status, string> = {
  PLACED:    "bg-blue-100 text-blue-700",
  PACKED:    "bg-yellow-100 text-yellow-700",
  SHIPPED:   "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};
const PAGE_SIZE = 12;

export default function OrdersPage() {
  const [orders, setOrders]       = useState<ApiOrder[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<Status | "all">("all");
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState<ApiOrder | null>(null);
  useEscapeClose(selected !== null, () => setSelected(null));

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => { setOrders(data.orders ?? []); setTotal(data.total ?? 0); })
      .finally(() => setLoading(false));
  }, [page, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleStatusChange = async (id: string, status: Status) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Order status updated to ${status}`);
      if (selected?.id === id) setSelected((o) => o ? { ...o, status } : o);
      load();
    } else {
      toast.error("Failed to update order status");
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Orders Management</h2>
        <p className="text-sm text-slate-400">{total} total orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", ...STATUS_OPTIONS] as const).map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`h-9 px-4 rounded-full text-sm font-semibold border transition capitalize ${
              statusFilter === s ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400 bg-white"
            }`}>
            {s === "all" ? "All Orders" : s.toLowerCase()}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID, name, phone..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && <AdminTableRowsSkeleton rows={8} cols={7} />}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">No orders found</td></tr>
              )}
              {!loading && orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{o.id.slice(0, 14)}…</td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800">{o.name}</p>
                    <p className="text-xs text-slate-400">{o.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 hidden sm:table-cell">{o.items.length} pcs</td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">৳{o.total.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_BADGE[o.status]}`}>
                      {o.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 hidden md:table-cell">
                    {new Date(o.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end">
                      <button onClick={() => setSelected(o)} className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition">
                        <Eye className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,total)} of {total}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1} className="size-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition"><ChevronLeft className="size-4" /></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>Math.abs(n-page)<=2).map((n)=>(
                <button key={n} onClick={()=>setPage(n)} className={`size-8 rounded-lg border text-sm font-medium transition ${n===page?"bg-[#0f172a] text-white border-[#0f172a]":"hover:bg-slate-50"}`}>{n}</button>
              ))}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="size-8 rounded-lg border flex items-center justify-center hover:bg-slate-50 disabled:opacity-40 transition"><ChevronRight className="size-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Order Details</h3>
                <p className="text-xs text-slate-400 font-mono">{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {/* Customer info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Customer Info</p>
                <p className="text-sm font-semibold text-slate-800">{selected.name}</p>
                <p className="text-xs text-slate-500">{selected.phone}</p>
                {selected.email && <p className="text-xs text-slate-500">{selected.email}</p>}
                <p className="text-xs text-slate-500 mt-1">{selected.address}</p>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Items ({selected.items.length})</p>
                <div className="space-y-2">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name} className="size-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
                        {item.size && <p className="text-xs text-slate-400">Size: {item.size}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-slate-800">×{item.qty}</p>
                        <p className="text-xs text-slate-400">৳{(item.price * item.qty).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-slate-600">Total Amount</span>
                <span className="text-lg font-bold text-slate-800">৳{selected.total.toLocaleString()}</span>
              </div>

              {/* Status update */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTIONS.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(selected.id, s)}
                      className={`h-9 px-4 rounded-full text-xs font-semibold border transition capitalize ${
                        selected.status === s ? STATUS_BADGE[s] + " border-transparent" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}>
                      {s.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 shrink-0">
              <button onClick={() => setSelected(null)} className="w-full h-10 rounded-xl bg-[#0f172a] text-white text-sm font-semibold hover:bg-slate-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
