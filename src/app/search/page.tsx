"use client";

import Link from "next/link";
import { Layout } from "@/components/site/Layout";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";
import type { Product } from "@/components/site/ProductCard";
import { Search as SearchIcon, X, Smartphone, Shirt, Home as HomeIcon, Sparkles, ShoppingBasket, Tag } from "lucide-react";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DataPagination } from "@/components/site/DataPagination";

const POPULAR_CATEGORIES = [
  { label: "Gadgets",       href: "/category/gadgets", icon: Smartphone },
  { label: "Fashion",       href: "/category/fashion",  icon: Shirt },
  { label: "Home & Living", href: "/category/home",     icon: HomeIcon },
  { label: "Beauty",        href: "/category/beauty",   icon: Sparkles },
  { label: "Grocery",       href: "/category/grocery",  icon: ShoppingBasket },
  { label: "Deals",         href: "/category/deals",    icon: Tag },
];

const PAGE_SIZE = 12;

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [q, setQ]             = useState(initial);
  const [results, setResults] = useState<Product[]>([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setQ(searchParams.get("q") ?? ""); }, [searchParams]);

  const doSearch = useCallback((query: string, pg: number) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(pg) });
    if (query.trim()) params.set("search", query.trim());
    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then(({ products, total: t, totalPages: tp }) => {
        setResults(products ?? []);
        setTotal(t ?? 0);
        setTotalPages(tp ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setPage(1); doSearch(q, 1); }, [q, doSearch]);
  useEffect(() => { doSearch(q, page); }, [page, q, doSearch]);

  const pageItems = results;
  const currentPage = page;
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd   = total === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, total);

  return (
    <Layout>
      <PageHeader
        title="Search"
        subtitle={`${total} ${total === 1 ? "result" : "results"}${q ? ` for "${q}"` : ""}`}
        crumbs={[{ label: "Home", to: "/" }, { label: "Search" }]}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 animate-fade-up">
        {/* Search input */}
        <div className="relative max-w-xl">
          <SearchIcon className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            autoFocus
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands, categories..."
            className="w-full h-12 pl-11 pr-10 rounded-full border bg-secondary text-sm outline-none focus:border-foreground transition"
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="mt-10 space-y-10">
            {/* Empty state hero */}
            <div className="flex flex-col items-center text-center py-10 px-4">
              <div className="size-20 rounded-full bg-secondary flex items-center justify-center mb-5">
                <SearchIcon className="size-9 text-muted-foreground/40" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">No results for &ldquo;{q}&rdquo;</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                Check the spelling or try a more general keyword
              </p>
              <button
                onClick={() => setQ("")}
                className="mt-5 h-10 px-6 rounded-full bg-black text-white text-sm font-semibold hover:bg-accent transition"
              >
                Clear search
              </button>
            </div>

            {/* Popular categories */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Browse by Category</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {POPULAR_CATEGORIES.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-4 px-2 text-center hover:border-foreground hover:shadow-sm transition group"
                  >
                    <span className="size-11 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-foreground transition-colors">
                      <Icon className="size-5 text-muted-foreground group-hover:text-background transition-colors" strokeWidth={1.75} />
                    </span>
                    <span className="text-[12px] font-semibold leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trending products placeholder - skip when empty */}
            <div />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5">
              {pageItems.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
            <DataPagination
              hideWhenSinglePage
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalItems={results.length}
              className="mt-10"
            />
          </>
        )}
      </div>
    </Layout>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <PageHeader title="Search" subtitle="Loading…" crumbs={[{ label: "Home", to: "/" }, { label: "Search" }]} />
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="h-12 max-w-xl skeleton-shimmer rounded-full" />
          </div>
        </Layout>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
