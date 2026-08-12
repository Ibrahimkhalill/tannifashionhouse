"use client";

import Link from "next/link";
import { Layout } from "@/components/site/Layout";
import { PageHeader } from "@/components/site/PageHeader";
import { useStore } from "@/lib/store";
import {
  Heart, ShoppingCart, X, ArrowRight,
  Trash2, ShoppingBag, Star, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Price } from "@/components/site/Price";
import { useProductCache } from "@/hooks/useProductCache";

function WishlistPage() {
  const router = useRouter();
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [removed, setRemoved] = useState<string[]>([]);
  const productCache = useProductCache(wishlist);

  const items = wishlist
    .filter((id) => !removed.includes(id))
    .map((id) => productCache[id])
    .filter(Boolean);

  const total    = items.reduce((s, p) => s + p.price, 0);
  const savings  = items.reduce((s, p) => s + (p.oldPrice ? p.oldPrice - p.price : 0), 0);

  const handleRemove = (id: string) => {
    setRemoved((r) => [...r, id]);
    setTimeout(() => toggleWishlist(id), 350);
    toast("Removed from wishlist");
  };

  const moveAllToCart = () => {
    items.forEach((p) => addToCart(p.id, { size: p.sizes[0] }));
    toast.success(`${items.length} items added to cart`);
  };

  const clearAll = () => {
    items.forEach((p) => handleRemove(p.id));
  };

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-4 py-28 text-center animate-fade-up">
          <div className="relative mx-auto size-32 mb-8">
            <div className="absolute inset-0 rounded-full bg-accent/10 animate-pulse" />
            <div className="relative size-32 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center">
              <Heart className="size-14 text-accent/40" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Nothing saved yet</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {"Tap the heart on any product to save it here. We'll keep your favourites safe."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-8 h-12 px-8 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition group"
          >
            <ShoppingBag className="size-4" />
            Start shopping
            <ArrowRight className="size-4 group-hover:translate-x-1 transition" />
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
        title="Your Wishlist"
        subtitle="Explore your saved favorites, manage your wishlist effortlessly, and keep track of the items you love most."
        crumbs={[{ label: "Home", to: "/" }, { label: "Wishlist" }]}
        actions={
          <>
            
            <button onClick={clearAll} className="h-10 px-5 rounded-full border text-xs font-medium inline-flex items-center gap-1.5 hover:border-accent hover:text-accent transition">
              <Trash2 className="size-3.5" /> Clear all
            </button>
            <button onClick={moveAllToCart} className="h-9 px-4 rounded-full bg-accent text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition shadow-sm">
              <ShoppingCart className="size-3.5" /> Add all to cart
            </button>
          </>
        }
      />

      {/* ── Product grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
          {items.map((p, i) => {
            const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
            const isRemoving = removed.includes(p.id);
            return (
              <article
                key={p.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className={`group relative flex flex-col rounded-lg border bg-card overflow-hidden transition-all duration-300 animate-fade-up ${
                  isRemoving ? "opacity-0 scale-95 pointer-events-none" : "hover:-translate-y-1 hover:shadow-xl hover:border-foreground/20"
                }`}
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(p.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2.5 right-2.5 z-10 size-7 rounded-full bg-background/90 backdrop-blur border flex items-center justify-center text-muted-foreground hover:text-accent hover:border-accent transition"
                >
                  <X className="size-3.5" />
                </button>

                {/* Discount badge */}
                {discount > 0 && (
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="rounded-full bg-accent text-white text-[10px] font-bold px-2 py-0.5">
                      -{discount}%
                    </span>
                  </div>
                )}

                {/* Image */}
                <Link href={`/product/${p.id}`} className="block aspect-square overflow-hidden bg-secondary shrink-0">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </Link>

                {/* Info */}
                <div className="flex flex-col flex-1 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
                  <Link
                    href={`/product/${p.id}`}
                    className="mt-0.5 text-[13px] font-semibold leading-snug line-clamp-1 hover:text-accent transition"
                  >
                    {p.name}
                  </Link>

                  {/* Star placeholder */}
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={`size-3.5 ${n <= 4 ? "fill-amber-400 text-amber-400" : "fill-border text-border"}`} />
                    ))}
                    <span className="text-[11px] text-muted-foreground ml-0.5">4.0</span>
                  </div>

                  {/* Color swatches */}
                  <div className="mt-2 flex items-center gap-1">
                    {p.colors.map((c, idx) => (
                      <span key={idx} className="box-border size-3.5 shrink-0 rounded-full border border-border" style={{ background: c }} />
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <Price amount={p.price} size="sm" className="font-black!" />
                      {p.oldPrice && (
                        <Price amount={p.oldPrice} size="xs" muted struck className="text-[10px]!" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Buy now */}
                      <button
                        onClick={() => { addToCart(p.id, { size: p.sizes[0] }); toast.success("Added!", { description: p.name }); }}
                        aria-label="Add to cart"
                        className="size-8 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-accent transition"
                      >
                        <ShoppingCart className="size-3.5" />
                      </button>
                      <button
                        onClick={() => { addToCart(p.id, { size: p.sizes[0] }); router.push("/checkout"); }}
                        aria-label="Buy now"
                        className="size-8 rounded-full bg-accent text-white flex items-center justify-center hover:opacity-80 transition"
                      >
                        <Zap className="size-3.5 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom summary bar */}
       
      </div>
    </Layout>
  );
}

export default WishlistPage;
