"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/site/Layout";
import { useState } from "react";
import {
  Lock, Banknote, ShieldCheck, RotateCcw, Minus, Plus, Trash2, Check,
  ChevronDown, MapPin, Tag, ShoppingCart, User as UserIcon, Phone,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Price } from "@/components/site/Price";

const BD_DIVISIONS = [
  "Dhaka", "Chattogram", "Khulna", "Rajshahi",
  "Barishal", "Sylhet", "Rangpur", "Mymensingh",
] as const;

function CheckoutPage() {
  const { cart, resolveProduct, setQty, removeFromCart, clearCart, cartSubtotal, user } = useStore();
  const router = useRouter();

  const [form, setForm] = useState({
    name:     user?.name  ?? "",
    phone:    user?.phone ?? "",
    address:  "",
    division: "",
  });
  const [submitting,  setSubmitting]  = useState(false);
  const [coupon,      setCoupon]      = useState("");
  const [discount,    setDiscount]    = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  // Shipping is derived from division — Dhaka is "inside" (৳80), everywhere else "outside" (৳120).
  const deliveryArea: "inside" | "outside" =
    form.division && form.division !== "Dhaka" ? "outside" : "inside";
  const shippingCost = deliveryArea === "inside" ? 80 : 120;
  const subtotal     = cartSubtotal;
  const total        = subtotal - discount + shippingCost;

  const applyCoupon = async () => {
    const c = coupon.trim().toUpperCase();
    if (!c) return;
    try {
      const res = await fetch("/api/offers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Invalid coupon"); return; }
      setDiscount(data.discount ?? 0);
      toast.success(`Coupon applied! ৳${data.discount} off`);
    } catch {
      toast.error("Could not validate coupon");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.division) {
      toast.error("Please fill in all fields"); return;
    }
    // Bangladeshi mobile: 01 + operator digit (3–9) + 8 digits.
    if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
      toast.error("Enter a valid Bangladeshi mobile number (01XXXXXXXXX)"); return;
    }
    if (cart.length === 0) { toast.error("Your cart is empty"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     form.name.trim(),
          phone:    form.phone.trim(),
          address:  form.address.trim(),
          district: form.division,     // simplified checkout collects division only
          division: form.division,
          deliveryArea,
          payment:  "cod",
          items:    cart.map((it) => ({ productId: it.id, qty: it.qty, size: it.size })),
          couponCode: coupon.trim().toUpperCase() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Order failed"); return; }
      const orderId = data.order?.id;
      if (orderId) {
        try { localStorage.setItem(`shopbd:orderphone:${orderId}`, form.phone.trim()); } catch {}
      }
      clearCart();
      toast.success("Order placed!", { description: `Order ID: ${orderId}` });
      router.push(`/order/${orderId}`);
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <Layout hideTrust>
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-20 lg:py-24">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Your cart is empty</h1>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90 lg:h-11 lg:px-7"
          >
            Browse products
          </Link>
        </div>
      </Layout>
    );
  }

  /* ── Shared order summary content ─────────────────────────────────── */
  const OrderSummaryContent = () => (
    <div className="flex flex-col gap-4 lg:gap-5">
      <div className="flex flex-col gap-2.5 lg:gap-3">
        {cart.map((it) => {
          const p = resolveProduct(it.id);
          if (!p) return null;
          return (
            <div key={it.id + (it.size ?? "")} className="flex gap-3 rounded-xl border border-border/70 bg-background p-3 lg:gap-3.5 lg:p-3.5">
              <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted lg:h-20 lg:w-16">
                <img src={p.image} alt={p.name} className="size-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <p className="line-clamp-2 text-sm font-medium leading-snug lg:text-[15px]">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground lg:text-[13px]">{it.size ? it.size : p.category}</p>
                </div>
                <div className="mt-1.5 flex items-center justify-between lg:mt-2">
                  <div className="flex items-center gap-2.5 rounded-full border border-border px-2 py-0.5 lg:gap-3">
                    <button type="button" onClick={() => setQty(it.id, it.qty - 1)} disabled={it.qty <= 1}
                      className="flex size-5 items-center justify-center rounded-full hover:bg-secondary disabled:opacity-30 lg:size-6">
                      <Minus className="size-3" strokeWidth={2.5} />
                    </button>
                    <span className="text-xs font-semibold tabular-nums lg:text-[13px]">{it.qty}</span>
                    <button type="button" onClick={() => setQty(it.id, it.qty + 1)}
                      className="flex size-5 items-center justify-center rounded-full hover:bg-secondary lg:size-6">
                      <Plus className="size-3" strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Price amount={p.price * it.qty} size="sm" className="!font-semibold lg:!text-[15px]" />
                    <button type="button" onClick={() => { removeFromCart(it.id); toast("Item removed"); }}
                      className="flex size-6 items-center justify-center text-muted-foreground/60 transition-colors hover:text-accent" aria-label="Remove">
                      <Trash2 size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coupon */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 size-[13px] -translate-y-1/2 text-muted-foreground" />
          <input value={coupon} onChange={(e) => setCoupon(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
            placeholder="Promo code"
            className="h-10 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm font-medium uppercase tracking-wide outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground" />
        </div>
        <button type="button" onClick={applyCoupon}
          className="h-10 shrink-0 rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90">
          Apply
        </button>
      </div>

      {/* Breakdown */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <Price amount={subtotal} size="sm" className="!font-semibold" />
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">Shipping</span>
          <Price amount={shippingCost} size="sm" className="!font-semibold" />
        </div>
        {discount > 0 && (
          <div className="flex items-baseline justify-between text-accent">
            <span className="text-sm">Discount</span>
            <span className="inline-flex items-baseline gap-0.5 text-sm font-semibold">
              <span>−</span><Price amount={discount} size="sm" tone="inherit" className="!font-semibold" />
            </span>
          </div>
        )}
        <div className="mt-1.5 flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-base font-bold tracking-tight">Total</span>
          <Price amount={total} size="md" className="!font-bold lg:!text-lg" symbolClassName="lg:!text-[0.88rem]" />
        </div>
      </div>
    </div>
  );

  return (
    <Layout hideTrust>
      <PageHeader
        centered
        color="oklch(0.96 0 0)"
        title="Checkout"
        subtitle="Enter your address — pay when you receive (Cash on Delivery)."
        crumbs={[{ label: "Home", to: "/" }, { label: "Checkout" }]}
      />

      <div className="min-h-screen bg-secondary/25 pb-24 md:pb-10">
        <form
          id="checkout-form"
          onSubmit={handleSubmit}
          className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-5 px-4 py-5 sm:py-6 lg:grid-cols-12 lg:gap-7 lg:px-6 lg:py-8"
        >
          {/* ══════════ Order Summary ══════════ */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:order-last lg:col-span-5 lg:gap-4">
            <div className="lg:hidden overflow-hidden rounded-xl border border-border/80 bg-card">
              <button type="button" onClick={() => setSummaryOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-foreground" strokeWidth={2} />
                  <span className="text-sm font-semibold">{summaryOpen ? "Hide" : "Show"} order summary</span>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
                </div>
                <Price amount={total} size="md" className="!font-bold" />
              </button>
              {summaryOpen && (
                <div className="border-t border-border px-4 pb-4"><div className="pt-3.5"><OrderSummaryContent /></div></div>
              )}
            </div>

            <div className="hidden rounded-2xl border border-border/80 bg-card p-6 lg:block">
              <h2 className="text-xl font-bold tracking-tight">Order summary</h2>
              <div className="mt-4"><OrderSummaryContent /></div>
            </div>

            <div className="hidden grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-card p-4 lg:grid">
              {[{ icon: ShieldCheck, label: "Cash on Delivery" }, { icon: RotateCcw, label: "Easy Returns" }].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon className="size-[18px] text-foreground" strokeWidth={2} />
                  <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ══════════ Delivery + Payment ══════════ */}
          <div className="flex flex-col gap-4 lg:col-span-7 lg:gap-5">
            {/* Delivery Address — Name, Phone, Division, Full Address */}
            <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 lg:p-7">
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary lg:size-9 lg:rounded-xl">
                  <MapPin className="size-4 text-foreground lg:size-[18px]" strokeWidth={2} />
                </span>
                <h2 className="text-lg font-bold tracking-tight lg:text-xl">Delivery Address</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:mt-5 lg:gap-4">
                <div className="md:col-span-2">
                  <Field label="Full Name" icon={UserIcon} placeholder="Full Name" value={form.name} onChange={set("name")} />
                </div>
                <Field label="Mobile Number" icon={Phone} type="tel" inputMode="numeric"
                  placeholder="01XXXXXXXXX" value={form.phone}
                  onChange={(v) => set("phone")(v.replace(/\D/g, "").slice(0, 11))} />
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Division <span className="text-accent">*</span>
                  </label>
                  <div className="relative">
                    <select value={form.division} onChange={(e) => set("division")(e.target.value)} required
                      className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-border bg-background pl-3.5 pr-9 text-sm font-medium outline-none focus:border-foreground">
                      <option value="">Select Division</option>
                      {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Full Address <span className="text-accent">*</span>
                  </label>
                  <textarea value={form.address} onChange={(e) => set("address")(e.target.value)}
                    placeholder="House no, Road, Area, Thana, District" rows={3} required
                    className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground" />
                </div>
              </div>
            </section>

            {/* Payment — Cash on Delivery only */}
            <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 lg:p-7">
              <h2 className="text-lg font-bold tracking-tight lg:text-xl">Payment</h2>
              <div className="mt-4 flex items-center gap-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 p-4">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
                <Banknote className="size-6 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-foreground">Cash on Delivery</p>
                  <p className="text-xs text-muted-foreground">Pay when you receive the product</p>
                </div>
              </div>
            </section>

            {/* Desktop CTA */}
            <div className="hidden md:block rounded-2xl border border-border/80 bg-card p-5 sm:p-6 lg:p-7">
              <button type="submit" disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-base font-bold text-background transition hover:opacity-90 active:scale-[0.99] disabled:opacity-40">
                {submitting
                  ? <><span className="size-4 animate-spin rounded-full border-2 border-background/30 border-t-background" /> Placing order...</>
                  : <><Lock className="size-4" strokeWidth={2.25} /> Confirm Order — <Price amount={total} size="sm" tone="inherit" className="!font-bold" /></>}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border bg-background/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.1)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-muted-foreground">Total</span>
            <Price amount={total} size="md" className="!font-bold" />
          </div>
          <button type="submit" form="checkout-form" disabled={submitting}
            className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-bold text-background transition hover:opacity-90 active:scale-[0.99] disabled:opacity-40">
            {submitting
              ? <><span className="size-4 animate-spin rounded-full border-2 border-background/30 border-t-background" /> Placing...</>
              : <><Lock size={15} /> Confirm Order</>}
          </button>
        </div>
      </div>
    </Layout>
  );
}

/* Compact form field with a leading icon. */
function Field({
  label, placeholder, value, onChange, icon: Icon, type = "text", inputMode,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  icon: React.ComponentType<{ className?: string }>; type?: string;
  inputMode?: "numeric" | "text" | "tel";
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} <span className="text-accent">*</span>
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input type={type} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground" />
      </div>
    </div>
  );
}

export default CheckoutPage;
