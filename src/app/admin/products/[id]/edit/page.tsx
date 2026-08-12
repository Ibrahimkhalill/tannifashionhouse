"use client";

import { use, useEffect, useState } from "react";
import { ProductFormPage } from "@/components/admin/ProductFormPage";
import { AdminFormSkeleton } from "@/components/admin/AdminSkeletons";
import { notFound } from "next/navigation";

type ApiProduct = Parameters<typeof ProductFormPage>[0]["initialProduct"];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ApiProduct | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setProduct(data?.product ?? null))
      .catch(() => setProduct(null));
  }, [id]);

  if (product === undefined) {
    return <AdminFormSkeleton />;
  }
  if (product === null) return notFound();

  return <ProductFormPage mode="edit" initialProduct={product} />;
}
