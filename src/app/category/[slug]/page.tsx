"use client";

import Link from "next/link";
import { Layout } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import {
  ChevronRight, SlidersHorizontal, X, Search,
  ArrowUpDown, LayoutGrid, List, ChevronDown, Check,
} from "lucide-react";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Price } from "@/components/site/Price";
import { DataPagination } from "@/components/site/DataPagination";
import { productHasAnyColor } from "@/lib/product-filters";
import type { Product } from "@/components/site/ProductCard";

const PRICE_BANDS = [
  { id: "u1k",   label: "Under ৳1,000",       test: (n: number) => n < 1000 },
  { id: "1k5k",  label: "৳1,000 – ৳5,000",    test: (n: number) => n >= 1000 && n < 5000 },
  { id: "5k10k", label: "৳5,000 – ৳10,000",   test: (n: number) => n >= 5000 && n < 10000 },
  { id: "o10k",  label: "Over ৳10,000",        test: (n: number) => n >= 10000 },
];

const SORT_OPTIONS = [
  { value: "feat", label: "Featured" },
  { value: "lh",   label: "Price: Low to High" },
  { value: "hl",   label: "Price: High to Low" },
  { value: "sale", label: "On Sale" },
  { value: "new",  label: "Newest First" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["value"];

const ALL_CATEGORIES = ["Salwar Kameez", "T-Shirts", "Shirts", "Polo", "Panjabi", "Jeans", "Tops", "Dresses", "Outerwear", "Shoes"];
const PAGE_SIZE = 12;

function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const searchParams = useSearchParams();
  const sub = searchParams.get("sub") ?? "";              // clothing type filter, e.g. ?sub=T-Shirts
  const filter = searchParams.get("filter") ?? "";        // "featured" | "trending" — shows all of that set
  const title = filter
    ? filter.charAt(0).toUpperCase() + filter.slice(1) + " Products"
    : sub || slug.charAt(0).toUpperCase() + slug.slice(1);

  const [search, setSearch]       = useState("");
  const [bands, setBands]         = useState<string[]>([]);
  const [sizes, setSizes]         = useState<string[]>([]);
  const [cats, setCats]           = useState<string[]>(sub ? [sub] : []);   // clothing-type filter (by subcategory) — seeded from ?sub=
  const [brands, setBrands]       = useState<string[]>([]);
  const [colorHexes, setColorHexes] = useState<string[]>([]);
  const [sort, setSort]           = useState<SortKey>("feat");
  const [drawer, setDrawer]       = useState(false);
  const [view, setView]           = useState<"grid" | "list">("grid");
  const [sortOpen, setSortOpen]   = useState(false);
  const [page, setPage]           = useState(1);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [ALL_SIZES, setAllSizes]      = useState<string[]>(["XS","S","M","L","XL","XXL","One size","39","40","41","42","43"]);
  const [ALL_BRANDS, setAllBrands]    = useState<string[]>([]);
  const [COLOR_CATALOG, setColorCatalog] = useState<{ hex: string; label: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    // ?filter=featured|trending shows the whole set; otherwise all products in the category.
    const url = (filter === "featured" || filter === "trending")
      ? `/api/products?${filter}=true&limit=100`
      : `/api/products?category=${slug}&limit=100`;
    fetch(url)
      .then((r) => r.json())
      .then(({ products }) => {
        const prods: Product[] = products ?? [];
        setAllProducts(prods);
        // Derive filter catalogs from fetched products
        setAllBrands([...new Set(prods.map((p) => p.brand).filter(Boolean))]);
        const seen = new Map<string, string>();
        prods.forEach((p) => (p.colors ?? []).forEach((c: string) => { if (!seen.has(c)) seen.set(c, c); }));
        setColorCatalog(Array.from(seen.entries()).map(([hex]) => ({ hex, label: hex })));
        const sizes = [...new Set(prods.flatMap((p) => p.sizes))];
        if (sizes.length) setAllSizes(sizes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, filter]);

  // Keep the clothing-type filter in sync with the URL ?sub= so the sidebar chip
  // and the URL never contradict each other (e.g. ?sub=Shirts + T-Shirts chip → 0).
  useEffect(() => { setCats(sub ? [sub] : []); }, [sub]);

  const toggleBand = (id: string) => setBands((b) => b.includes(id) ? b.filter((x) => x !== id) : [...b, id]);
  const toggleSize = (s: string)  => setSizes((v) => v.includes(s) ? v.filter((x) => x !== s) : [...v, s]);
  const toggleCat  = (c: string)  => setCats((v)  => v.includes(c) ? v.filter((x) => x !== c) : [...v, c]);
  const toggleBrand = (b: string) => setBrands((v) => v.includes(b) ? v.filter((x) => x !== b) : [...v, b]);
  const toggleColor = (hex: string) => {
    const key = hex.toLowerCase();
    setColorHexes((v) => (v.includes(key) ? v.filter((x) => x !== key) : [...v, key]));
  };

  const activeFilterCount =
    bands.length + sizes.length + cats.length + brands.length + colorHexes.length + (search ? 1 : 0);

  const clearAll = () => {
    setBands([]);
    setSizes([]);
    setCats([]);
    setBrands([]);
    setColorHexes([]);
    setSearch("");
  };

  const list = useMemo(() => {
    let arr = [...allProducts];
    if (search) arr = arr.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (bands.length) arr = arr.filter((p) => PRICE_BANDS.filter((b) => bands.includes(b.id)).some((b) => b.test(p.price)));
    if (sizes.length) arr = arr.filter((p) => p.sizes.some((s) => sizes.includes(s)));
    if (cats.length)  arr = arr.filter((p) => cats.includes(p.subcategory ?? ""));
    if (brands.length) arr = arr.filter((p) => brands.includes(p.brand));
    if (colorHexes.length) arr = arr.filter((p) => productHasAnyColor(p, colorHexes));
    if (sort === "lh")   arr = [...arr].sort((a, b) => a.price - b.price);
    if (sort === "hl")   arr = [...arr].sort((a, b) => b.price - a.price);
    if (sort === "sale") arr = arr.filter((p) => !!p.oldPrice);
    if (sort === "new")  arr = [...arr].reverse();
    return arr;
  }, [allProducts, search, bands, sizes, cats, brands, colorHexes, sort]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, bands, sizes, cats, brands, colorHexes, sort]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, currentPage]);

  const rangeStart = list.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = list.length === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, list.length);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort)!;

  const FilterPanel = () => (
    <div className="flex flex-col gap-2">

      {/* Search inside filter */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border bg-secondary/50 text-sm outline-none focus:border-foreground transition"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Clothing type */}
      <FilterGroup title="Type" onClear={cats.length ? () => setCats([]) : undefined}>
        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCat(c)}
              className={`h-8 px-3 rounded-full text-xs font-medium border transition ${cats.includes(c) ? "bg-foreground text-background border-foreground" : "border-border bg-background/50 hover:border-foreground/40"}`}
            >{c}</button>
          ))}
        </div>
      </FilterGroup>

      {/* Brand */}
      <FilterGroup title="Brand" onClear={brands.length ? () => setBrands([]) : undefined}>
        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_BRANDS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggleBrand(b)}
              className={`h-8 max-w-full truncate px-3 rounded-full text-xs font-medium border transition ${brands.includes(b) ? "bg-foreground text-background border-foreground" : "border-border bg-background/50 hover:border-foreground/40"}`}
            >{b}</button>
          ))}
        </div>
      </FilterGroup>

      {/* Color — compact swatches aligned with h-8 filter chips */}
      <FilterGroup title="Color" onClear={colorHexes.length ? () => setColorHexes([]) : undefined}>
        <div className="flex flex-wrap gap-2 pt-1">
          {COLOR_CATALOG.map(({ hex, label }) => {
            const selected = colorHexes.includes(hex);
            return (
              <button
                key={hex}
                type="button"
                title={label}
                aria-label={`${label}${selected ? ", selected" : ""}`}
                aria-pressed={selected}
                onClick={() => toggleColor(hex)}
                className={`relative box-border size-6 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selected ? "border-foreground" : "border-border hover:border-foreground/50"}`}
                style={{ background: hex }}
              >
                {hex.toLowerCase() === "#ffffff" ? (
                  <span className="pointer-events-none absolute inset-px rounded-full border border-border/50" aria-hidden />
                ) : null}
                {selected ? (
                  <Check
                    className={`pointer-events-none absolute inset-0 m-auto size-2.5 drop-shadow-sm ${hex.toLowerCase() === "#ffffff" ? "text-foreground" : "text-white"}`}
                    strokeWidth={3}
                    aria-hidden
                  />
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">Shows items that use any selected colour.</p>
      </FilterGroup>
      {/* Price */}
      <FilterGroup title="Price" onClear={bands.length ? () => setBands([]) : undefined}>
        <ul className="space-y-2 pt-1">
          {PRICE_BANDS.map((b) => (
            <li key={b.id}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <span className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${bands.includes(b.id) ? "bg-foreground border-foreground" : "border-border group-hover:border-foreground/40"}`}>
                  {bands.includes(b.id) && <Check className="size-3 text-background" />}
                </span>
                <input type="checkbox" checked={bands.includes(b.id)} onChange={() => toggleBand(b.id)} className="sr-only" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition">{b.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterGroup>

      {/* Size */}
      <FilterGroup title="Size" onClear={sizes.length ? () => setSizes([]) : undefined}>
        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`h-9 min-w-[2.5rem] px-3 rounded-xl text-xs font-medium border-2 transition ${sizes.includes(s) ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/60"}`}
            >{s}</button>
          ))}
        </div>
      </FilterGroup>

      {/* On sale toggle */}
      <FilterGroup title="Deals">
        <label className="flex items-center justify-between cursor-pointer pt-1">
          <span className="text-sm text-muted-foreground">On sale only</span>
          <button
            role="switch"
            aria-checked={sort === "sale"}
            onClick={() => setSort((s) => s === "sale" ? "feat" : "sale")}
            className={`relative w-11 h-6 rounded-full transition ${sort === "sale" ? "bg-accent" : "bg-border"}`}
          >
            <span className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform ${sort === "sale" ? "translate-x-5" : ""}`} />
          </button>
        </label>
      </FilterGroup>
    </div>
  );

  return (
    <Layout>
      {/* Hero banner */}
      <div className="border-b bg-linear-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground font-medium">{title}</span>
          </nav>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {list.length} {list.length === 1 ? "product" : "products"}
                {activeFilterCount > 0 && (
                  <>
                    {" "}
                    · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                  </>
                )}
              </p>
            </div>

            {/* Top-bar controls */}
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen((o) => !o)}
                  className="flex items-center gap-2 h-10 px-4 rounded-full border bg-card text-sm hover:border-foreground/60 transition"
                >
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <span>{currentSort.label}</span>
                  <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                </button>
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border bg-card shadow-xl z-20 py-1.5 overflow-hidden animate-scale-in">
                      {SORT_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => { setSort(o.value); setSortOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-secondary transition ${sort === o.value ? "text-foreground font-medium" : "text-muted-foreground"}`}
                        >
                          {o.label}
                          {sort === o.value && <Check className="size-3.5 text-accent" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex items-center gap-1 h-10 px-1.5 rounded-full border bg-card">
                <button onClick={() => setView("grid")} className={`size-7 rounded-full flex items-center justify-center transition ${view === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  <LayoutGrid className="size-3.5" />
                </button>
                <button onClick={() => setView("list")} className={`size-7 rounded-full flex items-center justify-center transition ${view === "list" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>
                  <List className="size-3.5" />
                </button>
              </div>

              {/* Mobile filter button */}
              <button
                onClick={() => setDrawer(true)}
                className={`lg:hidden flex items-center gap-2 h-10 px-4 rounded-full border text-sm transition ${activeFilterCount > 0 ? "border-foreground bg-foreground text-background" : "hover:border-foreground/60"}`}
              >
                <SlidersHorizontal className="size-4" />
                Filters
                {activeFilterCount > 0 && <span className="size-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {search && (
                <Chip label={`"${search}"`} onRemove={() => setSearch("")} />
              )}
              {cats.map((c) => <Chip key={c} label={c} onRemove={() => toggleCat(c)} />)}
              {brands.map((b) => <Chip key={b} label={b} onRemove={() => toggleBrand(b)} />)}
              {colorHexes.map((hex) => (
                <Chip
                  key={hex}
                  label={COLOR_CATALOG.find((c) => c.hex === hex)?.label ?? hex}
                  onRemove={() => toggleColor(hex)}
                />
              ))}
              {bands.map((b) => <Chip key={b} label={PRICE_BANDS.find((x) => x.id === b)!.label} onRemove={() => toggleBand(b)} />)}
              {sizes.map((s) => <Chip key={s} label={`Size ${s}`} onRemove={() => toggleSize(s)} />)}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-6 flex gap-6 animate-fade-up">

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold flex items-center gap-2">
                <SlidersHorizontal className="size-4" /> Filters
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-accent hover:underline">Clear all ({activeFilterCount})</button>
              )}
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Search className="size-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-semibold">No products found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
              <button onClick={clearAll} className="mt-5 h-10 px-6 rounded-full bg-foreground text-background text-sm font-medium">Clear all filters</button>
            </div>
          ) : view === "list" ? (
            <div className="space-y-3">
              {pageItems.map((p) => <ListCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {pageItems.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
          <DataPagination
            hideWhenSinglePage
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            totalItems={list.length}
            className="mt-10"
          />
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-background border-r shadow-2xl flex flex-col animate-slide-left">
            <div className="flex items-center justify-between p-5 border-b">
              <p className="text-lg font-semibold flex items-center gap-2">
                <SlidersHorizontal className="size-5" /> Filters
                {activeFilterCount > 0 && <span className="size-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">{activeFilterCount}</span>}
              </p>
              <button onClick={() => setDrawer(false)} className="size-9 rounded-full border flex items-center justify-center hover:bg-secondary transition">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <FilterPanel />
            </div>
            <div className="p-5 border-t flex gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="flex-1 h-11 rounded-full border text-sm font-medium hover:border-foreground transition">
                  Clear all
                </button>
              )}
              <button onClick={() => setDrawer(false)} className="flex-1 h-11 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition">
                Show {list.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function FilterGroup({ title, children, onClear }: { title: string; children: ReactNode; onClear?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 py-3 px-3 first:mt-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition hover:bg-background/60"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
        <div className="flex items-center gap-2">
          {onClear && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onClear(); } }}
              className="text-xs font-medium text-accent hover:underline"
            >
              Clear
            </span>
          )}
          <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-secondary border text-xs font-medium">
      {label}
      <button onClick={onRemove} className="size-4 rounded-full flex items-center justify-center hover:bg-border transition">
        <X className="size-2.5" />
      </button>
    </span>
  );
}

function ListCard({ p }: { p: Product }) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <Link href={`/product/${p.id}`} className="flex gap-4 rounded-2xl border bg-card p-3 hover:border-foreground/40 hover:shadow-sm transition group">
      <div className="relative size-24 sm:size-28 rounded-xl bg-secondary overflow-hidden shrink-0">
        {discount > 0 && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-accent text-white text-[9px] font-bold px-1.5 py-0.5">-{discount}%</span>
        )}
        <img src={p.image} alt={p.name} className="size-full object-cover group-hover:scale-105 transition duration-500" />
      </div>
      <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.category}</p>
        <p className="text-[10px] font-medium text-muted-foreground/90">{p.brand}</p>
        <h3 className="mt-0.5 text-sm font-medium leading-snug line-clamp-2">{p.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          <Price amount={p.price} size="md" className="!font-semibold" />
          {p.oldPrice && <Price amount={p.oldPrice} size="xs" muted struck />}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {p.colors.map((c, i) => (
            <span key={i} className="box-border size-3.5 shrink-0 rounded-full border border-border" style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="hidden sm:flex items-center shrink-0 pr-2">
        <span className="text-xs text-muted-foreground">{p.sizes.join(" · ")}</span>
      </div>
    </Link>
  );
}

export default CategoryPage;
