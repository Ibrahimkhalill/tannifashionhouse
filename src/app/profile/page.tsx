"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { ProfileShell } from "@/components/site/ProfileShell";
import { useStore } from "@/lib/store";
import {
  Package, PackageCheck, Clock, MapPin,
  Heart, ChevronRight, User as UserIcon,
} from "lucide-react";
import { Price } from "@/components/site/Price";

type ApiOrderItem = {
  productId: string;
  qty: number;
  size: string | null;
  price: number;
  product: { name: string; images: string[]; slug: string };
};
type ApiOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: ApiOrderItem[];
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PLACED:    { label: "Placed",     cls: "bg-accent text-white" },
  CONFIRMED: { label: "Confirmed",  cls: "bg-foreground text-background" },
  PACKED:    { label: "Packed",     cls: "bg-foreground text-background" },
  SHIPPED:   { label: "Delivering", cls: "bg-foreground text-background" },
  DELIVERED: { label: "Delivered",  cls: "bg-black text-white" },
  CANCELLED: { label: "Cancelled",  cls: "bg-border text-foreground" },
  placed:    { label: "Placed",     cls: "bg-accent text-white" },
  packed:    { label: "Packed",     cls: "bg-foreground text-background" },
  shipped:   { label: "Delivering", cls: "bg-foreground text-background" },
  delivered: { label: "Delivered",  cls: "bg-black text-white" },
  cancelled: { label: "Cancelled",  cls: "bg-border text-foreground" },
};

type ApiAddress = {
  id: string; label: string; name: string; phone: string;
  line1: string; line2: string | null; city: string; district: string; isDefault: boolean;
};

