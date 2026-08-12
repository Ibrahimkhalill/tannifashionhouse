"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Product } from "./ProductCard";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Price } from "@/components/site/Price";

function useCountdown(target: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return { h: null, m: null, s: null };
  const diff = Math.max(0, target - now);
  return {
    h: Math.floor(diff / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1000),
  };
}

function Cell({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white text-black flex items-center justify-center text-base sm:text-lg font-bold tabular-nums shadow-sm">
        {value === null ? "--" : String(value).padStart(2, "0")}
      </div>
      <span className="mt-1.5 text-[10px] font-medium uppercase tracking-widest text-white/55 sm:text-[11px]">{label}</span>
    </div>
  );
}

function DealCard({ p }: { p: Product }) {
  const { addToCart } = useStore();
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <Link
      href={`/product/${p.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/10 transition hover:bg-white/15"
    >
      <div className="relative aspect-square overflow-hidden bg-white/5">
        {discount > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">
            -{discount}%
          </span>
        )}
        <img src={p.image} alt={p.name} className="size-full max-h-full max-w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="flex flex-col gap-1.5 p-3.5 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/55 sm:text-xs">{p.category}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white sm:text-[0.9375rem]">{p.name}</h3>
        <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Price amount={p.price} size="sm" tone="inherit" className="min-w-0 text-white sm:!text-base" symbolClassName="text-white/70" />
            {p.oldPrice && <Price amount={p.oldPrice} size="xs" tone="inherit" struck className="min-w-0 !text-[10px] text-white/40" />}
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); addToCart(p.id, { size: p.sizes[0] }); toast.success("Added to cart"); }}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:scale-110"
          >
            <ShoppingCart className="size-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
}

export function OffersSection() {
  const target = useState(() => Date.now() + 1000 * 60 * 60 * 12)[0];
  const { h, m, s } = useCountdown(target);
  const [deals, setDeals] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?sort=hl&limit=20")
      .then((r) => r.json())
      .then(({ products }) => setDeals((products ?? []).filter((p: Product) => p.oldPrice).slice(0, 4)))
      .catch(() => setDeals([]));
  }, []);

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl overflow-x-clip px-4 py-10 sm:py-12">
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl bg-black text-white sm:rounded-3xl">
        <div className="flex min-w-0 flex-col gap-4 border-b border-white/10 px-5 pb-5 pt-6 sm:flex-row sm:items-center sm:gap-8 sm:px-10 sm:pb-8 sm:pt-10">
          <div className="min-w-0 flex-1">
            <span className="mb-3 inline-block rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white sm:text-xs">Limited time</span>
            <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-[2rem] lg:text-4xl">
              Mega deals —<br className="sm:hidden" /> up to <span className="text-accent">50% OFF</span>
            </h2>
            <p className="mt-2 max-w-sm text-[0.9375rem] leading-relaxed text-white/65 sm:text-sm">Hand-picked offers refreshed daily.</p>
          </div>
          <div className="flex min-w-0 items-end gap-2 sm:gap-3">
            <Cell value={h} label="Hrs" />
            <span className="text-xl text-white/30 pb-5">:</span>
            <Cell value={m} label="Min" />
            <span className="text-xl text-white/30 pb-5">:</span>
            <Cell value={s} label="Sec" />
          </div>
        </div>
        <div className="min-w-0 p-4 sm:p-8">
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {deals.map((p) => <DealCard key={p.id} p={p} />)}
          </div>
          <Link href="/search" className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-white/70 hover:text-white transition">
            View all deals <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
