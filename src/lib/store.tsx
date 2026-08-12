"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { PRODUCTS } from "./products";
import type { Product } from "@/components/site/ProductCard";

export type CartItem = { id: string; qty: number; size?: string };
export type Order = {
  id: string;
  items: CartItem[];
  total: number;
  status: "placed" | "packed" | "shipped" | "delivered";
  createdAt: number;
  payment: string;
  address: string;
  name: string;
  phone: string;
  email?: string;
  discount?: number;
  shippingCost?: number;
};
export type ReviewReply = { id: string; user: string; text: string; createdAt: number };
export type Review = {
  id: string;
  productId: string;
  user: string;
  rating: number;
  text: string;
  createdAt: number;
  /** True when the reviewer had actually ordered this product */
  verified?: boolean;
  replies?: ReviewReply[];
  /** Customer photos attached to the review (data URLs or remote URLs) */
  images?: string[];
};
export type User = { name: string; phone: string; email?: string };
export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  district: string;
  isDefault: boolean;
};

type StoreCtx = {
  cart: CartItem[];
  wishlist: string[];
  compareList: string[];
  orders: Order[];
  reviews: Review[];
  addresses: Address[];
  user: User | null;
  addToCart: (id: string, opts?: { qty?: number; size?: string }) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  placeOrder: (data: Omit<Order, "id" | "items" | "total" | "status" | "createdAt">) => Order;
  addReview: (r: Omit<Review, "id" | "createdAt">) => void;
  addReviewReply: (reviewId: string, reply: Omit<ReviewReply, "id" | "createdAt">) => void;
  /** Whether the signed-in user has an order containing this product */
  hasPurchased: (productId: string) => boolean;
  login: (u: User) => void;
  logout: () => void;
  addAddress: (a: Omit<Address, "id">) => void;
  updateAddress: (id: string, a: Omit<Address, "id">) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  cartCount: number;
  cartSubtotal: number;
  resolveProduct: (id: string) => Product | undefined;
  authModalOpen: boolean;
  authModalTab: "login" | "signup";
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
};

const Ctx = createContext<StoreCtx | null>(null);

const MAX_COMPARE = 4;

