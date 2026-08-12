"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Search, X, Pin, TrendingUp, Star, Check } from "lucide-react";
import { toast } from "sonner";

type Tab = "featured" | "trending";

type ApiProduct = {
  id: string; name: string; price: number; images: string[];
  category: { name: string } | null;
  featured: boolean; trending: boolean;
  slug: string; oldPrice: number | null; stock: number;
  colors: string[]; colorImages: string[]; sizes: string[];
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  description: string | null; material: string | null; tags: string[];
  badgeLabel: string | null; badgeTone: string | null;
  metaTitle: string | null; metaDesc: string | null;
  categoryId: string | null; brandId: string | null; subcategory: string | null;
  variants: { size: string; color: string; price: number; stock: number; sku: string | null }[];
};

const FEATURED_MAX = 8;
const TRENDING_MAX = 5;

export default function HomepagePage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]     = useState<Tab>("featured");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    // Pull a large page so the admin can pin from the whole catalog.
    fetch("/api/admin/products?limit=100")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const flagKey = tab === "featured" ? "featured" : "trending";
  const MAX = tab === "featured" ? FEATURED_MAX : TRENDING_MAX;

  const pinned = useMemo(() => products.filter((p) => p[flagKey]), [products, flagKey]);
  const featuredCount = useMemo(() => products.filter((p) => p.featured).length, [products]);
  const trendingCount = useMemo(() => products.filter((p) => p.trending).length, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.category?.name ?? "").toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  }, [products, search]);

  // Toggle the featured/trending flag on a product via the product PUT endpoint.
  const toggle = async (p: ApiProduct) => {
    const isPinned = p[flagKey];
    if (!isPinned && pinned.length >= MAX) {
      toast.error(`Max ${MAX} products for ${tab}`);
      return;
    }
    setSaving(p.id);
    const payload = {
      name: p.name, slug: p.slug, description: p.description ?? undefined,
      price: p.price, oldPrice: p.oldPrice ?? undefined, stock: p.stock,
      images: p.images.length ? p.images : ["https://placehold.co/600x600?text=No+Image"],
      colorImages: p.colorImages, colors: p.colors, sizes: p.sizes,
      material: p.material ?? undefined, tags: p.tags,
      badgeLabel: p.badgeLabel ?? undefined, badgeTone: p.badgeTone ?? undefined,
      status: p.status,
      featured: flagKey === "featured" ? !p.featured : p.featured,
      trending: flagKey === "trending" ? !p.trending : p.trending,
      metaTitle: p.metaTitle ?? undefined, metaDesc: p.metaDesc ?? undefined,
      categoryId: p.categoryId ?? undefined, brandId: p.brandId ?? undefined,
      subcategory: p.subcategory ?? undefined,
      variants: p.variants.map((v) => ({ size: v.size, color: v.color, price: v.price, stock: v.stock, sku: v.sku ?? undefined })),
    };
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setSaving(null);
    if (!res.ok) { toast.error("Failed to update product"); return; }
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, [flagKey]: !isPinned } : x));
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Homepage Config</h2>
          <p className="text-sm text-slate-400">Pin products to the Featured and Trending sections</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("featured")}
          className={`flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition ${tab === "featured" ? "bg-[#0f172a] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"}`}>
          <Star className="size-4" /> Featured Products
        </button>
        <button onClick={() => setTab("trending")}
          className={`flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition ${tab === "trending" ? "bg-[#0f172a] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"}`}>
          <TrendingUp className="size-4" /> Trending Products
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Product picker */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3">
              {tab === "featured" ? "Pin to Featured" : "Pin to Trending"} <span className="text-sm font-normal text-slate-400">({pinned.length}/{MAX} selected)</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 460 }}>
            {loading && (
              <div className="divide-y divide-slate-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="skeleton-shimmer size-5 rounded-md" />
                    <div className="skeleton-shimmer size-12 rounded-xl" />
                    <div className="flex-1">
                      <div className="skeleton-shimmer h-4 w-2/3 rounded-md" />
                      <div className="skeleton-shimmer mt-2 h-3 w-1/3 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-sm">No products found</div>
            )}
            {!loading && filtered.map((p) => {
              const isPinned = p[flagKey];
              return (
                <div key={p.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition border-b border-slate-50 ${isPinned ? "bg-red-50/50" : ""} ${saving === p.id ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => toggle(p)}>
                  <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${isPinned ? "bg-[#ef4444] border-[#ef4444]" : "border-slate-300"}`}>
                    {isPinned && <Check className="size-3 text-white" />}
                  </div>
                  <img src={p.images?.[0]} alt={p.name} className="size-12 rounded-xl object-cover shrink-0 border border-slate-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{p.category?.name ?? "—"} · ৳{p.price.toLocaleString()}</p>
                  </div>
                  {isPinned && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">Pinned</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Pinned list */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">
              {tab === "featured" ? <><Star className="size-4 inline mr-1 text-amber-500" />Featured</> : <><TrendingUp className="size-4 inline mr-1 text-red-500" />Trending</>}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {tab === "featured" ? "Shown in FeaturedGrid on homepage" : "Shown in Trending section on homepage"}
            </p>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 460 }}>
            {pinned.length === 0 && (
              <div className="py-16 text-center">
                <Pin className="size-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No products pinned yet</p>
                <p className="text-xs text-slate-300 mt-1">Select products from the left panel</p>
              </div>
            )}
            {pinned.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition">
                <span className="size-6 rounded-lg bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                <img src={p.images?.[0]} alt={p.name} className="size-12 rounded-xl object-cover shrink-0 border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{p.category?.name ?? "—"} · ৳{p.price.toLocaleString()}</p>
                </div>
                <button onClick={() => toggle(p)} className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Star className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Featured Grid</p>
              <p className="text-xs text-slate-400">{featuredCount} / {FEATURED_MAX} products pinned</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, (featuredCount / FEATURED_MAX) * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {featuredCount === 0 ? "Shows recent products when none pinned" : `Showing ${featuredCount} specific products`}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center">
              <TrendingUp className="size-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Trending Section</p>
              <p className="text-xs text-slate-400">{trendingCount} / {TRENDING_MAX} products pinned</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${Math.min(100, (trendingCount / TRENDING_MAX) * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {trendingCount === 0 ? "Shows first products when none pinned" : `Showing ${trendingCount} specific products`}
          </p>
        </div>
      </div>
    </div>
  );
}
