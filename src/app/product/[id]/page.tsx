"use client";

import Link from "next/link";
import { Layout } from "@/components/site/Layout";
import type { Product } from "@/components/site/ProductCard";
import { ProductCard } from "@/components/site/ProductCard";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Star,
  Share2,
  Zap,
  Check,
  Package,
  MessageSquare,
  ChevronDown,
  BadgeCheck,
  ArrowLeftRight,
  HelpCircle,
  Ruler,
  Clock,
  X,
  ImagePlus,
  Smile,
  Frown,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Price } from "@/components/site/Price";
import { SizeGuideModal } from "@/components/site/SizeGuideModal";
import { colorLabelFromHex } from "@/lib/product-filters";
import { DEFAULT_SHIPPING_POLICY, type ShippingPolicy } from "@/lib/shipping-policy";
import { cachedJson } from "@/lib/api-cache";

// Review shape the JSX renders (flattened from the API response).
type UiReview = {
  id: string; user: string; rating: number; text: string; createdAt: number;
  verified: boolean; images: string[];
  replies: { id: string; user: string; text: string; createdAt: number }[];
};

type ApiReview = {
  id: string; rating: number; text: string; images: string[]; verified: boolean;
  createdAt: string; guestName: string | null;
  user: { id: string; name: string } | null;
  replies: { id: string; userName: string; text: string; createdAt: string }[];
};

function mapReview(r: ApiReview): UiReview {
  return {
    id: r.id,
    user: r.user?.name ?? r.guestName ?? "Guest",
    rating: r.rating,
    text: r.text,
    createdAt: new Date(r.createdAt).getTime(),
    verified: r.verified,
    images: r.images ?? [],
    replies: (r.replies ?? []).map((rep) => ({
      id: rep.id, user: rep.userName, text: rep.text, createdAt: new Date(rep.createdAt).getTime(),
    })),
  };
}

function StarsRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const s = size === "lg" ? "size-5" : "size-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${s} ${n <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-border text-border"}`}
        />
      ))}
    </div>
  );
}

function pseudoSku(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return String(500000 + (n % 900000));
}

type ApiProduct = Product & {
  description?: string; material?: string; categoryName?: string; dbId?: string;
  metaDesc?: string; sku?: string; soldCount?: number;
};

function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const [p, setP]           = useState<ApiProduct | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    cachedJson<{ product?: ApiProduct }>(`/api/products/${id}`)
      .then((data) => {
        const prod = (data.product ?? data) as ApiProduct;
        if (!prod) { setP(null); return; }
        setP(prod);
        // Fetch related from same category
        const cat = prod.category;
        if (cat) {
          cachedJson<{ products: Product[] }>(`/api/products?category=${cat}&limit=6`)
            .then(({ products }) => setRelated((products ?? []).filter((x: Product) => x.id !== id).slice(0, 5)))
            .catch(() => {});
        }
      })
      .catch(() => setP(null));
  }, [id]);

  const {
    addToCart,
    toggleWishlist,
    wishlist,
    user,
    compareList,
    addToCompare,
    removeFromCompare,
    openAuthModal,
  } = useStore();
  const router = useRouter();
  const [size, setSize] = useState<string | undefined>(undefined);
  useEffect(() => { if (p?.sizes[0]) setSize(p.sizes[0]); }, [p]);
  const [color, setColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [tab, setTab] = useState<"desc" | "shipping">("desc");
  const [reviewSort, setReviewSort] = useState<"recent" | "oldest" | "high" | "low">("recent");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const reviewFileRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState({ active: false, x: 0, y: 0 });
  const [thumb, setThumb] = useState(0);
  const [added, setAdded] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<number | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  // Selected color pins its image until another image is chosen
  const [colorOverride, setColorOverride] = useState<string | null>(null);
  const [stock, setStock] = useState<number | null>(null);
  useEffect(() => { if (p?.stock !== undefined) setStock(p.stock ?? null); }, [p]);
  // Gallery autoplay — pauses while zooming or hovering a color swatch
  const totalThumbs = Math.max(1, p?.images?.length ?? 1);
  useEffect(() => {
    if (zoom.active || hoveredColor !== null) return;
    const t = setInterval(() => {
      setColorOverride(null);
      setThumb((v) => (v + 1) % totalThumbs);
    }, 4000);
    return () => clearInterval(t);
  }, [zoom.active, hoveredColor, totalThumbs]);
  const imgRef = useRef<HTMLDivElement>(null);

  // Reviews come from the real API; map to the render shape the JSX expects.
  const [productReviews, setProductReviews] = useState<UiReview[]>([]);
  const loadReviews = useCallback(() => {
    if (!id) return;
    fetch(`/api/reviews?productId=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((d) => setProductReviews((d.reviews ?? []).map(mapReview)))
      .catch(() => {});
  }, [id]);
  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Can the current user review? Real buyers only — server-checked (delivered order).
  const [reviewEligibility, setReviewEligibility] =
    useState<{ eligible: boolean; purchased: boolean; alreadyReviewed: boolean } | null>(null);
  const loadEligibility = useCallback(() => {
    if (!id) return;
    fetch(`/api/reviews/eligibility?productId=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReviewEligibility(d))
      .catch(() => setReviewEligibility({ eligible: false, purchased: false, alreadyReviewed: false }));
  }, [id]);
  useEffect(() => { loadEligibility(); }, [loadEligibility, user]);

  // Shipping & returns policy — admin-editable, read from the public endpoint.
  const [shippingPolicy, setShippingPolicy] = useState<ShippingPolicy>(DEFAULT_SHIPPING_POLICY);
  useEffect(() => {
    fetch("/api/shipping-policy")
      .then((r) => r.json())
      .then((d) => { if (d.policy) setShippingPolicy(d.policy); })
      .catch(() => {});
  }, []);

  // Admin-defined colour names (hex → name) so swatches show the real names set in
  // Attributes → Colors, not a hardcoded guess ("Classic").
  const [colorNames, setColorNames] = useState<Record<string, string>>({});
  useEffect(() => {
    cachedJson<{ colors: { name: string; hex: string }[] }>("/api/colors")
      .then(({ colors }) => {
        const m: Record<string, string> = {};
        (colors ?? []).forEach((c) => { if (c.hex) m[c.hex.toLowerCase()] = c.name; });
        setColorNames(m);
      })
      .catch(() => {});
  }, []);

  const sortedReviews = useMemo(() => {
    const list = [...productReviews];
    if (reviewSort === "recent") list.sort((a, b) => b.createdAt - a.createdAt);
    else if (reviewSort === "oldest") list.sort((a, b) => a.createdAt - b.createdAt);
    else if (reviewSort === "high") list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => a.rating - b.rating);
    return list;
  }, [productReviews, reviewSort]);
  const avg = productReviews.length
    ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
    : 0;

  // Loading state
  if (p === undefined) {
    return (
      <Layout>
        <div className="mx-auto max-w-7xl px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-4 pt-4">
            <div className="h-8 w-3/4 rounded-xl bg-muted" />
            <div className="h-6 w-1/3 rounded-xl bg-muted" />
            <div className="h-12 w-1/2 rounded-xl bg-muted" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!p) { notFound(); return null; }

  // Prefer the admin's colour name for this hex; fall back to a sensible guess.
  const colorName = (hex: string) => colorNames[(hex ?? "").toLowerCase()] ?? colorLabelFromHex(hex);

  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  // Real admin-authored rich description (HTML). Empty / blank editor state falls back to generic copy.
  const hasDescription =
    !!p.description && p.description.trim() !== "" && p.description.trim() !== "<p></p>";
  // Short tagline under the price: prefer the SEO meta description, else the first
  // sentence of the rich description with tags stripped. No generic hardcoded copy.
  const shortDesc = (() => {
    if (p.metaDesc?.trim()) return p.metaDesc.trim();
    const plain = (p.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!plain) return "";
    return plain.length > 180 ? plain.slice(0, 180).replace(/\s+\S*$/, "") + "…" : plain;
  })();
  const liked = wishlist.includes(p.id);
  const inCompare = compareList.includes(p.id);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Over an arrow (or any button): suspend zoom so the controls stay usable.
    if ((e.target as HTMLElement).closest("button")) {
      setZoom((z) => (z.active ? { active: false, x: 0, y: 0 } : z));
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setZoom({ active: true, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  // Side-by-side magnifier geometry
  const LENS_SIZE = 38; // % of image — also determines zoom factor (100 / 38 ≈ 2.6×)
  const halfLens = LENS_SIZE / 2;
  const lensCx = Math.max(halfLens, Math.min(100 - halfLens, zoom.x));
  const lensCy = Math.max(halfLens, Math.min(100 - halfLens, zoom.y));
  const lensLeft = lensCx - halfLens;
  const lensTop = lensCy - halfLens;
  const bgX = (lensLeft / (100 - LENS_SIZE)) * 100;
  const bgY = (lensTop / (100 - LENS_SIZE)) * 100;
  const bgSize = (100 / LENS_SIZE) * 100; // ≈ 263%

  const handleAddToCart = () => {
    addToCart(p.id, { qty, size });
    setAdded(true);
    toast.success("Added to cart", { description: `${p.name} × ${qty}` });
    setTimeout(() => setAdded(false), 2000);
  };

  const buyNow = () => {
    addToCart(p.id, { qty, size });
    router.push("/checkout");
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.name, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied!");
      }
    } catch {}
  };

  const handleCompare = () => {
    if (inCompare) {
      removeFromCompare(p.id);
      toast("Removed from compare");
      return;
    }
    if (compareList.length >= 4) {
      toast.error("You can compare up to 4 products");
      return;
    }
    addToCompare(p.id);
    toast.success("Added to compare", { description: "Open compare to see side by side." });
  };

  // Any signed-in user may submit; the server marks it a Verified Purchase
  // only if they actually have a delivered order with this product.
  const canReview = !!user && !!reviewEligibility?.eligible;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      return;
    }
    if (!reviewText.trim()) {
      toast.error("Please write a review");
      return;
    }
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, rating, text: reviewText, images: reviewImages }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Could not post review"); return; }
    setReviewText("");
    setReviewImages([]);
    loadReviews();
    loadEligibility(); // now alreadyReviewed → hides the form
    toast.success("Review posted!");
  };

  const addReviewImages = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 3 - reviewImages.length).forEach((file) => {
      if (!file.type.startsWith("image/")) { toast.error("Only image files allowed"); return; }
      if (file.size > 4 * 1024 * 1024) { toast.error("Image must be under 4 MB"); return; }
      const reader = new FileReader();
      reader.onload = (e) => setReviewImages((imgs) => imgs.length >= 3 ? imgs : [...imgs, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const submitReply = async (reviewId: string) => {
    if (!user) {
      openAuthModal("login");
      return;
    }
    const text = replyText.trim();
    if (!text) {
      toast.error("Please write a reply");
      return;
    }
    const res = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, userName: user.name }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Could not post reply"); return; }
    setReplyText("");
    setReplyingTo(null);
    loadReviews();
    toast.success("Reply posted!");
  };

  const thumbs = p.images && p.images.length > 0 ? p.images : [p.image];
  // Hovering a color previews it; a clicked color shows until the user (or
  // autoplay) picks another image; otherwise the carousel position rules.
  const hoverImage = hoveredColor !== null ? p.colorImages?.[hoveredColor] : null;
  const activeImage = hoverImage ?? colorOverride ?? thumbs[thumb];
  const mainImgLoaded = loadedSrc === activeImage;

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 lg:pt-5 lg:pb-2">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link
            href={`/category/${p.category.toLowerCase()}`}
            className="hover:text-foreground transition"
          >
            {p.category}
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground truncate max-w-48">{p.name}</span>
        </nav>
      </div>

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-5 lg:py-6 grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-10 xl:gap-16 animate-fade-up">
        {/* ── LEFT: Image gallery ── */}
        {/* z-30 ensures the zoom panel beats any stacking contexts created by transforms in the right column */}
        <div className="relative z-30 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-3 lg:flex-row lg:gap-3">
            {/* Vertical thumbnails — lg+ only (hidden when there's just one image) */}
            <div className={`${thumbs.length > 1 ? "hidden lg:flex" : "hidden"} flex-col gap-2 w-[72px] shrink-0 order-2 lg:order-1`}>
              {thumbs.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => { setColorOverride(null); setThumb(i); }}
                  onClick={() => { setColorOverride(null); setThumb(i); }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${i === thumb ? "border-foreground shadow-md scale-[1.03]" : "border-transparent hover:border-border"}`}
                >
                  <img src={img} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main image + horizontal strip */}
            <div className="flex-1 relative min-w-0 order-1 lg:order-2">
              <div
                ref={imgRef}
                onMouseEnter={() => setZoom((z) => ({ ...z, active: true }))}
                onMouseLeave={() => setZoom({ active: false, x: 0, y: 0 })}
                onMouseMove={handleMove}
                className="relative aspect-square rounded-2xl bg-white overflow-hidden border lg:cursor-crosshair"
              >
                {/* Shimmer until the active image is loaded */}
                {!mainImgLoaded && <span aria-hidden className="skeleton-shimmer absolute inset-0" />}

                {/* Base image */}
                <img
                  key={activeImage}
                  src={activeImage}
                  alt={p.name}
                  // ref covers images already loaded before hydration (onLoad won't fire then)
                  ref={(el) => {
                    if (el?.complete && el.naturalWidth > 0) {
                      setLoadedSrc((prev) => (prev === activeImage ? prev : activeImage));
                    }
                  }}
                  onLoad={() => setLoadedSrc(activeImage)}
                  className={`size-full object-contain transition duration-500 ${mainImgLoaded ? "opacity-100" : "opacity-0"}`}
                />

                {/* Rectangular zoom lens — desktop only, follows the cursor */}
                {zoom.active && (
                  <div
                    className="hidden lg:block absolute pointer-events-none rounded-sm border border-foreground/30 bg-foreground/[0.06] backdrop-saturate-50 transition-opacity duration-150"
                    style={{
                      left: `${lensLeft}%`,
                      top: `${lensTop}%`,
                      width: `${LENS_SIZE}%`,
                      height: `${LENS_SIZE}%`,
                      boxShadow: "0 0 0 9999px oklch(0 0 0 / 0.10), 0 2px 8px oklch(0 0 0 / 0.18)",
                      zIndex: 15,
                    }}
                  />
                )}

                {/* Carousel arrows — only with multiple images */}
                {thumbs.length > 1 && (<>
                <button
                  type="button"
                  aria-label="Previous image"
                  onMouseEnter={() => setZoom({ active: false, x: 0, y: 0 })}
                  onClick={() => { setColorOverride(null); setThumb((v) => (v - 1 + thumbs.length) % thumbs.length); }}
                  className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground/80 shadow-sm backdrop-blur transition hover:bg-background hover:text-foreground active:scale-95"
                >
                  <ChevronLeft className="size-4.5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onMouseEnter={() => setZoom({ active: false, x: 0, y: 0 })}
                  onClick={() => { setColorOverride(null); setThumb((v) => (v + 1) % thumbs.length); }}
                  className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 flex size-9 items-center justify-center rounded-full border border-border/60 bg-background/85 text-foreground/80 shadow-sm backdrop-blur transition hover:bg-background hover:text-foreground active:scale-95"
                >
                  <ChevronRight className="size-4.5" />
                </button>
                </>)}

                {/* Image counter — only with multiple images */}
                {thumbs.length > 1 && (
                <span className="absolute bottom-3 right-3 z-10 rounded-full bg-foreground/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-background backdrop-blur-sm">
                  {thumb + 1}/{thumbs.length}
                </span>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discount > 0 && (
                    <span className="rounded-full bg-accent text-white text-[11px] font-bold px-2.5 py-1 shadow-sm">
                      -{discount}%
                    </span>
                  )}
                  {p.badge && (
                    <span className="rounded-full bg-foreground text-background text-[11px] font-bold px-2.5 py-1 shadow-sm">
                      {p.badge.label}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Side-by-side magnifier panel — desktop only ──────────── */}
              {zoom.active && (
                <div
                  aria-hidden
                  className="
                    hidden lg:block absolute top-0 aspect-square pointer-events-none
                    overflow-hidden rounded-2xl border border-border bg-background
                    shadow-[0_24px_60px_-24px_oklch(0_0_0/0.25),0_8px_24px_-12px_oklch(0_0_0/0.10)]
                    animate-in fade-in duration-150
                  "
                  style={{
                    left: "calc(100% + 2.5rem)",
                    width: "100%",
                    backgroundImage: `url(${activeImage})`,
                    backgroundSize: `${bgSize}%`,
                    backgroundPosition: `${bgX}% ${bgY}%`,
                    backgroundRepeat: "no-repeat",
                    zIndex: 30,
                  }}
                />
              )}

              {/* Horizontal thumbnails — tablet & mobile (hidden when there's just one image) */}
              <div className={`${thumbs.length > 1 ? "lg:hidden flex" : "hidden"} justify-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-0.5 pt-1`}>
                {thumbs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setColorOverride(null); setThumb(i); }}
                    aria-label={`Image ${i + 1}`}
                    className={`shrink-0 size-16 sm:size-[72px] rounded-lg sm:rounded-xl overflow-hidden bg-secondary transition-all duration-200 border-2 ${
                      i === thumb
                        ? "border-foreground shadow-sm"
                        : "border-transparent opacity-80 hover:opacity-100 hover:border-border active:scale-[0.97]"
                    }`}
                  >
                    <img src={img} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Product info ── */}
        {/* z-10 keeps any locally-stacked elements (transforms, scales) BELOW the zoom panel */}
        <div className="relative z-10 mt-2 lg:mt-0 flex flex-col">
          {/* Category + brand */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              {p.category}
            </span>
            <span className="text-border">·</span>
            <span className="text-[11px] font-medium text-muted-foreground">{p.brand}</span>
            <span className="text-border">·</span>
            {stock === 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                <BadgeCheck className="size-3.5" strokeWidth={2.25} /> Out of stock
              </span>
            ) : stock !== null && stock <= 10 ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                <BadgeCheck className="size-3.5" strokeWidth={2.25} /> Only {stock} left!
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                <BadgeCheck className="size-3.5" strokeWidth={2.25} /> In stock{stock !== null ? ` · ${stock} available` : ""}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-2 text-[22px] leading-[1.2] font-bold tracking-tight sm:text-[26px] sm:leading-[1.2] lg:text-[30px] lg:leading-tight">
            {p.name}
          </h1>

          {/* Actions row — share / wishlist */}
          <div className="mt-3 flex items-center gap-x-2 gap-y-2 flex-wrap sm:gap-x-2.5">
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={share}
                aria-label="Share"
                className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:border-foreground hover:bg-secondary/60 hover:text-foreground active:scale-95"
              >
                <Share2 className="size-4" strokeWidth={2} />
              </button>
              {/* <button
                type="button"
                onClick={handleCompare}
                aria-label={inCompare ? "Remove from compare" : "Add to compare"}
                aria-pressed={inCompare}
                className={`inline-flex size-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${
                  inCompare
                    ? "border-foreground/40 bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <ArrowLeftRight className="size-4" strokeWidth={2} />
              </button> */}
              <button
                type="button"
                onClick={() => {
                  toggleWishlist(p.id);
                  toast(liked ? "Removed from wishlist" : "Saved to wishlist");
                }}
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={liked}
                className={`inline-flex size-9 items-center justify-center rounded-full border transition-all duration-200 active:scale-95 ${
                  liked
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <Heart
                  className={`size-4 transition-transform ${liked ? "fill-current scale-110" : ""}`}
                  strokeWidth={2}
                />
              </button>
            </div>
          </div>

          {/* Sold + SKU — real data (sold hidden until there are actual sales) */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] sm:text-[13px] text-muted-foreground">
            {(p.soldCount ?? 0) > 0 && (
              <>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Zap className="size-3.5 shrink-0 text-accent" fill="currentColor" />
                  {p.soldCount!.toLocaleString()} sold
                </span>
                <span className="text-border">|</span>
              </>
            )}
            <span>SKU: {p.sku ?? pseudoSku(p.id)}</span>
          </div>

          {/* Price */}
          <div className="mt-4 flex flex-wrap items-baseline gap-2 sm:gap-3">
            <Price
              amount={p.price}
              size="xl"
              tone="inherit"
              className="text-accent !font-black !tracking-tight !text-[26px] sm:!text-[28px] lg:!text-[32px]"
            />
            {p.oldPrice && <Price amount={p.oldPrice} size="md" muted struck />}
            {discount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide bg-red-50 text-red-600 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {shortDesc && (
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              {shortDesc}
            </p>
          )}

          <div className="my-5 h-px w-full bg-border/80 lg:my-6" />

          {/* Colors — square image swatches like reference (hidden for combo packs with no colour choice) */}
          {p.colors.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium text-foreground sm:text-[15px]">
              <span className="font-semibold">Colors:</span>{" "}
              <span className="text-muted-foreground">
                {colorName(p.colors[color] ?? "#ccc")}
              </span>
            </p>
            <div className="flex flex-wrap gap-2.5">
              {p.colors.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setColor(i); setColorOverride(p.colorImages?.[i] ?? null); setHoveredColor(null); }}
                  onMouseEnter={() => setHoveredColor(i)}
                  onMouseLeave={() => setHoveredColor(null)}
                  aria-label={`Color ${colorName(c)}`}
                  aria-pressed={color === i}
                  className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-secondary/60 p-1 transition-all duration-200 active:scale-[0.98] sm:size-[4.5rem] ${
                    color === i ? "border-foreground" : "border-border hover:border-foreground/40"
                  }`}
                >
                  <span className="relative block size-full overflow-hidden rounded-md bg-white">
                    {p.colorImages?.[i]
                      ? <img src={p.colorImages[i]} alt="" className="absolute inset-0 size-full object-cover" />
                      : <img src={p.image} alt="" className="absolute inset-0 size-full object-cover" />
                    }
                    {!p.colorImages?.[i] && (
                      <span
                        className="absolute inset-0 mix-blend-multiply opacity-85"
                        style={{ backgroundColor: c }}
                        aria-hidden
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Size — hidden for one-size / unstitched products (no sizes) */}
          {p.sizes.length > 0 && (
          <div className="mt-5 pt-5 border-t border-border/60 lg:border-t-0 lg:pt-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium sm:text-[15px]">
                <span className="font-semibold text-foreground">Size:</span>{" "}
                <span className="text-muted-foreground">{size}</span>
              </p>
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="text-xs font-medium text-accent underline underline-offset-2 sm:text-[13px]"
              >
                <span className="inline-flex items-center gap-1">
                  <Ruler className="size-3.5" strokeWidth={2} /> Size guide
                </span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-all duration-200 active:scale-[0.97] sm:min-h-12 sm:min-w-12 ${
                    size === s
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:border-foreground/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Quantity + Add to cart (same row at sm+) + Buy now full width — reference */}
          <div className="mt-5 space-y-3 pt-5 border-t border-border/60 lg:border-t-0 lg:pt-0">
            <p className="text-sm font-semibold text-foreground">Quantity:</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 w-full items-center justify-between rounded-full border border-border bg-secondary/40 px-1.5 sm:w-44 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1}
                  className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" strokeWidth={2.5} />
                </button>
                <span className="min-w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty(stock !== null ? Math.min(stock, qty + 1) : qty + 1)}
                  disabled={stock !== null && qty >= stock}
                  className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stock === 0}
                className={`flex h-12 w-full items-center justify-center rounded-full text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 ${
                  added
                    ? "bg-emerald-500 text-white"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                {stock === 0 ? (
                  "Out of stock"
                ) : added ? (
                  <>
                    <Check className="mr-1.5 size-4" strokeWidth={2.5} /> Added
                  </>
                ) : (
                  "Add to cart"
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={buyNow}
              disabled={stock === 0}
              className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-md transition-all duration-200 hover:opacity-92 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy it now
            </button>
          </div>

          {/* Delivery & returns — reference */}
          <div className="mt-6 space-y-4 rounded-xl border border-border/70 bg-secondary/20 p-4 sm:p-5">
            <p className="flex gap-3 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              <Clock className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={2} />
              <span>
                <span className="font-semibold text-foreground">Estimated delivery:</span> 3–6 days
                (Dhaka metro), 5–10 days (nationwide).
              </span>
            </p>
            <p className="flex gap-3 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              <RotateCcw className="mt-0.5 size-4 shrink-0 text-foreground" strokeWidth={2} />
              <span>
                <span className="font-semibold text-foreground">Check at delivery</span> — inspect
                your item when it arrives and return it right away if you&apos;re not satisfied.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs: Description / Customer Reviews / Shipping ── */}
      <div className="mx-auto max-w-7xl px-4 pb-16">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
          {/* Tab header — text + thick underline (reference) */}
          <div className="flex border-b justify-between border-border/70 bg-background overflow-x-auto no-scrollbar">
            {[
              { id: "desc" as const, label: "Description" },
              { id: "shipping" as const, label: "Shipping & returns" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setTab(m.id)}
                className={`relative flex-1  px-4 py-3.5 text-center text-sm font-semibold whitespace-nowrap transition-colors sm:px-6 sm:py-4 sm:text-[15px] ${
                  tab === m.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {m.label}
                <span
                  className={`absolute bottom-0 left-3 right-3 h-[3px] rounded-full transition-opacity sm:left-4 sm:right-4 ${
                    tab === m.id ? "bg-foreground opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="px-4 py-6 sm:px-8 sm:py-8 animate-fade-in">
            {tab === "desc" && (
              <div className="max-w-3xl">
                <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {p.name}
                </h2>
                {hasDescription ? (
                  // Admin-authored rich content (headings, lists, images) from the product editor.
                  <div
                    className="prose prose-sm mt-4 max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-accent prose-img:rounded-xl prose-img:w-full"
                    dangerouslySetInnerHTML={{ __html: p.description! }}
                  />
                ) : (
                  <p className="mt-4 text-[13px] leading-[1.7] text-muted-foreground sm:text-sm">
                    No description has been added for this product yet.
                  </p>
                )}

                <h3 className="mt-8 text-base font-bold text-foreground sm:text-lg">
                  Specifications
                </h3>
                <dl className="mt-4 space-y-2 border-t border-border/60 pt-2 text-[13px] sm:text-sm">
                  {[
                    ["Category", p.categoryName || p.category],
                    ["Brand", p.brand],
                    ["Sizes", p.sizes.length ? p.sizes.join(", ") : "—"],
                    ["Colours", p.colors.length ? `${p.colors.length} option${p.colors.length === 1 ? "" : "s"}` : ""],
                    ["Material", p.material || "—"],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-border/40 py-2.5 last:border-0"
                    >
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {tab === "shipping" && (
              <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
                {[
                  { icon: Truck,     ...shippingPolicy.delivery },
                  { icon: RotateCcw, ...shippingPolicy.returns },
                ].map((s) => (
                  <div key={s.title} className="rounded-2xl border p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="size-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <s.icon className="size-5 text-accent" />
                      </span>
                      <h3 className="font-semibold">{s.title}</h3>
                    </div>
                    <ul className="space-y-2.5">
                      {s.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
              More to explore
            </p>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">You may also like</h2>
          </div>
          <Link
            href={`/category/${p.category.toLowerCase()}`}
            className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            View all <ChevronDown className="size-4 -rotate-90" />
          </Link>
        </div>

        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 snap-x snap-mandatory pb-1">
            {related.map((rp) => (
              <div key={rp.id} className="snap-start shrink-0 w-[52vw]">
                <ProductCard p={rp} />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {related.map((rp) => (
            <ProductCard key={rp.id} p={rp} />
          ))}
        </div>
      </section>

      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} activeSize={size} />
    </Layout>
  );
}

export default ProductPage;
