"use client";

import { useState, useEffect, useRef } from "react";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/components/site/ProductCard";

// Resolves an array of product IDs to Product objects.
// Checks the static PRODUCTS array first; fetches from API for any missing ones.
export function useProductCache(ids: string[]): {
  productsById: Record<string, Product>;
  loading: boolean;
} {
  const [apiCache, setApiCache] = useState<Record<string, Product>>({});
  const [loadingIds, setLoadingIds] = useState<Record<string, true>>({});
  const fetchedRef = useRef<Set<string>>(new Set());

  const key = ids.join(",");

  useEffect(() => {
    const missing = ids.filter(
      (id) => !PRODUCTS.find((p) => p.id === id) && !fetchedRef.current.has(id),
    );
    if (!missing.length) return;

    missing.forEach((id) => fetchedRef.current.add(id));
    setLoadingIds((prev) => {
      const next = { ...prev };
      missing.forEach((id) => { next[id] = true; });
      return next;
    });

    Promise.all(
      missing.map((id) =>
        fetch(`/api/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    ).then((results) => {
      const entries: Record<string, Product> = {};
      results.forEach((data, i) => {
        // The API wraps the product: { product: {...} }. Unwrap it.
        const p = data?.product ?? data;
        if (p) entries[missing[i]] = p;
      });
      if (Object.keys(entries).length) {
        setApiCache((prev) => ({ ...prev, ...entries }));
      }
      setLoadingIds((prev) => {
        const next = { ...prev };
        missing.forEach((id) => { delete next[id]; });
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const result: Record<string, Product> = {};
  ids.forEach((id) => {
    const local = PRODUCTS.find((p) => p.id === id);
    if (local) result[id] = local;
    else if (apiCache[id]) result[id] = apiCache[id];
  });

  const loading = ids.some(
    (id) =>
      !PRODUCTS.find((p) => p.id === id)
      && !apiCache[id]
      && (!fetchedRef.current.has(id) || !!loadingIds[id]),
  );

  return { productsById: result, loading };
}
