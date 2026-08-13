"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product } from "./ProductCard";
import { cachedJson } from "@/lib/api-cache";

// Shows every product (newest first) — so normal products (not featured/trending)
// still appear on the homepage without the customer having to search.
export function NewArrivals() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cachedJson<{ products: Product[] }>("/api/products?sort=new&limit=10")
      .then(({ products }) => setItems(products ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-10 lg:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Just in</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl lg:text-[2rem]">New Arrivals</h2>
        </div>
        <Link href="/category/fashion" className="text-sm font-semibold text-muted-foreground transition hover:text-foreground">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
            ))
          : items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}