function usePersist<T>(key: string, initial: T) {
  // Hydration-safe: first render always uses `initial` (matching the SSR
  // markup), then localStorage is loaded after mount. Writes are skipped
  // until that load completes so the stored value is never clobbered.
  const [v, setV] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setV(JSON.parse(raw) as T);
    } catch {}
    setHydrated(true);
  }, [key]);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v, hydrated]);
  return [v, setV] as const;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [cart, setCart] = usePersist<CartItem[]>("shopbd:cart", []);
  const [wishlist, setWishlist] = usePersist<string[]>("shopbd:wishlist", []);
  const [compareList, setCompareList] = usePersist<string[]>("shopbd:compare", []);
  const [orders, setOrders] = usePersist<Order[]>("shopbd:orders", []);
  const [reviews, setReviews] = usePersist<Review[]>("shopbd:reviews", []);
  const [user, setUser] = usePersist<User | null>("shopbd:user", null);
  const [addresses, setAddresses] = usePersist<Address[]>("shopbd:addresses", []);

  // Mirror the real NextAuth session into the local `user` shown across the UI.
  useEffect(() => {
    if (session?.user) {
      setUser({
        name: session.user.name ?? "Customer",
        phone: session.user.phone ?? "",
        email: session.user.email ?? undefined,
      });
    } else if (session === null) {
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  const openAuthModal = useCallback((tab: "login" | "signup" = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  // Products referenced by cart/wishlist/compare that aren't in the static
  // catalog (e.g. admin-created) are fetched from the API and cached here so
  // resolveProduct() and cartSubtotal work for every product, not just seeds.
  const [apiProducts, setApiProducts] = useState<Record<string, Product>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const ids = [...new Set([...cart.map((c) => c.id), ...wishlist, ...compareList])];
    const missing = ids.filter(
      (id) => !PRODUCTS.find((p) => p.id === id) && !apiProducts[id] && !fetchedRef.current.has(id),
    );
    if (!missing.length) return;
    missing.forEach((id) => fetchedRef.current.add(id));
    Promise.all(
      missing.map((id) =>
        fetch(`/api/products/${id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ),
    ).then((results) => {
      const entries: Record<string, Product> = {};
      results.forEach((data, i) => {
        // The API wraps the product: { product: {...} }. Unwrap it.
        const p = data?.product ?? data;
        if (p) entries[missing[i]] = p;
      });
      if (Object.keys(entries).length) setApiProducts((prev) => ({ ...prev, ...entries }));
    });
  }, [cart, wishlist, compareList, apiProducts]);

  const resolveProduct = useCallback(
    (id: string) => PRODUCTS.find((p) => p.id === id) ?? apiProducts[id],
    [apiProducts],
  );

  const addToCart: StoreCtx["addToCart"] = (id, opts) => {
    setCart((c) => {
      const existing = c.find((x) => x.id === id && x.size === opts?.size);
      if (existing) {
        return c.map((x) => x === existing ? { ...x, qty: x.qty + (opts?.qty ?? 1) } : x);
      }
      return [...c, { id, qty: opts?.qty ?? 1, size: opts?.size }];
    });
  };
  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));
  const setQty = (id: string, qty: number) => setCart((c) => c.map((x) => x.id === id ? { ...x, qty: Math.max(1, qty) } : x));
  const clearCart = () => setCart([]);
  const toggleWishlist = (id: string) =>
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  const addToCompare = useCallback((id: string) => {
    setCompareList((list) => {
      if (list.includes(id)) return list;
      if (list.length >= MAX_COMPARE) return list;
      return [...list, id];
    });
  }, [setCompareList]);

  const removeFromCompare = useCallback((id: string) => {
    setCompareList((list) => list.filter((x) => x !== id));
  }, [setCompareList]);

  const toggleCompare = useCallback((id: string) => {
    setCompareList((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length >= MAX_COMPARE) return list;
      return [...list, id];
    });
  }, [setCompareList]);

  const clearCompare = useCallback(() => setCompareList([]), [setCompareList]);

  const cartSubtotal = useMemo(
    () => cart.reduce((s, it) => s + (resolveProduct(it.id)?.price ?? 0) * it.qty, 0),
    [cart, resolveProduct],
  );
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);

  const placeOrder: StoreCtx["placeOrder"] = (data) => {
    const id = `BD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
    const order: Order = {
      ...data,
      id,
      items: cart,
      total: cartSubtotal + (cartSubtotal > 1500 ? 0 : 80),
      status: "placed",
      createdAt: Date.now(),
    };
    setOrders((o) => [order, ...o]);
    setCart([]);
    return order;
  };
  const addReview: StoreCtx["addReview"] = (r) =>
    setReviews((rs) => [{ ...r, id: crypto.randomUUID(), createdAt: Date.now() }, ...rs]);

  const addReviewReply: StoreCtx["addReviewReply"] = (reviewId, reply) =>
    setReviews((rs) => rs.map((r) =>
      r.id === reviewId
        ? { ...r, replies: [...(r.replies ?? []), { ...reply, id: crypto.randomUUID(), createdAt: Date.now() }] }
        : r,
    ));

  // Purchase check for review gating. Orders are stored per browser and
  // carry no account id, so any order containing the product counts.
  const hasPurchased: StoreCtx["hasPurchased"] = (productId) =>
    orders.some((o) => o.items.some((it) => String(it.id) === String(productId)));

  const login = (u: User) => setUser(u);
  const logout = () => { setUser(null); nextAuthSignOut({ redirect: false }); };

  const addAddress = (a: Omit<Address, "id">) => {
    const id = crypto.randomUUID();
    setAddresses((prev) => {
      const list = a.isDefault ? prev.map((x) => ({ ...x, isDefault: false })) : prev;
      return [...list, { ...a, id }];
    });
  };
  const updateAddress = (id: string, a: Omit<Address, "id">) => {
    setAddresses((prev) => {
      const list = a.isDefault ? prev.map((x) => ({ ...x, isDefault: false })) : prev;
      return list.map((x) => x.id === id ? { ...a, id } : x);
    });
  };
  const deleteAddress = (id: string) => setAddresses((prev) => prev.filter((x) => x.id !== id));
  const setDefaultAddress = (id: string) =>
    setAddresses((prev) => prev.map((x) => ({ ...x, isDefault: x.id === id })));

  return (
    <Ctx.Provider value={{
      cart, wishlist, compareList, orders, reviews, addresses, user,
      addToCart, removeFromCart, setQty, clearCart, toggleWishlist,
      addToCompare, removeFromCompare, toggleCompare, clearCompare,
      placeOrder, addReview, addReviewReply, hasPurchased, login, logout,
      addAddress, updateAddress, deleteAddress, setDefaultAddress,
      cartCount, cartSubtotal, resolveProduct,
      authModalOpen, authModalTab, openAuthModal, closeAuthModal,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}