function DashboardInner() {
  const { user, wishlist } = useStore();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [addresses, setAddresses] = useState<ApiAddress[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.orders) setOrders(data.orders); })
      .catch(() => {});
    fetch("/api/addresses")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.addresses) setAddresses(data.addresses); })
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];

  const stats = [
    { label: "Total Orders", value: orders.length,                                                    icon: Package },
    { label: "Delivered",    value: orders.filter((o) => o.status === "DELIVERED").length,            icon: PackageCheck },
    { label: "Pending",      value: orders.filter((o) => o.status !== "DELIVERED").length,            icon: Clock },
    { label: "Wishlist",     value: wishlist.length,                                                  icon: Heart },
  ];

  return (
    <ProfileShell>
      <div className="space-y-4 lg:space-y-5 animate-fade-up">

        {/* Welcome banner */}
        <section className="bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] p-5 sm:p-6 lg:p-7">
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70 font-bold">Dashboard</p>
          <h1 className="mt-1.5 text-[18px] sm:text-[20px] lg:text-[24px] font-bold tracking-tight leading-[1.15]">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-[13px] sm:text-sm lg:text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
            View your recent orders, manage your shipping and billing addresses, and edit your password and account details from one place.
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {stats.map((s) => (
            <div key={s.label} className="group bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] hover:shadow-[0_12px_28px_-16px_oklch(0_0_0/0.12)] hover:-translate-y-[2px] transition-all duration-300 ease-out p-4 sm:p-5">
              <div className="size-10 lg:size-11 rounded-xl bg-secondary text-black flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.05]">
                <s.icon className="size-[18px] lg:size-5" strokeWidth={2} />
              </div>
              <p className="mt-3 lg:mt-4 text-[20px] sm:text-[22px] lg:text-[26px] font-bold tracking-tight leading-none">{s.value}</p>
              <p className="mt-1 text-[12px] sm:text-[13px] lg:text-sm text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Account info + billing address */}
        <section className="grid lg:grid-cols-2 gap-3 lg:gap-4">
          <div className="bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2.5 mb-4 lg:mb-5">
              <div className="size-9 lg:size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <UserIcon className="size-[18px] lg:size-5 text-black" strokeWidth={2} />
              </div>
              <h2 className="text-[15px] sm:text-base lg:text-lg font-bold tracking-tight">Account Info</h2>
            </div>
            <div className="flex items-center gap-3.5 lg:gap-4 mb-4 lg:mb-5">
              <div className="size-12 lg:size-14 rounded-2xl bg-black text-white flex items-center justify-center text-base lg:text-lg font-bold shrink-0">
                {user.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm lg:text-[15px] font-bold truncate">{user.name}</p>
                {user.email && <p className="text-xs lg:text-[13px] text-muted-foreground truncate mt-0.5">{user.email}</p>}
                {user.phone && <p className="text-xs lg:text-[13px] text-muted-foreground mt-0.5">{user.phone}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between border-t pt-3.5 mt-auto">
              <span className="text-xs lg:text-sm text-muted-foreground">Account Status</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black text-white text-[11px] font-semibold">
                <span className="size-1.5 rounded-full bg-white animate-pulse" /> Active
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] p-5 sm:p-6 flex flex-col">
            <div className="flex items-center gap-2.5 mb-4 lg:mb-5">
              <div className="size-9 lg:size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <MapPin className="size-[18px] lg:size-5 text-black" strokeWidth={2} />
              </div>
              <h2 className="text-[15px] sm:text-base lg:text-lg font-bold tracking-tight">Billing Address</h2>
            </div>
            {defaultAddr ? (
              <div className="space-y-0.5 flex-1">
                <p className="text-sm lg:text-[15px] font-bold">{defaultAddr.name}</p>
                <p className="text-xs lg:text-[13px] text-muted-foreground">
                  {defaultAddr.line1}{defaultAddr.line2 ? `, ${defaultAddr.line2}` : ""}
                </p>
                <p className="text-xs lg:text-[13px] text-muted-foreground">{defaultAddr.city}, {defaultAddr.district}</p>
                <p className="text-xs lg:text-[13px] text-muted-foreground">{defaultAddr.phone}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 py-5 text-center gap-2.5">
                <div className="size-10 rounded-xl bg-secondary flex items-center justify-center">
                  <MapPin className="size-5 text-muted-foreground/70" strokeWidth={2} />
                </div>
                <p className="text-xs lg:text-[13px] text-muted-foreground max-w-[14rem]">
                  {"You haven't set up a default billing address yet."}
                </p>
              </div>
            )}
            <Link
              href="/profile/addresses"
              className="mt-4 h-10 lg:h-11 w-full rounded-xl border border-black text-xs lg:text-sm font-semibold hover:bg-black hover:text-white active:scale-[0.98] transition-all duration-200 ease-out flex items-center justify-center"
            >
              {defaultAddr ? "Manage Addresses" : "Add Address"}
            </Link>
          </div>
        </section>

        {/* Recent orders */}
        {orders.length > 0 && (
          <section className="bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] overflow-hidden">
            <div className="px-5 lg:px-6 py-4 lg:py-5 border-b flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-9 lg:size-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Package className="size-[18px] lg:size-5 text-black" strokeWidth={2} />
                </div>
                <h2 className="text-[15px] sm:text-base lg:text-lg font-bold tracking-tight truncate">Recent Orders</h2>
              </div>
              <Link href="/profile/orders" className="shrink-0 inline-flex items-center gap-1 text-xs lg:text-[13px] text-accent font-semibold hover:underline underline-offset-4">
                View all <ChevronRight className="size-3.5" />
              </Link>
            </div>
            <div className="divide-y">
              {orders.slice(0, 3).map((o) => {
                const meta = STATUS_META[o.status] ?? STATUS_META[o.status?.toLowerCase()] ?? STATUS_META.placed;
                return (
                  <Link key={o.id} href={`/order/${o.id}`}
                    className="flex items-center gap-3 px-5 lg:px-6 py-3.5 lg:py-4 hover:bg-secondary/60 transition-colors group">
                    <div className="flex items-center -space-x-2 shrink-0">
                      {o.items.slice(0, 3).map((it) => {
                        const img = it.product?.images?.[0];
                        return img ? (
                          <img key={it.productId} src={img} className="size-9 lg:size-10 rounded-lg object-cover border-2 border-white shadow-sm" alt="" />
                        ) : null;
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] lg:text-sm font-semibold truncate">
                        Order <span className="font-mono text-muted-foreground">{o.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                      <p className="text-[11px] lg:text-xs text-muted-foreground mt-0.5">
                        {o.items.length} {o.items.length === 1 ? "item" : "items"} · {new Date(o.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <Price amount={o.total} size="sm" className="!font-bold" />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <ChevronRight className="size-4 text-border group-hover:text-black transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </ProfileShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}
