"use client";

import Link from "next/link";
import { X, Minus, Plus, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Price } from "./Price";
import { useProductCache } from "@/hooks/useProductCache";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, setQty, removeFromCart, cartSubtotal, cartCount } = useStore();
  const productCache = useProductCache(cart.map((it) => it.id));
  const { lang } = useT();

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const ship = cartSubtotal > 1500 || cartSubtotal === 0 ? 0 : 80;
  const total = cartSubtotal + ship;

  return (
    <div
      className={cn("fixed inset-0 z-[60]", lang === "bn" && "font-bn")}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      />

      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right duration-300 sm:max-w-[420px]"
        role="dialog"
        aria-label="Shopping cart"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">Your cart</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground sm:text-sm">
              {cartCount} {cartCount === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-6 flex size-[5.5rem] items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary">
                <ShoppingCart className="size-9 text-muted-foreground" strokeWidth={1.4} />
              </div>
              <p className="text-lg font-bold tracking-tight">Your cart is empty</p>
              <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                Browse products and add items you love — they will appear here.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 flex h-11 items-center justify-center rounded-full bg-foreground px-8 text-sm font-semibold text-background transition hover:opacity-90"
              >
                Start shopping
              </button>
            </div>
          ) : (
            cart.map((it) => {
              const p = productCache[it.id];
              if (!p) return null;
              const origPrice = Math.round(p.price * 1.45);

              return (
                <div
                  key={it.id + (it.size ?? "")}
                  className="flex gap-3.5 rounded-2xl border border-border/90 bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/product/${p.id}`}
                    onClick={onClose}
                    className="relative block size-[5.25rem] shrink-0 overflow-hidden rounded-xl border border-border/60 bg-secondary sm:size-24"
                  >
                    <img src={p.image} alt={p.name} className="size-full object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/product/${p.id}`}
                        onClick={onClose}
                        className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-foreground transition-colors hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(it.id)}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove"
                      >
                        <Trash2 className="size-3.5" strokeWidth={2} />
                      </button>
                    </div>

                    {it.size && (
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        Size: <span className="font-medium text-foreground">{it.size}</span>
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                      <div className="flex items-baseline gap-2">
                        <Price amount={p.price * it.qty} size="sm" />
                        <Price amount={origPrice * it.qty} size="xs" muted struck />
                      </div>

                      <div className="flex items-center overflow-hidden rounded-full border border-border bg-secondary">
                        <button
                          type="button"
                          onClick={() => setQty(it.id, it.qty - 1)}
                          disabled={it.qty <= 1}
                          className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-background disabled:opacity-30"
                          aria-label="Decrease"
                        >
                          <Minus className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <span className="min-w-7 text-center text-xs font-bold tabular-nums">{it.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(it.id, it.qty + 1)}
                          className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-background"
                          aria-label="Increase"
                        >
                          <Plus className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <footer className="shrink-0 space-y-4 border-t border-border bg-card/95 px-5 py-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Subtotal</span>
              <Price amount={cartSubtotal} size="md" />
            </div>
            {ship > 0 && (
              <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                <span>Shipping (est.)</span>
                <Price amount={ship} size="xs" tone="inherit" />
              </div>
            )}
            <div className="flex gap-3">
              <Link
                href="/cart"
                onClick={onClose}
                className="flex h-12 flex-1 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-secondary"
              >
                View cart
              </Link>
              <Link
                href="/checkout"
                onClick={onClose}
                className="inline-flex h-12 flex-[1.35] items-center justify-center gap-2 rounded-full bg-foreground text-sm font-semibold text-background shadow-md transition hover:opacity-90"
              >
                Checkout
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
