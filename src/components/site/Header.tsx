"use client";

import {
  Search, Heart, ShoppingCart, Menu, X, Package,
  Shirt, Sparkles, ShoppingBasket, Tag, ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.jpeg";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { CartDrawer } from "./CartDrawer";
import { WishlistDrawer } from "./WishlistDrawer";
import { Price } from "./Price";
import type { Product } from "./ProductCard";

export function Header() {
  const { cartCount, wishlist } = useStore();
  const { lang, t } = useT();

  // Fashion-only clothing categories — all under the "fashion" parent, filtered by ?sub.
  const categories = [
    { name: "T-Shirts", to: "/category/fashion?sub=T-Shirts", icon: Shirt },
    { name: "Shirts",   to: "/category/fashion?sub=Shirts",   icon: Shirt },
    { name: "Panjabi",  to: "/category/fashion?sub=Panjabi",  icon: Sparkles },
    { name: "Jeans",    to: "/category/fashion?sub=Jeans",    icon: ShoppingBasket },
    { name: "Dresses",  to: "/category/fashion?sub=Dresses",  icon: Sparkles },
    { name: "Shoes",    to: "/category/fashion?sub=Shoes",    icon: Tag },
  ];

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [searchPopover, setSearchPopover] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  // lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    document.documentElement.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; document.documentElement.style.overflow = ""; };
  }, [menu]);

  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const query = q.trim();
    if (!query) { setResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(({ products }) => setResults(products ?? []))
        .catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  useLayoutEffect(() => {
    if (!searchOpen || !q.trim()) {
      setSearchPopover(null);
      return;
    }
    const update = () => {
      const el = searchRef.current;
      if (!el) {
        setSearchPopover(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width < 8) {
        setSearchPopover(null);
        return;
      }
      const gap = 6;
      const pad = 8;
      const maxLeft = window.innerWidth - r.width - pad;
      const left = Math.max(pad, Math.min(r.left, maxLeft));
      setSearchPopover({ top: r.bottom + gap, left, width: r.width });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [searchOpen, q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (searchRef.current?.contains(t) || searchDropdownRef.current?.contains(t)) return;
      setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q)}`); setSearchOpen(false); }
  };


  return (
    <>
      <header className="sticky top-0 z-40 w-full min-w-0 overflow-x-clip bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">

        {/* ── Main bar ── */}
        <div className="border-b bg-background">
          <div className="relative mx-auto flex h-[3.75rem] min-w-0 max-w-7xl items-center gap-3 px-4 sm:h-16 lg:h-20 lg:gap-5 lg:px-6">

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenu(true)}
              aria-label="Open menu"
              className="md:hidden p-2 rounded-xl hover:bg-secondary transition shrink-0"
            >
              <Menu className="size-5.5 stroke-[1.75]" />
            </button>

            {/* Logo — centered on mobile, left on desktop */}
            <Link
              href="/"
              className="absolute left-1/2 flex shrink-0 -translate-x-1/2 items-center md:static md:mr-4 md:translate-x-0 lg:mr-6"
            >
              <Image src={logo} alt="Tanni Fashion House" priority className="size-11 rounded-xl object-cover lg:size-13" />
            </Link>

            {/* Desktop search */}
            <div ref={searchRef} className="relative mx-auto hidden max-w-2xl flex-1 md:block">
              <form onSubmit={submit}>
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground lg:left-5 lg:size-[16px]" />
                <input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={t("search.placeholder")}
                  className="h-12 w-full rounded-full border border-border bg-secondary pl-11 pr-4 text-sm outline-none transition focus-visible:border-foreground/35 focus-visible:ring-2 focus-visible:ring-ring/20 lg:h-[52px] lg:pl-12 lg:pr-5 lg:text-base"
                />
              </form>
            </div>

            {/* Right icons */}
            <div className="ml-auto flex items-center gap-0.5 lg:gap-1.5">

              {/* Desktop: wishlist + cart */}
              <button
                onClick={() => setWishlistOpen(true)}
                aria-label="Wishlist"
                className="relative hidden rounded-full p-2.5 hover:bg-secondary md:flex lg:p-3"
              >
                <Heart className="size-5 lg:size-[22px]" />
                {mounted && wishlist.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background lg:size-[18px] lg:text-[11px]">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Cart"
                className="relative hidden rounded-full p-2.5 hover:bg-secondary md:flex lg:p-3"
              >
                <ShoppingCart className="size-5 lg:size-[22px]" />
                {mounted && cartCount > 0 && (
                  <span
                    key={cartCount}
                    className="absolute -right-0.5 -top-0.5 flex size-4 animate-bounce-soft items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground lg:size-[18px] lg:text-[11px]"
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile: search + cart icons */}
              {/* <Link href="/search" aria-label="Search" className="md:hidden p-2.5 rounded-full hover:bg-secondary">
                <Search className="size-5" />
              </Link> */}
              <button onClick={() => setCartOpen(true)} aria-label="Cart" className="md:hidden relative p-2.5 rounded-full hover:bg-secondary">
                <ShoppingCart className="size-5" />
                {mounted && cartCount > 0 && (
                  <span key={cartCount} className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center animate-bounce-soft">{cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* ── Mobile hamburger drawer ── */}
      {/* Mobile nav overlay — must sit above sticky page chrome (e.g. checkout bar z-50, drawers z-60) */}
      {menu && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenu(false)}
          />

          {/* Drawer panel */}
          <div className="absolute left-0 top-0 bottom-0 w-75 bg-background shadow-2xl flex flex-col animate-slide-left overflow-hidden">

            {/* Brand header */}
            <div className="flex items-center justify-between px-5 py-4 bg-black text-white shrink-0">
              <Link href="/" onClick={() => setMenu(false)} className="flex items-center">
                <Image src={logo} alt="Tanni Fashion House" className="size-10 rounded-lg object-cover" />
              </Link>
              <button
                onClick={() => setMenu(false)}
                className="size-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* Quick actions */}
              <div className="px-4 pt-4 pb-3 border-b space-y-0.5">
                <Link href="/track" onClick={() => setMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition"
                >
                  <span className="size-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Package className="size-4 text-muted-foreground" />
                  </span>
                  <span className="text-sm font-medium">Track Order</span>
                  <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
                </Link>
              </div>

              {/* Categories */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1 mb-2">Categories</p>
                <nav className="space-y-0.5">
                  {categories.map((c) => (
                    <Link key={c.name} href={c.to} onClick={() => setMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition group"
                    >
                      <span className="size-8 rounded-lg bg-secondary group-hover:bg-background flex items-center justify-center transition shrink-0">
                        <c.icon className="size-4 text-muted-foreground group-hover:text-foreground transition" />
                      </span>
                      <span className={`text-sm font-medium flex-1 ${lang === "bn" ? "font-bn" : ""}`}>{c.name}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Wishlist quick link (guest — stored locally) */}
              <div className="px-4 pt-3 pb-2 border-t mt-2">
                <Link href="/wishlist" onClick={() => setMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition group"
                >
                  <span className="size-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Heart className="size-4 text-muted-foreground" />
                  </span>
                  <span className="text-sm font-medium flex-1">Wishlist</span>
                  <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Desktop search suggestions — portaled so it stacks above category nav & is never clipped by header overflow */}
      {searchOpen &&
        q.trim().length > 0 &&
        searchPopover &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={searchDropdownRef}
            role="listbox"
            aria-label="Search suggestions"
            className="pointer-events-auto fixed z-[500] hidden max-h-[min(22rem,70svh)] overflow-hidden overflow-y-auto overscroll-contain rounded-xl border border-border/90 bg-card shadow-xl ring-1 ring-foreground/[0.04] animate-slide-down md:block"
            style={{ top: searchPopover.top, left: searchPopover.left, width: searchPopover.width }}
          >
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No matches for <span className="font-medium text-foreground">{q}</span>
                </p>
                <Link
                  href="/search"
                  className="mt-3 inline-block text-xs font-semibold text-accent hover:underline"
                  onClick={() => setSearchOpen(false)}
                >
                  Browse all products
                </Link>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border/60 py-1">
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/product/${p.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-secondary/80"
                        role="option"
                      >
                        <img
                          src={p.image}
                          className="size-9 shrink-0 rounded-md object-cover ring-1 ring-border/50"
                          alt=""
                          width={36}
                          height={36}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium leading-snug text-foreground">{p.name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {p.category} · {p.brand}
                          </p>
                        </div>
                        <Price
                          amount={p.price}
                          size="sm"
                          className="shrink-0 !text-sm !font-semibold"
                          symbolClassName="!text-[0.65rem]"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border/70 bg-secondary/25 px-2 py-1.5">
                  <Link
                    href={`/search?q=${encodeURIComponent(q.trim())}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-foreground/80 transition hover:bg-secondary hover:text-foreground"
                  >
                    View all results
                    <ChevronRight className="size-3.5 opacity-60" aria-hidden />
                  </Link>
                </div>
              </>
            )}
          </div>,
          document.body,
        )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer open={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  );
}
