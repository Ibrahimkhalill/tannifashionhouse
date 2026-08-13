"use client";

import { useState } from "react";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Price } from "./Price";

export type Product = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  brand: string;
  /** Fabric / build — compare & detail */
  material?: string;
  sizes: string[];
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  colorImages?: string[];
  badge?: { label: string; tone: "new" | "sale" | "trending" };
  colors: string[];
  liked?: boolean;
  /** Available quantity; undefined = not tracked */
  stock?: number;
};

/**
 * Strict 3-color palette (black / white / red).
 *  - new      → solid black pill
 *  - sale     → solid red pill
 *  - trending → soft white outline pill (premium, neutral)
 */
const toneClass: Record<NonNullable<Product["badge"]>["tone"], string> = {
  new:      "bg-foreground text-background",
  sale:     "bg-accent text-accent-foreground",
  trending: "bg-background/95 text-foreground border border-border backdrop-blur-sm",
};

export function ProductCard({ p }: { p: Product }) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const router = useRouter();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const liked = wishlist.includes(p.id);
  const [hoveredColor, setHoveredColor] = useState<number | null>(null);
  const [cardHovered, setCardHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // On card hover: show second image (images[1]). On color dot hover: show that color's image.
  const hoverImage = hoveredColor !== null && p.colorImages?.[hoveredColor]
    ? p.colorImages[hoveredColor]
    : (p.images?.[1] ?? p.image);
  const displayImage = (cardHovered || hoveredColor !== null) ? hoverImage : p.image;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(p.id, { size: p.sizes[0] });
    toast.success("Added to cart", { description: p.name });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p.id);
    toast(liked ? "Removed from wishlist" : "Saved to wishlist");
  };

  return (
    <article
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => { setCardHovered(false); setHoveredColor(null); }}
      className="
        group relative flex h-full flex-col overflow-hidden
        rounded-lg border border-border/70 bg-card
        transition-all duration-300 ease-out
        hover:-translate-y-[3px] hover:border-border
        [box-shadow:0_1px_2px_-1px_oklch(0_0_0/0.04)]
        hover:[box-shadow:0_22px_44px_-22px_oklch(0_0_0/0.14)]
      "
    >
      {/* ── Image (fixed 1:1 ratio across all cards) ───────────────────── */}
      <Link
        href={`/product/${p.id}`}
        aria-label={p.name}
        className="relative block aspect-square w-full overflow-hidden bg-secondary/60"
      >
        {/* Shimmer placeholder until the primary image finishes loading */}
        {!imgLoaded && <span aria-hidden className="skeleton-shimmer absolute inset-0 rounded-none" />}

        {/* Second image fades in on hover */}
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          width={800}
          height={800}
          // ref covers images already loaded before hydration (onLoad won't fire then)
          ref={(el) => { if (el?.complete && el.naturalWidth > 0) setImgLoaded(true); }}
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: cardHovered || hoveredColor !== null ? 0 : imgLoaded ? 1 : 0 }}
        />
        <img
          src={displayImage}
          alt={p.name}
          loading="lazy"
          width={800}
          height={800}
          className="absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: cardHovered || hoveredColor !== null ? 1 : 0 }}
        />

        {/* Badge stack — vertical, top-left. Never collides with wishlist. */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col items-start gap-1 lg:left-3 lg:top-3 lg:gap-1.5">
          {p.badge && (
            <span
              className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] shadow-[0_1px_3px_oklch(0_0_0/0.08)] lg:h-[26px] lg:px-3 lg:text-xs ${toneClass[p.badge.tone]}`}
            >
              {p.badge.label}
            </span>
          )}
          {discount > 0 && (
            <span className="inline-flex h-6 items-center rounded-md bg-accent px-2 text-[11px] font-bold text-accent-foreground shadow-[0_1px_3px_oklch(0_0_0/0.08)] lg:h-[26px] lg:px-2.5 lg:text-xs">
              −{discount}%
            </span>
          )}
        </div>

        {/* Action icons — stacked right, slide in on hover */}
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-2 lg:right-3 lg:top-3">
          {[
            {
              label: liked ? "Remove from wishlist" : "Add to wishlist",
              icon: <Heart className={`size-3.75 lg:size-4 transition-transform duration-200 ${liked ? "fill-current scale-110" : ""}`} strokeWidth={2} />,
              onClick: handleLike,
              active: liked,
              delay: "delay-0",
            },
            {
              label: "Quick view",
              icon: <Eye className="size-3.75 lg:size-4" strokeWidth={2} />,
              onClick: (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); router.push(`/product/${p.id}`); },
              active: false,
              delay: "delay-150",
            },
          ].map(({ label, icon, onClick, active, delay }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              className={`
                inline-flex size-9 items-center justify-center rounded-full lg:size-10
                border border-border/40 bg-background/90 backdrop-blur-md
                shadow-[0_1px_3px_oklch(0_0_0/0.08)]
                transition-all duration-200 ease-out ${delay}
                translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100
                hover:scale-110 hover:bg-background hover:shadow-[0_4px_12px_-4px_oklch(0_0_0/0.15)]
                active:scale-95
                ${active ? "text-accent" : "text-foreground/70 hover:text-accent"}
              `}
            >
              {icon}
            </button>
          ))}
        </div>
      </Link>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3.5 lg:p-4">
        {/* Category — 11/12px uppercase */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:text-xs">
          {p.category}
          {p.brand ? (
            <>
              {" "}
              <span className="font-normal normal-case tracking-normal text-muted-foreground/80">· {p.brand}</span>
            </>
          ) : null}
        </p>

        {/* Title — 14px mobile / 16px desktop, font-medium per spec.
            min-height locks 2 lines worth so every card aligns. */}
        <Link href={`/product/${p.id}`} className="mt-1">
          <h3
            className="
              line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug
              text-foreground transition-colors hover:text-accent
              lg:min-h-[2.75rem] lg:text-base
            "
          >
            {p.name}
          </h3>
        </Link>

        {/* Color variants — same box for all swatches (no ring-offset: white looked larger) */}
        <div className="mt-2 flex h-4 items-center gap-1.5 lg:mt-2.5 lg:h-[18px]">
          {p.colors.slice(0, 5).map((c, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{ background: c }}
             
              className={`box-border size-4 shrink-0 rounded-full border transition-all duration-200 lg:size-4.5 ${hoveredColor === i ? "border-foreground scale-110" : "border-border/80 group-hover:border-border"}`}
            />
          ))}
        </div>

        {/* Price + CTA pinned to bottom for perfect baseline alignment grid-wide */}
        <div className="mt-auto pt-3 lg:pt-3.5">
          <div className="flex items-baseline gap-2">
            <Price
              amount={p.price}
              size="md"
              className="!font-bold lg:!text-lg"
              symbolClassName="lg:!text-[0.88rem]"
            />
            {p.oldPrice && (
              <Price
                amount={p.oldPrice}
                size="xs"
                muted
                struck
                className="lg:!text-sm"
                symbolClassName="lg:!text-[0.65rem]"
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="
              mt-3 flex h-10 w-full items-center justify-center gap-1.5
              rounded-full border border-slate-200 bg-white text-sm font-semibold tracking-tight text-foreground
              transition-all duration-200 ease-out
              hover:border-accent hover:bg-accent hover:text-white
              active:scale-[0.98] lg:h-11
            "
          >
            <ShoppingCart className="size-4" strokeWidth={2} />
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
