"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProfileShell } from "@/components/site/ProfileShell";
import { Price } from "@/components/site/Price";
import { OrderDetailPanelSkeleton } from "@/components/site/skeletons";
import {
  ChevronLeft, RotateCcw, User, Phone, MapPin,
  Check, Package, CreditCard,
} from "lucide-react";

type ApiOrderItem = { id: string; productId: string; qty: number; size: string | null; price: number; product: { name: string; images: string[]; slug: string } };
type ApiOrder = {
  id: string; name: string; phone: string; address: string; status: string;
  subtotal: number; shippingCost: number; discount: number; total: number;
  createdAt: string; items: ApiOrderItem[];
};

const TIMELINE_STEPS: { key: string; label: string; desc: string }[] = [
  { key: "placed",    label: "Order Placed",  desc: "Thank you for your order! We've successfully received it and will begin preparing everything to ensure a smooth and timely delivery." },
  { key: "placed",    label: "Processing",    desc: "We're currently reviewing your order details and checking the availability of the items. Hang tight — we'll start packing soon!" },
  { key: "packed",    label: "Payment",       desc: "Your payment is being securely processed and verified. This may take a few moments. We'll notify you as soon as it's confirmed." },
  { key: "packed",    label: "Packing",       desc: "Our team is now carefully packing your items to make sure everything arrives in perfect condition. Quality is our priority!" },
  { key: "shipped",   label: "Delivering",    desc: "Your order is on the move! It's currently being delivered to your address. Keep an eye out — it's almost there." },
  { key: "delivered", label: "Delivered",     desc: "Your order has been successfully delivered! We hope you love your purchase. Thank you for shopping with us." },
];

const STATUS_RANK: Record<string, number> = { placed: 0, packed: 1, shipped: 2, delivered: 3 };

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
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

  if (order === undefined) {
    return (
      <ProfileShell>
        <OrderDetailPanelSkeleton />
      </ProfileShell>
    );
  }

  if (!order) {
    return (
      <ProfileShell>
        <div className="bg-white rounded-2xl border py-16 text-center">
          <Package className="size-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="font-bold text-base">Order not found</p>
          <p className="text-sm text-muted-foreground mt-2">  {"This order doesn't exist or you're not authorized to view it."}</p>
          <Link href="/profile/orders" className="mt-6 h-10 px-6 rounded-full bg-black text-white text-sm font-semibold inline-flex items-center hover:bg-accent transition">
            Back to Orders
          </Link>
        </div>
      </ProfileShell>
    );
  }

  const rank = STATUS_RANK[order.status.toLowerCase()] ?? 0;
  const subtotal = order.subtotal;
  const shippingCost = order.shippingCost;
  const discount = order.discount ?? 0;

  return (
    <ProfileShell activeLabel="Order Details" activeIcon={Package}>
      <div className="animate-fade-up space-y-4">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link href="/profile/orders"
            className="size-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition shrink-0">
            <ChevronLeft className="size-4" strokeWidth={2.5} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground font-medium">Order ID</p>
            <p className="font-mono font-bold text-sm">#{id.slice(0, 16).toUpperCase()}</p>
          </div>
          <button
            type="button"
            title="Refresh"
            className="size-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition shrink-0"
          >
            <RotateCcw className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-bold text-base">Timeline</h3>
          </div>
          <div className="px-5 py-5 space-y-0">
            {TIMELINE_STEPS.map((step, i) => {
              const stepRank = STATUS_RANK[step.key] ?? 0;
              const done = stepRank <= rank;
              const isLast = i === TIMELINE_STEPS.length - 1;

              return (
                <div key={i} className="flex gap-4">
                  {/* Left: date/status + connector */}
                  <div className="flex flex-col items-center gap-0 w-16 shrink-0">
                    <div className={`size-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      done ? "bg-foreground text-white" : "border-2 border-border bg-white"
                    }`}>
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
                    </div>
                    {!isLast && (
                      <div className={`w-px flex-1 min-h-6 ${done ? "bg-foreground/30" : "bg-border"}`} />
                    )}
                  </div>

                  {/* Right: label + description */}
                  <div className={`pb-5 min-w-0 flex-1 ${isLast ? "pb-2" : ""}`}>
                    <p className={`text-sm font-bold leading-tight ${done ? "text-foreground" : "text-muted-foreground/60"}`}>
                      {step.label}
                    </p>
                    <p className={`text-xs leading-relaxed mt-1 ${done ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipment Address */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-bold text-base">Shipment Address</h3>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-3">
              <User className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <span className="text-sm font-semibold">{order.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground shrink-0" strokeWidth={1.75} />
              <span className="text-sm text-muted-foreground">{order.phone}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.75} />
              <span className="text-sm text-muted-foreground">{order.address}</span>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-bold text-base">Order Items</h3>
          </div>
          <div className="divide-y">
            {order.items.map((it) => (
              <Link key={it.id} href={`/product/${it.productId}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors">
                <div className="size-14 rounded-xl bg-secondary overflow-hidden shrink-0">
                  {it.product.images?.[0] && <img src={it.product.images[0]} alt={it.product.name} className="size-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold line-clamp-2">{it.product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{it.size ? `Size: ${it.size}` : "Product"}</p>
                </div>
                <div className="text-right shrink-0">
                  <Price amount={it.price * it.qty} size="sm" className="font-bold!" />
                  <p className="text-xs text-muted-foreground mt-0.5">Quantity : {it.qty}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-bold text-base">Order Information</h3>
          </div>
          <div className="px-5 py-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order</span>
              <span className="font-mono font-semibold text-xs">#{id.slice(0, 16).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order At</span>
              <span className="font-semibold">
                {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal (MRP)</span>
              <Price amount={subtotal} size="sm" className="font-semibold!" />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-accent">
                <span>Discount</span>
                <span className="font-semibold">−<Price amount={discount} size="sm" /></span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Charge</span>
              {shippingCost === 0
                ? <span className="text-sm font-semibold text-green-600">Free</span>
                : <Price amount={shippingCost} size="sm" className="font-semibold!" />
              }
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT</span>
              <span className="font-semibold">৳ 0.00</span>
            </div>

            <div className="flex justify-between items-center border-t pt-3 mt-1">
              <span className="font-bold text-base">Total Payable</span>
              <Price amount={order.total} size="lg" className="font-bold!" />
            </div>
          </div>

          {/* Download invoice */}
          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full h-11 rounded-full border-2 border-foreground text-sm font-bold hover:bg-foreground hover:text-white transition flex items-center justify-center gap-2"
            >
              <CreditCard className="size-4" strokeWidth={2} />
              Download your invoice
            </button>
          </div>
        </div>

      </div>
    </ProfileShell>
  );
}
