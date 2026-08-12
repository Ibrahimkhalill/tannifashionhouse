"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Layout } from "@/components/site/Layout";
import { useStore } from "@/lib/store";
import TakaSvg from "@/assets/TakaSvg";
import {
  Check, Package, Truck, Home, ChevronLeft, Receipt, Search,
} from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { OrderTrackingSkeleton } from "@/components/site/skeletons";

type ApiOrderItem = { id: string; qty: number; size: string | null; price: number; product: { name: string; images: string[] } };
type ApiOrder = {
  id: string; status: string; total: number; createdAt: string;
  items: ApiOrderItem[];
};

function Price({ amount, className }: { amount: number | string; className?: string }) {
  const num = typeof amount === "number" ? amount.toLocaleString() : amount;
  return (
    <span className={`inline-flex items-baseline gap-px ${className ?? ""}`}>
      <span className="text-[0.82em] font-bold leading-none translate-y-px"><TakaSvg /></span>
      <span>{num}</span>
    </span>
  );
}

const TIMELINE_STEPS = [
  { icon: Check,   label: "Order Placed",       key: "placed" },
  { icon: Check,   label: "Address Confirmed",  key: "placed" },
  { icon: Check,   label: "Confirmed",          key: "placed" },
  { icon: Package, label: "Packed",             key: "packed" },
  { icon: Truck,   label: "Out for Delivery",   key: "shipped" },
  { icon: Home,    label: "Delivered",          key: "delivered" },
];

const STATUS_LABEL: Record<string, string> = {
  placed:    "Order Placed",
  packed:    "Packed",
  shipped:   "Delivering",
  delivered: "Delivered",
};

const STATUS_META: Record<string, { cls: string }> = {
  placed:    { cls: "bg-accent text-white" },
  packed:    { cls: "bg-foreground text-background" },
  shipped:   { cls: "bg-foreground text-background" },
  delivered: { cls: "bg-black text-white" },
  cancelled: { cls: "bg-border text-foreground" },
};

function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const { user } = useStore();
  const [order, setOrder] = useState<ApiOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    let phone = "";
    try { phone = localStorage.getItem(`shopbd:orderphone:${id}`) ?? ""; } catch {}
    const qs = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    fetch(`/api/orders/${id}${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOrder(data?.order ?? null))
      .catch(() => setOrder(null));
  }, [id]);

  const status = (order?.status ?? "PLACED").toLowerCase();
  const doneCount = ({ placed: 3, packed: 4, shipped: 5, delivered: 6 } as Record<string, number>)[status] ?? 3;

  const createdDate = order
    ? new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const meta = STATUS_META[status] ?? STATUS_META.placed;

  if (order === undefined) {
    return (
      <Layout hideTrust>
        <OrderTrackingSkeleton />
      </Layout>
    );
  }
  if (order === null) {
    return (
      <Layout hideTrust>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-xl font-bold tracking-tight">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t find this order, or you&apos;re not authorized to view it.</p>
          <Link href="/track" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background hover:opacity-90 transition">
            Track an order
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideTrust>
      <PageHeader
        centered
        color="oklch(0.96 0 0)"
        title="Order Tracking"
        subtitle="Track the live status of your order from placement to delivery."
        crumbs={user
          ? [{ label: "Home", to: "/" }, { label: "Account", to: "/profile" }, { label: "Tracking" }]
          : [{ label: "Home", to: "/" }, { label: "Track", to: "/track" }, { label: "Tracking" }]}
      />

      <div className="bg-secondary/20 min-h-screen pb-16">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">

          {/* Top link — account for signed-in users, track-another for guests */}
          <div className="flex items-center justify-between">
            {user ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <ChevronLeft className="size-4" /> My Account
              </Link>
            ) : (
              <Link
                href="/track"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <Search className="size-4" /> Track another order
              </Link>
            )}
          </div>

          {/* Order summary card */}
          <div className="bg-card rounded-2xl border shadow-sm p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Order ID</p>
                <p className="font-mono font-bold text-base">#{id.slice(0, 12).toUpperCase()}</p>
              </div>
              <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wide shrink-0 ${meta.cls}`}>
                {STATUS_LABEL[status]}
              </span>
            </div>

            {/* Mini item thumbnails */}
            {order && (
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="flex items-center -space-x-2 shrink-0">
                  {order.items.slice(0, 4).map((it) => {
                    const img = it.product.images?.[0];
                    return img ? (
                      <img
                        key={it.id}
                        src={img}
                        alt=""
                        className="size-10 rounded-xl object-cover border-2 border-white shadow-sm"
                      />
                    ) : null;
                  })}
                  {order.items.length > 4 && (
                    <span className="size-10 rounded-xl bg-secondary border-2 border-white flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      +{order.items.length - 4}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </p>
                  <p className="text-xs text-muted-foreground">{createdDate}</p>
                </div>
                <Price amount={order.total} className="font-extrabold text-base shrink-0" />
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-2xl border shadow-sm p-5 sm:p-6">
            <h3 className="font-bold text-base mb-6">Delivery Timeline</h3>
            <div className="flex flex-col">
              {TIMELINE_STEPS.map((step, i) => {
                const done   = i < doneCount;
                const active = i === doneCount - 1;
                const future = i >= doneCount;
                const isLast = i === TIMELINE_STEPS.length - 1;
                const Icon   = step.icon;

                return (
                  <div key={i} className={`flex gap-4 ${isLast ? "min-h-10" : "min-h-18"} ${future ? "opacity-40" : ""}`}>
                    {/* Dot + connector line */}
                    <div className="flex flex-col items-center">
                      {active ? (
                        <div className="relative w-11 h-11 -ml-0.5 rounded-full bg-foreground text-background flex items-center justify-center z-10 shadow-lg shrink-0">
                          <Icon size={18} />
                          <span className="absolute -right-0.5 -top-0.5 w-3 h-3 bg-foreground border-2 border-background rounded-full animate-pulse" />
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${done ? "bg-green-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                          {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={16} />}
                        </div>
                      )}
                      {!isLast && (
                        <div className={`w-0.5 flex-1 -my-0.5 ${done && !active ? "bg-green-500" : "bg-border"}`} />
                      )}
                    </div>

                    {/* Label */}
                    <div className={`pb-6 ${active ? "pl-1" : ""}`}>
                      <h4 className={`font-bold ${active ? "text-base" : "text-sm"}`}>{step.label}</h4>
                      {active && (
                        <p className="text-xs text-muted-foreground mt-0.5">{createdDate}</p>
                      )}
                      {future && step.key === "delivered" && (
                        <p className="text-xs text-muted-foreground mt-0.5">Estimated soon</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions — full invoice/details is account-only, so show it only
              to signed-in users; guests just continue shopping. */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            {user && (
              <Link
                href={`/order/${id}/details`}
                className="h-12 px-10 flex items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold hover:border-foreground transition"
              >
                <Receipt size={15} /> View Details
              </Link>
            )}
            <Link
              href="/"
              className="h-12 px-10 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background text-sm font-bold hover:opacity-80 transition"
            >
              Continue Shopping
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}

export default OrderTrackingPage;
