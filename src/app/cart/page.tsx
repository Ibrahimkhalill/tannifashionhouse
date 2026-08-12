"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { useStore } from "@/lib/store";
import type { Product } from "@/components/site/ProductCard";
import {
  Minus,
  Plus,
  X,
  ShoppingBag,
  ArrowRight,
  Heart,
  Lock,
  Truck,
  Headphones,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Price } from "@/components/site/Price";

const FREE_SHIP_THRESHOLD = 1500;

function CartPage() {
  const { cart, resolveProduct, setQty, removeFromCart, cartSubtotal, toggleWishlist } =
    useStore();
  const items = cart.map((it) => ({ ...it, p: resolveProduct(it.id)! })).filter((x) => x.p);

  const shipping = cartSubtotal >= FREE_SHIP_THRESHOLD || items.length === 0 ? 0 : 80;
  const total = Math.max(0, cartSubtotal + shipping);

  const [recommended, setRecommended] = useState<Product[]>([]);
  useEffect(() => {
    fetch("/api/products?limit=10")
      .then((r) => r.json())
      .then(({ products }) => {
        const inCartIds = new Set(cart.map((it) => it.id));
        setRecommended((products ?? []).filter((p: Product) => !inCartIds.has(p.id)).slice(0, 6));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-20 lg:py-24">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary sm:size-20 lg:mb-6 lg:size-[88px]">
            <ShoppingBag
              className="size-7 text-muted-foreground sm:size-8 lg:size-9"
              strokeWidth={1.4}
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Your cart is empty</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground lg:text-sm">
            Add a few favourites and we&apos;ll get them on their way.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:opacity-90 lg:h-11 lg:px-7"
          >
            Continue shopping <ArrowRight className="size-4" />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        centered
        color="oklch(0.96 0 0)"
        title="Shopping cart"
        subtitle="Review your items, adjust quantities, and continue to checkout when you are ready."
        crumbs={[{ label: "Home", to: "/" }, { label: "Cart" }]}
      />

      <div className="min-h-screen bg-secondary/25 pb-8 md:pb-10">
        {/* Mobile: max 480px, centered, px-4, gap-3.  Desktop (lg+): 12-col grid. */}
        <div className="mx-auto w-full max-w-[480px] px-4 py-4 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:items-start lg:gap-7 lg:px-6 lg:py-8">
          {/* ── Main column (items + mobile summary) ───────────────────────── */}
          <main className="flex flex-col gap-3 lg:col-span-7 lg:gap-6">
            {/* Heading + count — sits above items on mobile, inside the panel on desktop is handled visually by the wrapper. */}
            <header className="lg:rounded-2xl lg:border lg:border-border/80 lg:bg-card lg:p-6">
              <h2 className="text-lg font-bold tracking-tight lg:text-xl">Your items</h2>
              <p className="mt-0.5 text-xs text-muted-foreground lg:mt-1 lg:text-[13px]">
                {items.length} product{items.length !== 1 ? "s" : ""} in cart
              </p>

              {/* Items list — horizontal cards on mobile, same structure scales up on desktop. */}
              <ul className="mt-3 flex flex-col gap-3 lg:mt-5 lg:gap-4">
                {items.map((it) => {
                  const origPrice = Math.round(it.p.price * 1.45);
                  return (
                    <li
                      key={it.id + (it.size ?? "")}
                      className="
                        flex gap-3 rounded-[14px] border border-border/60 bg-card p-3
                        shadow-[0_1px_3px_oklch(0_0_0/0.04)]
                        lg:gap-4 lg:rounded-xl lg:border-border/70 lg:bg-background lg:p-4 lg:shadow-none
                      "
                    >
                      {/* Image — 60×60 mobile, 96 desktop. Image left, details right. */}
                      <Link
                        href={`/product/${it.id}`}
                        className="size-[60px] shrink-0 overflow-hidden rounded-xl bg-secondary lg:size-24"
                      >
                        <img
                          src={it.p.image}
                          alt={it.p.name}
                          className="size-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 lg:gap-3">
                        {/* Row 1 — name / variant + close button */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/product/${it.id}`}
                              className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors hover:text-accent lg:text-[15px]"
                            >
                              {it.p.name}
                            </Link>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">
                              {it.size ? `Size: ${it.size}` : it.p.category}
                            </p>
                          </div>
                          {/* Close button — replaces the 2-icon row from the desktop card, kept compact on mobile */}
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(it.id);
                              toast("Item removed");
                            }}
                            className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-accent lg:hidden"
                            aria-label="Remove"
                          >
                            <X className="size-[15px]" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Row 2 — price (18px bold) + quantity pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <Price amount={it.p.price * it.qty} size="lg" className="!font-bold" />
                            <Price
                              amount={origPrice * it.qty}
                              size="xs"
                              muted
                              struck
                              className="hidden sm:inline-flex"
                            />
                          </div>

                          {/* Quantity pill — rounded-full, -/+ buttons, 14px label */}
                          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/60 px-1 py-1">
                            <button
                              type="button"
                              onClick={() => setQty(it.id, it.qty - 1)}
                              disabled={it.qty <= 1}
                              className="qty-btn flex size-7 items-center justify-center rounded-full text-foreground hover:bg-background disabled:opacity-30"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5" strokeWidth={2.5} />
                            </button>
                            <span className="min-w-6 text-center text-sm font-semibold tabular-nums">
                              {it.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(it.id, it.qty + 1)}
                              className="qty-btn flex size-7 items-center justify-center rounded-full text-foreground hover:bg-background"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        {/* Desktop-only secondary actions row (save for later) */}
                        <div className="hidden items-center gap-2 border-t border-border/70 pt-2 lg:flex">
                          <button
                            type="button"
                            onClick={() => {
                              toggleWishlist(it.id);
                              removeFromCart(it.id);
                              toast("Saved for later");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label="Save for later"
                          >
                            <Heart className="size-3.5" strokeWidth={1.75} /> Save for later
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(it.id);
                              toast("Item removed");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-accent"
                            aria-label="Remove"
                          >
                            <X className="size-3.5" strokeWidth={1.75} /> Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </header>

            {/* ── Mobile order summary card — subtotal, total, full-width CTA ─ */}
            <section
              className="
                rounded-[14px] border border-border/60 bg-card p-4
                shadow-[0_1px_3px_oklch(0_0_0/0.04)]
                lg:hidden
              "
              aria-label="Order summary"
            >
              <h2 className="text-base font-bold tracking-tight">Order summary</h2>

              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <Price amount={cartSubtotal} size="sm" className="!font-semibold" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-sm font-semibold text-foreground">Free</span>
                  ) : (
                    <Price amount={shipping} size="sm" className="!font-semibold" />
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-border/70 pt-3">
                <span className="text-base font-bold tracking-tight">Total</span>
                {/* Total — 20px bold per spec */}
                <Price amount={total} size="xl" className="!font-bold" />
              </div>

              <Link
                href="/checkout"
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.99]"
              >
                <Lock className="size-4" strokeWidth={2.25} />
                Proceed to checkout
              </Link>

              <Link
                href="/"
                className="mt-2 block text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Continue shopping
              </Link>
            </section>
          </main>

          {/* Order summary — desktop sidebar (unchanged) */}
          <aside className="hidden lg:sticky lg:top-24 lg:col-span-5 lg:flex lg:flex-col lg:gap-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6">
              <h2 className="text-xl font-bold tracking-tight">Order summary</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Shipping finalized at checkout.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <Price amount={cartSubtotal} size="md" className="!font-semibold" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shipping</span>
                  {shipping === 0 ? (
                    <span className="text-sm font-semibold text-foreground">Free</span>
                  ) : (
                    <Price amount={shipping} size="md" className="!font-semibold" />
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
                <span className="text-base font-bold tracking-tight">Total</span>
                <Price
                  amount={total}
                  size="lg"
                  className="!font-bold lg:!text-xl"
                  symbolClassName="lg:!text-base"
                />
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href="/checkout"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition hover:opacity-90 active:scale-[0.99]"
                >
                  <Lock className="size-4" strokeWidth={2.25} /> Proceed to checkout
                </Link>
                <Link
                  href="/"
                  className="text-center text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* ── Quality / trust banner ──────────────────────────────────────── */}
        {/* <QualityBanner /> */}

        {/* ── You may also like (full-width, after the trust banner) ──── */}
        {recommended.length > 0 && (
          <section className="mx-auto w-full max-w-7xl px-4 pb-10 lg:px-6 lg:pb-14">
            <div className="mb-4 flex items-end justify-between gap-3 lg:mb-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight lg:text-2xl">You may also like</h2>
                <p className="mt-1 text-xs text-muted-foreground lg:text-sm">
                  Hand-picked recommendations based on your cart.
                </p>
              </div>
              <Link
                href="/"
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-foreground/80 underline-offset-4 hover:text-foreground hover:underline sm:inline-flex"
              >
                See all <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </div>

            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar sm:gap-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
              {recommended.slice(0, 4).map((p) => (
                <div key={p.id} className="w-42 shrink-0 sm:w-48 lg:w-auto">
                  <ProductCard p={p} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

/* ── Quality is our priority — curved-pocket trust banner ──────────────── */
const QUALITY_FEATURES: {
  icon: typeof Truck;
  title: string;
  desc: string;
}[] = [
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "Enjoy the convenience of free shipping on every order.",
  },
  {
    icon: Headphones,
    title: "24×7 Support",
    desc: "Round-the-clock assistance, anytime you need it.",
  },
  {
    icon: RotateCcw,
    title: "30 Days Return",
    desc: "Your satisfaction is our priority. Return any product within 30 days.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    desc: "Seamless shopping backed by safe and secure payment options.",
  },
];

function QualityBanner() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-2 lg:px-6 lg:pb-12 lg:pt-4">
      <div className="relative overflow-hidden rounded-3xl bg-secondary/70">
        {/* White curved title pocket */}
        <div
          className="
            absolute left-1/2 top-0 z-10 -translate-x-1/2
            w-[min(86%,560px)]
            bg-background
            px-6 pb-7 pt-4 text-center
            lg:pb-9 lg:pt-5
          "
          style={{
            borderBottomLeftRadius: "50% 100%",
            borderBottomRightRadius: "50% 100%",
          }}
        >
          <h2 className="text-lg font-bold tracking-tight sm:text-xl lg:text-[22px]">
            Quality is our priority
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground lg:text-sm">
            Because you deserve nothing less than the best.
          </p>
        </div>

        {/* Spacer reserving space for the title pocket overlap */}
        <div className="h-[108px] lg:h-[132px]" aria-hidden />

        {/* Feature cards grid */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-6 lg:grid-cols-4 lg:gap-4 lg:px-7 lg:pb-9">
          {QUALITY_FEATURES.map((f) => (
            <div
              key={f.title}
              className="
                group flex flex-col items-center rounded-2xl border border-border/60 bg-background
                px-4 py-5 text-center
                shadow-[0_1px_3px_oklch(0_0_0/0.04)]
                transition-all duration-300 ease-out
                hover:-translate-y-[2px]
                hover:shadow-[0_12px_28px_-16px_oklch(0_0_0/0.12)]
                lg:px-6 lg:py-7
              "
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-red-50 transition-transform duration-300 group-hover:scale-[1.06] lg:mb-4 lg:size-14">
                <f.icon className="size-[20px] text-red-600 lg:size-6" strokeWidth={2} />
              </div>
              <p className="text-[13px] font-bold leading-snug lg:text-[15px]">{f.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground lg:mt-1.5 lg:text-[13px]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CartPage;
