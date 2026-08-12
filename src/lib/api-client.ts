// Typed fetch helpers for every API route.
// Import what you need in components/store — no raw fetch strings anywhere.

// ─── Base ─────────────────────────────────────────────────────────────────────

async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export function registerUser(data: {
  name: string;
  phone: string;
  email?: string;
  password: string;
}) {
  return api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductListParams = {
  category?: string;
  brand?: string;
  search?: string;
  sort?: "lh" | "hl" | "new";
  featured?: boolean;
  trending?: boolean;
  page?: number;
  limit?: number;
};

export function fetchProducts(params: ProductListParams = {}) {
  const q = new URLSearchParams();
  if (params.category)         q.set("category", params.category);
  if (params.brand)            q.set("brand",    params.brand);
  if (params.search)           q.set("search",   params.search);
  if (params.sort)             q.set("sort",     params.sort);
  if (params.featured)         q.set("featured", "true");
  if (params.trending)         q.set("trending", "true");
  if (params.page)             q.set("page",     String(params.page));
  if (params.limit)            q.set("limit",    String(params.limit));
  return api<{
    products: unknown[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/products?${q}`);
}

export function fetchProduct(id: string) {
  return api<{ product: unknown }>(`/api/products/${id}`);
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function fetchCategories(opts: { parentOnly?: boolean; parentSlug?: string } = {}) {
  const q = new URLSearchParams();
  if (opts.parentOnly) q.set("parent", "true");
  if (opts.parentSlug) q.set("slug",   opts.parentSlug);
  return api<{ categories: unknown[] }>(`/api/categories?${q}`);
}

export function fetchBrands() {
  return api<{ brands: unknown[] }>("/api/brands");
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export type CartItemInput = {
  productId: string;
  qty: number;
  size?: string;
  color?: string;
};

export function syncCart(items: CartItemInput[]) {
  return api("/api/cart", { method: "POST", body: JSON.stringify(items) });
}

export function updateCartItem(item: CartItemInput) {
  return api("/api/cart", { method: "PATCH", body: JSON.stringify(item) });
}

export function clearCart() {
  return api("/api/cart", { method: "DELETE" });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type PlaceOrderInput = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  division: string;
  notes?: string;
  deliveryArea: "inside" | "outside";
  payment: "cod" | "bkash" | "nagad" | "card";
  couponCode?: string;
  items: CartItemInput[];
};

export function placeOrder(data: PlaceOrderInput) {
  return api<{ order: unknown }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchMyOrders(page = 1) {
  return api<{ orders: unknown[]; total: number; totalPages: number }>(
    `/api/orders?page=${page}`
  );
}

export function fetchOrder(id: string, phone?: string) {
  const q = phone ? `?phone=${encodeURIComponent(phone)}` : "";
  return api<{ order: unknown }>(`/api/orders/${id}${q}`);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function fetchReviews(productId: string) {
  return api<{ reviews: unknown[] }>(`/api/reviews?productId=${productId}`);
}

export function submitReview(data: {
  productId: string;
  rating: number;
  text: string;
  images?: string[];
  guestName?: string;
}) {
  return api<{ review: unknown }>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function submitReviewReply(reviewId: string, data: { text: string; userName: string }) {
  return api<{ reply: unknown }>(`/api/reviews/${reviewId}/reply`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Upload failed");
  }
  const { url } = await res.json();
  return url as string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function fetchAdminProducts(page = 1) {
  return api<{ products: unknown[]; total: number; totalPages: number }>(
    `/api/admin/products?page=${page}`
  );
}

export function createAdminProduct(data: unknown) {
  return api("/api/admin/products", { method: "POST", body: JSON.stringify(data) });
}

export function updateAdminProduct(id: string, data: unknown) {
  return api(`/api/admin/products/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteAdminProduct(id: string) {
  return api(`/api/admin/products/${id}`, { method: "DELETE" });
}

export function fetchAdminOrders(params: { page?: number; status?: string; search?: string } = {}) {
  const q = new URLSearchParams();
  if (params.page)   q.set("page",   String(params.page));
  if (params.status) q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  return api<{ orders: unknown[]; total: number; totalPages: number }>(
    `/api/admin/orders?${q}`
  );
}

export function updateOrderStatus(id: string, status: string) {
  return api(`/api/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function fetchAdminDashboard() {
  return api<{ stats: unknown; recentOrders: unknown[] }>("/api/admin/dashboard");
}
