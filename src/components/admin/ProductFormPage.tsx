"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploadZone } from "@/components/admin/ImageUploadZone";
import {
  ChevronLeft, ChevronRight, RefreshCw, Plus, Trash2, X, Check,
  Package, Palette, Ruler, Layers, Save, FileText,
  ImageIcon, Eye, CircleDollarSign, Zap, Info,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type VariantType = "none" | "color" | "size" | "color+size";
type SizeRow  = { id: string; size: string; price: number; stock: number; sku: string };
type ColorRow = { color: string; image: string; price: number; stock: number; sku: string; sizes: SizeRow[] };

type ProductForm = {
  name: string; category: string; brand: string;
  price: number; oldPrice?: number;
  image: string; images: string[]; gallery: string[];
  badge?: { label: string; tone: "new" | "sale" | "trending" };
  material?: string; description: string;
  subcategory?: string; metaTitle?: string; metaDescription?: string;
  slug?: string; stock?: number; status?: "active" | "draft";
  categoryId?: string; brandId?: string; tags?: string[];
  variantType: VariantType; colorRows: ColorRow[]; sizeRows: SizeRow[];
};

// API-facing entity shapes (this file talks to /api/admin/* directly)
type ApiVariant = { id: string; size: string; color: string; price: number; stock: number; sku: string | null };
type ApiProduct = {
  id: string; slug: string; name: string; description: string | null;
  price: number; oldPrice: number | null; stock: number;
  images: string[]; colorImages: string[]; colors: string[]; sizes: string[];
  material: string | null; tags: string[]; badgeLabel: string | null;
  badgeTone: string | null; status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  featured: boolean; trending: boolean; metaTitle: string | null; metaDesc: string | null;
  categoryId: string | null; brandId: string | null; subcategory: string | null;
  category?: { name: string } | null; brand?: { name: string } | null;
  variants: ApiVariant[];
};
type ApiCategory = { id: string; name: string; slug: string; parentId: string | null; status: "ACTIVE" | "INACTIVE" };
type ApiBrand = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };
type ApiSize = { id: string; name: string; status: "ACTIVE" | "INACTIVE" };
type ApiColor = { id: string; name: string; hex: string; status: "ACTIVE" | "INACTIVE" };
type ApiBadge = { id: string; label: string; tone: "new" | "sale" | "trending"; status: "active" | "inactive" };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const emptyForm = (): ProductForm => ({
  name: "", category: "", brand: "", price: 0, oldPrice: undefined,
  image: "", images: [], gallery: [], badge: undefined, material: "",
  description: "", subcategory: "", metaTitle: "", metaDescription: "",
  slug: "", stock: 0, status: "active", categoryId: "", brandId: "",
  tags: [], variantType: "none", colorRows: [], sizeRows: [],
});

const emptySizeRow  = (): SizeRow  => ({ id: uid(), size: "", price: 0, stock: 0, sku: "" });
const emptyColorRow = (hex: string): ColorRow => ({ color: hex, image: "", price: 0, stock: 0, sku: "", sizes: [] });

function detectVariantType(p: ApiProduct): VariantType {
  const hasColors = (p.colors ?? []).length > 0;
  const hasSizes  = (p.sizes  ?? []).length > 0;
  if (hasColors && hasSizes) return "color+size";
  if (hasColors) return "color";
  if (hasSizes)  return "size";
  return "none";
}

function buildColorRows(p: ApiProduct): ColorRow[] {
  return (p.colors ?? []).map((hex, i) => {
    const vars = (p.variants ?? []).filter((v) => v.color === hex);
    return {
      color: hex, image: (p.colorImages ?? [])[i] ?? "",
      price: vars[0]?.price ?? p.price, stock: vars[0]?.stock ?? 0, sku: vars[0]?.sku ?? "",
      sizes: vars.map((v) => ({ id: v.id, size: v.size, price: v.price, stock: v.stock, sku: v.sku ?? "" })),
    };
  });
}

function buildSizeRows(p: ApiProduct): SizeRow[] {
  const sv = (p.variants ?? []).filter((v) => !v.color && v.size);
  if (sv.length) return sv.map((v) => ({ id: v.id, size: v.size, price: v.price, stock: v.stock, sku: v.sku ?? "" }));
  return (p.sizes ?? []).map((s) => ({ id: uid(), size: s, price: p.price, stock: 0, sku: "" }));
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { key: "basic",   label: "Basic Info",      sub: "Name & details",   icon: FileText },
  { key: "pricing", label: "Price & Variants", sub: "One place only",  icon: CircleDollarSign },
  { key: "media",   label: "Images & SEO",    sub: "Photos & search",  icon: ImageIcon },
] as const;

// ─── Field atoms (bigger, friendlier) ─────────────────────────────────────────
function FieldLabel({ children, required, hint }: { children: React.ReactNode; required?: boolean; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <label className="block text-sm font-semibold text-slate-700">
        {children}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
    </div>
  );
}
function TInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full h-10 px-3.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition bg-white placeholder:text-slate-400 ${props.className ?? ""}`} />
  );
}
function TSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={`w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition bg-white ${props.className ?? ""}`} />
  );
}
function RowInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className={`w-full h-10 px-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 transition bg-white placeholder:text-slate-300 ${props.className ?? ""}`} />
  );
}

// ─── Color image upload ───────────────────────────────────────────────────────
function ColorImgBtn({ src, onFile, onClear, size = 12 }: { src: string; onFile: (f: File) => void; onClear: () => void; size?: number }) {
  const id = `ci-${uid()}`;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; };
  const cls = size === 14 ? "size-14" : "size-12";
  if (src) {
    return (
      <div className="relative group/ci shrink-0">
        <img src={src} alt="" className={`${cls} rounded-xl object-cover border border-slate-200`} />
        <button type="button" onClick={onClear}
          className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow opacity-0 group-hover/ci:opacity-100 transition">
          <X className="size-3" />
        </button>
        <label htmlFor={id} className="absolute inset-0 cursor-pointer rounded-xl" />
        <input id={id} type="file" accept="image/*" className="hidden" onChange={onChange} />
      </div>
    );
  }
  return (
    <label htmlFor={id}
      className={`${cls} shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50/30 cursor-pointer transition`}>
      <ImageIcon className="size-4 text-slate-400" />
      <span className="text-[8px] font-bold text-slate-400 uppercase">Photo</span>
      <input id={id} type="file" accept="image/*" className="hidden" onChange={onChange} />
    </label>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props {
  mode: "add" | "edit";
  initialProduct?: ApiProduct;
}

export function ProductFormPage({ mode, initialProduct }: Props) {
  const router = useRouter();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [brands, setBrands]         = useState<ApiBrand[]>([]);
  const [sizes, setSizes]           = useState<ApiSize[]>([]);
  const [colors, setColors]         = useState<ApiColor[]>([]);
  const [badges, setBadges]         = useState<ApiBadge[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/brands").then((r) => r.json()),
      fetch("/api/admin/sizes").then((r) => r.json()),
      fetch("/api/admin/colors").then((r) => r.json()),
      fetch("/api/admin/badges").then((r) => r.json()),
    ]).then(([cat, br, sz, co, bd]) => {
      setCategories(cat.categories ?? []);
      setBrands(br.brands ?? []);
      setSizes(sz.sizes ?? []);
      setColors(co.colors ?? []);
      setBadges(bd.badges ?? []);
    }).catch(() => toast.error("Failed to load product attributes"));
  }, []);

  const activeCategories = useMemo(() => categories.filter((c) => c.status === "ACTIVE"), [categories]);
  const activeBrands     = useMemo(() => brands.filter((b) => b.status === "ACTIVE"), [brands]);
  const activeSizes      = useMemo(() => sizes.filter((s) => s.status === "ACTIVE"), [sizes]);
  const activeColors     = useMemo(() => colors.filter((c) => c.status === "ACTIVE"), [colors]);
  const activeBadges     = useMemo(() => badges.filter((b) => b.status === "active"), [badges]);

  const [form, setForm] = useState<ProductForm>(() => {
    if (mode === "edit" && initialProduct) {
      const p = initialProduct;
      return {
        name: p.name, category: p.category?.name ?? "", brand: p.brand?.name ?? "",
        price: p.price, oldPrice: p.oldPrice ?? undefined,
        image: p.images?.[0] ?? "", images: (p.images ?? []).slice(1), gallery: (p.images ?? []).slice(1),
        badge: p.badgeLabel ? { label: p.badgeLabel, tone: (p.badgeTone as "new" | "sale" | "trending") ?? "new" } : undefined,
        material: p.material ?? "", description: p.description ?? "",
        subcategory: p.subcategory ?? "", metaTitle: p.metaTitle ?? "",
        metaDescription: p.metaDesc ?? "", slug: p.slug ?? slugify(p.name),
        stock: p.stock ?? 0, status: p.status === "DRAFT" ? "draft" : "active",
        categoryId: p.categoryId ?? "", brandId: p.brandId ?? "",
        tags: p.tags ?? [], variantType: detectVariantType(p),
        colorRows: buildColorRows(p), sizeRows: buildSizeRows(p),
      };
    }
    return emptyForm();
  });

  const [step, setStep]             = useState(0);
  const [colorInput, setColorInput] = useState("#ef4444");
  const [saving, setSaving]         = useState(false);
  // Daraz-style quick fill
  const [quickPrice, setQuickPrice] = useState("");
  const [quickStock, setQuickStock] = useState("");

  const subcategoriesForSelected = useMemo(
    () => form.categoryId ? activeCategories.filter((c) => c.parentId === form.categoryId) : [],
    [activeCategories, form.categoryId]
  );

  const hasVariants = form.variantType !== "none";

  // ── Variant-derived price & stock (single source of truth) ─────────────────
  const variantPrices = useMemo(() => {
    if (form.variantType === "color")      return form.colorRows.map((r) => r.price).filter((p) => p > 0);
    if (form.variantType === "size")       return form.sizeRows.map((r) => r.price).filter((p) => p > 0);
    if (form.variantType === "color+size") return form.colorRows.flatMap((r) => r.sizes.map((s) => s.price)).filter((p) => p > 0);
    return [];
  }, [form.variantType, form.colorRows, form.sizeRows]);

  const variantStockTotal = useMemo(() => {
    if (form.variantType === "color")      return form.colorRows.reduce((a, r) => a + (r.stock || 0), 0);
    if (form.variantType === "size")       return form.sizeRows.reduce((a, r) => a + (r.stock || 0), 0);
    if (form.variantType === "color+size") return form.colorRows.reduce((a, r) => a + r.sizes.reduce((b, s) => b + (s.stock || 0), 0), 0);
    return 0;
  }, [form.variantType, form.colorRows, form.sizeRows]);

  const minVarPrice = variantPrices.length ? Math.min(...variantPrices) : 0;
  const maxVarPrice = variantPrices.length ? Math.max(...variantPrices) : 0;

  // What customers actually see as "the price"
  const effectivePrice = hasVariants ? minVarPrice : form.price;
  const effectiveStock = hasVariants ? variantStockTotal : (form.stock ?? 0);

  const discount = form.oldPrice && form.oldPrice > effectivePrice && effectivePrice > 0
    ? Math.round((1 - effectivePrice / form.oldPrice) * 100) : 0;
  const savings = form.oldPrice && form.oldPrice > effectivePrice ? form.oldPrice - effectivePrice : 0;

  // ── Images ──────────────────────────────────────────────────────────────────
  const allImages = useMemo(() => {
    const seen = new Set<string>(); const out: string[] = [];
    [form.image, ...form.images, ...form.gallery].forEach((u) => { if (u && !seen.has(u)) { seen.add(u); out.push(u); } });
    return out;
  }, [form.image, form.images, form.gallery]);

  const handleImagesChange = (imgs: string[]) =>
    setForm((f) => ({ ...f, image: imgs[0] ?? "", images: imgs.slice(1), gallery: imgs.slice(1) }));

  // ── Color helpers ───────────────────────────────────────────────────────────
  const selectedColorHexes = form.colorRows.map((r) => r.color);

  const toggleColor = (hex: string) => setForm((f) => ({
    ...f,
    colorRows: selectedColorHexes.includes(hex)
      ? f.colorRows.filter((r) => r.color !== hex)
      : [...f.colorRows, emptyColorRow(hex)],
  }));

  const addCustomColor = () => {
    if (!selectedColorHexes.includes(colorInput))
      setForm((f) => ({ ...f, colorRows: [...f.colorRows, emptyColorRow(colorInput)] }));
  };

  const updateColorRow = (hex: string, patch: Partial<ColorRow>) =>
    setForm((f) => ({ ...f, colorRows: f.colorRows.map((r) => r.color === hex ? { ...r, ...patch } : r) }));

  const removeColorRow = (hex: string) =>
    setForm((f) => ({ ...f, colorRows: f.colorRows.filter((r) => r.color !== hex) }));

  const handleColorImg = (hex: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    if (file.size > 8 * 1024 * 1024)    { toast.error("Max 8 MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => updateColorRow(hex, { image: e.target?.result as string });
    reader.readAsDataURL(file);
  };

  const addSizeToColor = (hex: string) =>
    setForm((f) => ({ ...f, colorRows: f.colorRows.map((r) => r.color === hex ? { ...r, sizes: [...r.sizes, emptySizeRow()] } : r) }));

  const updateColorSize = (hex: string, sid: string, patch: Partial<SizeRow>) =>
    setForm((f) => ({ ...f, colorRows: f.colorRows.map((r) => r.color === hex ? { ...r, sizes: r.sizes.map((s) => s.id === sid ? { ...s, ...patch } : s) } : r) }));

  const removeColorSize = (hex: string, sid: string) =>
    setForm((f) => ({ ...f, colorRows: f.colorRows.map((r) => r.color === hex ? { ...r, sizes: r.sizes.filter((s) => s.id !== sid) } : r) }));

  // ── Size-only helpers ───────────────────────────────────────────────────────
  const addSizeRow    = () => setForm((f) => ({ ...f, sizeRows: [...f.sizeRows, emptySizeRow()] }));
  const updateSizeRow = (id: string, patch: Partial<SizeRow>) =>
    setForm((f) => ({ ...f, sizeRows: f.sizeRows.map((r) => r.id === id ? { ...r, ...patch } : r) }));
  const removeSizeRow = (id: string) => setForm((f) => ({ ...f, sizeRows: f.sizeRows.filter((r) => r.id !== id) }));

  // ── Daraz-style "Apply to All" ──────────────────────────────────────────────
  const applyToAll = () => {
    const p = Number(quickPrice) || 0;
    const hasQ = quickStock.trim() !== "";
    const q = Number(quickStock) || 0;
    if (!p && !hasQ) { toast.error("Enter price or quantity first"); return; }

    if (form.variantType === "color") {
      setForm((f) => ({ ...f, colorRows: f.colorRows.map((r) => ({ ...r, price: p || r.price, stock: hasQ ? q : r.stock })) }));
    } else if (form.variantType === "size") {
      setForm((f) => ({ ...f, sizeRows: f.sizeRows.map((r) => ({ ...r, price: p || r.price, stock: hasQ ? q : r.stock })) }));
    } else if (form.variantType === "color+size") {
      setForm((f) => ({
        ...f,
        colorRows: f.colorRows.map((r) => ({ ...r, sizes: r.sizes.map((s) => ({ ...s, price: p || s.price, stock: hasQ ? q : s.stock })) })),
      }));
    }
    toast.success("Applied to all variants ✓");
  };

  // ── Step validation ─────────────────────────────────────────────────────────
  const totalVariantCount =
    form.variantType === "color"      ? form.colorRows.length :
    form.variantType === "size"       ? form.sizeRows.filter((r) => r.size).length :
    form.variantType === "color+size" ? form.colorRows.reduce((a, r) => a + r.sizes.length, 0) : 0;

  const stepError = (s: number): string | null => {
    if (s === 0 && !form.name.trim()) return "Product name is required";
    if (s === 1) {
      if (!hasVariants && form.price <= 0) return "Enter the sale price";
      if (hasVariants && totalVariantCount === 0) return "Add at least one variant";
      if (hasVariants && minVarPrice <= 0) return "Every variant needs a price — use Apply to All";
    }
    return null;
  };

  const stepDone = (s: number): boolean => {
    if (s === 0) return !!form.name.trim();
    if (s === 1) return hasVariants ? (totalVariantCount > 0 && minVarPrice > 0) : form.price > 0;
    if (s === 2) return allImages.length > 0;
    return false;
  };

  const goNext = () => {
    const err = stepError(step);
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => { setStep((s) => Math.max(0, s - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (saveStatus: "active" | "draft") => {
    if (!form.name.trim()) { toast.error("Product name is required"); setStep(0); return; }
    if (saveStatus === "active") {
      const err = stepError(1);
      if (err) { toast.error(err); setStep(1); return; }
    }
    setSaving(true);

    let derivedColors: string[] = [], derivedColorImages: string[] = [];
    let derivedSizes: string[] = [];
    let derivedVariants: { size: string; color: string; price: number; stock: number; sku?: string }[] = [];

    if (form.variantType === "color") {
      derivedColors      = form.colorRows.map((r) => r.color);
      derivedColorImages = form.colorRows.map((r) => r.image);
      derivedVariants    = form.colorRows.map((r) => ({ color: r.color, size: "", price: r.price || effectivePrice, stock: r.stock, sku: r.sku || undefined }));
    } else if (form.variantType === "size") {
      derivedSizes    = form.sizeRows.map((r) => r.size).filter(Boolean);
      derivedVariants = form.sizeRows.filter((r) => r.size).map((r) => ({ color: "", size: r.size, price: r.price || effectivePrice, stock: r.stock, sku: r.sku || undefined }));
    } else if (form.variantType === "color+size") {
      derivedColors      = form.colorRows.map((r) => r.color);
      derivedColorImages = form.colorRows.map((r) => r.image);
      derivedSizes       = [...new Set(form.colorRows.flatMap((r) => r.sizes.map((s) => s.size)).filter(Boolean))];
      derivedVariants    = form.colorRows.flatMap((r) => r.sizes.map((s) => ({ color: r.color, size: s.size, price: s.price || effectivePrice, stock: s.stock, sku: s.sku || undefined })));
    }

    const allImgs = [form.image, ...form.images.filter((x) => x && x !== form.image)].filter(Boolean);

    const payload = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || undefined,
      price: hasVariants ? (minVarPrice || form.price) : form.price,
      oldPrice: form.oldPrice || undefined,
      stock: hasVariants ? variantStockTotal : (form.stock ?? 0),
      images: allImgs.length ? allImgs : ["https://placehold.co/600x600?text=No+Image"],
      colorImages: derivedColorImages,
      colors: derivedColors,
      sizes: derivedSizes,
      material: form.material || undefined,
      tags: form.tags ?? [],
      badgeLabel: form.badge?.label,
      badgeTone: form.badge?.tone,
      status: saveStatus === "draft" ? "DRAFT" : "ACTIVE",
      featured: false,
      trending: false,
      metaTitle: form.metaTitle || undefined,
      metaDesc: form.metaDescription || undefined,
      categoryId: form.categoryId || undefined,
      brandId: form.brandId || undefined,
      subcategory: form.subcategory || undefined,
      variants: derivedVariants,
    };

    try {
      const res = mode === "edit" && initialProduct
        ? await fetch(`/api/admin/products/${initialProduct.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/products", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save product");
        return;
      }

      toast.success(mode === "edit" ? "Product updated" : "Product published! 🎉");
      router.push("/admin/products");
    } finally {
      setSaving(false);
    }
  };

  const VARIANT_TYPES: { key: VariantType; label: string; sub: string; icon: React.ReactNode }[] = [
    { key: "none",       label: "No Variants",  sub: "One price for everything",   icon: <Package className="size-4" /> },
    { key: "color",      label: "Colors",       sub: "Each color: photo + price",  icon: <Palette className="size-4" /> },
    { key: "size",       label: "Sizes",        sub: "S / M / L or 64GB / 128GB",  icon: <Ruler   className="size-4" /> },
    { key: "color+size", label: "Color + Size", sub: "Fashion — full combination", icon: <Layers  className="size-4" /> },
  ];

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="max-w-6xl mx-auto pb-12">

      {/* ══ Top bar ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/products"
            className="size-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-500 shrink-0">
            <ChevronLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Products / {mode === "edit" ? "Edit" : "New"}</p>
            <h1 className="text-lg font-bold text-slate-900 truncate">
              {form.name.trim() || (mode === "edit" ? "Edit Product" : "New Product")}
            </h1>
          </div>
        </div>
        <button type="button" onClick={() => handleSave("draft")} disabled={saving}
          className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shrink-0 disabled:opacity-50">
          Save Draft
        </button>
      </div>

      {/* ══ Stepper ══════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 mb-6 shadow-sm">
        <div className="grid grid-cols-3 gap-1.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = stepDone(i) && !active;
            return (
              <button key={s.key} type="button"
                onClick={() => { if (i <= step || stepDone(step)) setStep(i); }}
                className={`relative flex items-center justify-center sm:justify-start gap-2.5 px-3 sm:px-4 py-3 rounded-xl transition ${
                  active ? "bg-[#0f172a] text-white shadow-md" : "hover:bg-slate-50 text-slate-500"
                }`}>
                <span className={`size-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  active ? "bg-white/15 text-white"
                  : done ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-400"
                }`}>
                  {done ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span className="hidden sm:flex flex-col items-start min-w-0">
                  <span className={`text-xs font-bold leading-tight ${active ? "text-white" : "text-slate-700"}`}>{s.label}</span>
                  <span className={`text-[10px] leading-tight ${active ? "text-slate-300" : "text-slate-400"}`}>{s.sub}</span>
                </span>
                <Icon className={`size-4 sm:hidden ${active ? "text-white" : "text-slate-400"}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Content + Live Preview ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ─── STEP CONTENT ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">

          {/* ════ STEP 1 — BASIC INFO ════════════════════════════════════════ */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tell us about the product</h2>
                <p className="text-sm text-slate-400 mt-0.5">Name it, place it, describe it</p>
              </div>

              <div>
                <FieldLabel required>Product Name</FieldLabel>
                <TInput value={form.name} autoFocus
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                  placeholder="e.g. Samsung Galaxy A55 5G — 8/128GB" className="h-11 font-semibold" />
                {form.slug && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-slate-400 font-mono truncate">shopbd.com/product/{form.slug}</span>
                    <button type="button" onClick={() => setForm((f) => ({ ...f, slug: slugify(f.name) }))}
                      className="size-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-600 transition shrink-0" title="Regenerate">
                      <RefreshCw className="size-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Category</FieldLabel>
                  <TSelect value={form.categoryId || ""}
                    onChange={(e) => {
                      const cat = activeCategories.find((c) => c.id === e.target.value);
                      setForm((f) => ({ ...f, category: cat?.name ?? "", categoryId: e.target.value, subcategory: "" }));
                    }}>
                    <option value="">Choose category…</option>
                    {activeCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.parentId ? `   ↳ ${c.name}` : c.name}</option>
                    ))}
                  </TSelect>
                </div>
                <div>
                  <FieldLabel>Brand</FieldLabel>
                  <TSelect value={form.brandId || ""}
                    onChange={(e) => {
                      const b = activeBrands.find((x) => x.id === e.target.value);
                      setForm((f) => ({ ...f, brand: b?.name ?? "", brandId: e.target.value }));
                    }}>
                    <option value="">Choose brand…</option>
                    {activeBrands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </TSelect>
                </div>
              </div>

              {subcategoriesForSelected.length > 0 && (
                <div>
                  <FieldLabel>Subcategory</FieldLabel>
                  <TSelect value={form.subcategory ?? ""} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}>
                    <option value="">None</option>
                    {subcategoriesForSelected.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </TSelect>
                </div>
              )}

              <div>
                <FieldLabel hint="Recommended — boosts sales">Description</FieldLabel>
                <RichTextEditor value={form.description}
                  onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                  placeholder="Materials, features, why customers will love it…"
                  minHeight={220} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Material</FieldLabel>
                  <TInput value={form.material ?? ""} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                    placeholder="e.g. 100% Cotton" />
                </div>
                <div>
                  <FieldLabel hint="comma-separated">Tags</FieldLabel>
                  <TInput value={(form.tags ?? []).join(", ")}
                    onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) }))}
                    placeholder="summer, casual, trending" />
                </div>
              </div>

              <div>
                <FieldLabel>Badge on product card</FieldLabel>
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, badge: undefined }))}
                    className={`h-9 px-4 rounded-full text-xs font-semibold border-2 transition ${!form.badge ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                    None
                  </button>
                  {activeBadges.map((b) => (
                    <button key={b.id} type="button"
                      onClick={() => setForm((f) => ({ ...f, badge: { label: b.label, tone: b.tone } }))}
                      className={`h-9 px-4 rounded-full text-xs font-semibold border-2 transition ${form.badge?.label === b.label ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ════ STEP 2 — PRICE & VARIANTS (Daraz-style, one place) ═════════ */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Price, Stock & Variants</h2>
                <p className="text-sm text-slate-400 mt-0.5">Does this product come in different options?</p>
              </div>

              {/* Variant type cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VARIANT_TYPES.map((vt) => {
                  const active = form.variantType === vt.key;
                  return (
                    <button key={vt.key} type="button"
                      onClick={() => setForm((f) => ({ ...f, variantType: vt.key, colorRows: [], sizeRows: [] }))}
                      className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition text-left ${
                        active ? "border-[#ef4444] bg-red-50/60 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}>
                      <span className={`size-10 shrink-0 rounded-xl flex items-center justify-center ${active ? "bg-[#ef4444] text-white" : "bg-slate-100 text-slate-400"}`}>
                        {vt.icon}
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className={`text-sm font-bold ${active ? "text-red-600" : "text-slate-700"}`}>{vt.label}</span>
                        <span className="text-xs text-slate-400 leading-snug">{vt.sub}</span>
                      </span>
                      {active && (
                        <span className="absolute top-2.5 right-2.5 size-5 bg-[#ef4444] rounded-full flex items-center justify-center">
                          <Check className="size-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ══ MODE A: Single price (no variants) ══ */}
              {!hasVariants && (
                <div className="space-y-6 pt-2">
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200">
                    <FieldLabel required>Sale Price — what customers pay</FieldLabel>
                    <div className="relative max-w-xs">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-300">৳</span>
                      <input type="number" min="0" value={form.price || ""} autoFocus
                        onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                        placeholder="0"
                        className="w-full h-12 pl-9 pr-4 rounded-xl border-2 border-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 text-xl font-bold text-slate-900 outline-none transition bg-white" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                      <div>
                        <FieldLabel hint="optional — shows crossed out">Original Price (MRP)</FieldLabel>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
                          <TInput type="number" min="0" value={form.oldPrice || ""}
                            onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value ? Number(e.target.value) : undefined }))}
                            placeholder="e.g. 1500" className="pl-8" />
                        </div>
                      </div>
                      <div>
                        <FieldLabel>Stock Quantity</FieldLabel>
                        <TInput type="number" min="0" value={form.stock || ""}
                          onChange={(e) => setForm((f) => ({ ...f, stock: Number(e.target.value) }))} placeholder="e.g. 100" />
                      </div>
                    </div>

                    {savings > 0 && (
                      <div className="flex items-center gap-2.5 mt-4 px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100 w-fit">
                        <span className="text-base font-bold text-slate-900">৳{effectivePrice.toLocaleString()}</span>
                        <span className="text-sm text-slate-400 line-through">৳{form.oldPrice?.toLocaleString()}</span>
                        <span className="text-xs bg-red-500 text-white font-bold px-2 py-1 rounded-full">−{discount}%</span>
                        <span className="text-[13px] font-semibold text-emerald-600">saves ৳{savings.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ MODE B: Variants — price set per variant only ══ */}
              {hasVariants && (
                <div className="space-y-5 pt-2">

                  {/* Info: price comes from variants */}
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[13.5px] text-blue-900 leading-relaxed">
                      <span className="font-bold">Price is set per variant below — only once.</span><br />
                      The product page will automatically show the lowest variant price{minVarPrice > 0 && maxVarPrice > minVarPrice ? ` (from ৳${minVarPrice.toLocaleString()})` : ""}.
                    </p>
                  </div>

                  {/* Color picker */}
                  {(form.variantType === "color" || form.variantType === "color+size") && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        1. Tap colors to add
                        <span className="ml-2 text-xs font-normal text-slate-400">from Attributes › Colors</span>
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {activeColors.map((c) => {
                          const sel = selectedColorHexes.includes(c.hex);
                          return (
                            <button key={c.id} type="button" onClick={() => toggleColor(c.hex)} title={c.name}
                              className="flex flex-col items-center gap-1">
                              <span className={`relative size-9 rounded-full border-4 transition ${sel ? "border-[#ef4444] scale-110 shadow-lg" : "border-white shadow hover:scale-105"}`}
                                style={{ background: c.hex }}>
                                {sel && (
                                  <span className="absolute -top-1 -right-1 size-4 bg-[#ef4444] rounded-full flex items-center justify-center border-2 border-white">
                                    <Check className="size-2 text-white" />
                                  </span>
                                )}
                              </span>
                              <span className={`text-[10px] font-medium ${sel ? "text-red-600" : "text-slate-500"}`}>{c.name}</span>
                            </button>
                          );
                        })}
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <input type="color" value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                              className="size-9 rounded-full cursor-pointer border-4 border-white shadow p-0 overflow-hidden" />
                            <button type="button" onClick={addCustomColor}
                              className="h-7 px-2.5 rounded-full bg-white border border-slate-200 hover:border-slate-400 text-[10px] font-bold text-slate-600 transition">
                              + Add
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400">Custom</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick fill — Daraz "Apply to All" */}
                  {totalVariantCount > 0 || form.sizeRows.length > 0 || form.colorRows.length > 0 ? (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Zap className="size-4 text-amber-500" />
                        <p className="text-sm font-bold text-slate-700">Quick fill — set same price/stock for all</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
                          <input type="number" min="0" value={quickPrice}
                            onChange={(e) => setQuickPrice(e.target.value)}
                            placeholder="Price"
                            className="w-full h-10 pl-7 pr-3 rounded-xl border border-amber-300 bg-white text-sm font-semibold outline-none focus:border-amber-500 transition" />
                        </div>
                        <input type="number" min="0" value={quickStock}
                          onChange={(e) => setQuickStock(e.target.value)}
                          placeholder="Qty"
                          className="w-20 h-10 px-3 rounded-xl border border-amber-300 bg-white text-sm font-semibold outline-none focus:border-amber-500 transition" />
                        <button type="button" onClick={applyToAll}
                          className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm">
                          Apply to All
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* COLOR ONLY rows */}
                  {form.variantType === "color" && form.colorRows.length > 0 && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="hidden sm:grid grid-cols-[64px_1fr_130px_90px_110px_40px] gap-3 items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Photo</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Color</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Price ৳ *</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">Qty</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">SKU</span>
                        <span />
                      </div>
                      <div className="divide-y divide-slate-100">
                        {form.colorRows.map((row) => {
                          const cName = activeColors.find((ac) => ac.hex === row.color)?.name ?? row.color;
                          return (
                            <div key={row.color} className="grid grid-cols-[64px_1fr_40px] sm:grid-cols-[64px_1fr_130px_90px_110px_40px] gap-3 items-center px-4 py-3">
                              <ColorImgBtn src={row.image} onFile={(f) => handleColorImg(row.color, f)} onClear={() => updateColorRow(row.color, { image: "" })} />
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="size-4 rounded-full shrink-0 border-2 border-white shadow ring-1 ring-slate-200" style={{ background: row.color }} />
                                <span className="text-sm font-semibold text-slate-700 truncate">{cName}</span>
                              </div>
                              <div className="col-span-3 sm:col-span-1 sm:contents">
                                <div className="grid grid-cols-3 sm:contents gap-2 mt-2 sm:mt-0">
                                  <RowInput type="number" min="0" value={row.price || ""}
                                    onChange={(e) => updateColorRow(row.color, { price: Number(e.target.value) })}
                                    placeholder="৳" />
                                  <RowInput type="number" min="0" value={row.stock || ""}
                                    onChange={(e) => updateColorRow(row.color, { stock: Number(e.target.value) })} placeholder="Qty" />
                                  <RowInput value={row.sku} onChange={(e) => updateColorRow(row.color, { sku: e.target.value })} placeholder="SKU" className="text-xs" />
                                </div>
                              </div>
                              <button type="button" onClick={() => removeColorRow(row.color)}
                                className="size-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition shrink-0 row-start-1 col-start-3 sm:row-auto sm:col-auto">
                                <X className="size-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SIZE ONLY rows */}
                  {form.variantType === "size" && (
                    <div className="space-y-3">
                      {form.sizeRows.length > 0 && (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div className="hidden sm:grid grid-cols-[1fr_130px_90px_110px_40px] gap-3 items-center px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Size / Option</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Price ৳ *</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Qty</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">SKU</span>
                            <span />
                          </div>
                          <div className="divide-y divide-slate-100">
                            {form.sizeRows.map((row) => (
                              <div key={row.id} className="grid grid-cols-[1fr_40px] sm:grid-cols-[1fr_130px_90px_110px_40px] gap-3 items-center px-4 py-3">
                                <TSelect value={row.size} onChange={(e) => updateSizeRow(row.id, { size: e.target.value })}>
                                  <option value="">Choose size…</option>
                                  {activeSizes.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </TSelect>
                                <div className="col-span-2 sm:col-span-1 sm:contents">
                                  <div className="grid grid-cols-3 sm:contents gap-2">
                                    <RowInput type="number" min="0" value={row.price || ""}
                                      onChange={(e) => updateSizeRow(row.id, { price: Number(e.target.value) })} placeholder="৳" />
                                    <RowInput type="number" min="0" value={row.stock || ""}
                                      onChange={(e) => updateSizeRow(row.id, { stock: Number(e.target.value) })} placeholder="Qty" />
                                    <RowInput value={row.sku} onChange={(e) => updateSizeRow(row.id, { sku: e.target.value })} placeholder="SKU" className="text-xs" />
                                  </div>
                                </div>
                                <button type="button" onClick={() => removeSizeRow(row.id)}
                                  className="size-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition shrink-0 row-start-1 col-start-2 sm:row-auto sm:col-auto">
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button type="button" onClick={addSizeRow}
                        className="w-full h-10 rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 hover:bg-red-50/30 text-xs font-bold text-slate-500 hover:text-red-500 transition flex items-center justify-center gap-2">
                        <Plus className="size-3.5" /> Add Size / Option
                      </button>
                    </div>
                  )}

                  {/* COLOR + SIZE cards */}
                  {form.variantType === "color+size" && form.colorRows.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-slate-700">
                        2. Add sizes under each color
                        <span className="ml-2 text-xs font-normal text-slate-400">{totalVariantCount} variant{totalVariantCount !== 1 ? "s" : ""} total</span>
                      </p>
                      {form.colorRows.map((row) => {
                        const cName = activeColors.find((ac) => ac.hex === row.color)?.name ?? row.color;
                        return (
                          <div key={row.color} className="border border-slate-200 rounded-2xl overflow-hidden">
                            {/* Color header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                              <ColorImgBtn src={row.image} onFile={(f) => handleColorImg(row.color, f)} onClear={() => updateColorRow(row.color, { image: "" })} />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="size-4 rounded-full shrink-0 border-2 border-white shadow ring-1 ring-slate-200" style={{ background: row.color }} />
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-slate-700 truncate">{cName}</p>
                                  <p className="text-[10px] text-slate-400">{row.sizes.length} size{row.sizes.length !== 1 ? "s" : ""} · tap photo to upload</p>
                                </div>
                              </div>
                              <button type="button" onClick={() => removeColorRow(row.color)}
                                className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition shrink-0">
                                <X className="size-4" />
                              </button>
                            </div>

                            {/* Size rows — table layout */}
                            {row.sizes.length > 0 && (
                              <div className="overflow-x-auto">
                                {/* Column headers */}
                                <div className="grid grid-cols-[1fr_120px_90px_100px_40px] gap-2 items-center px-4 py-2 bg-slate-50/50 border-b border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Size</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Price ৳ *</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Qty *</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">SKU</span>
                                  <span />
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {row.sizes.map((s) => (
                                    <div key={s.id} className="grid grid-cols-[1fr_120px_90px_100px_40px] gap-2 items-center px-4 py-2.5">
                                      <select
                                        value={s.size}
                                        onChange={(e) => updateColorSize(row.color, s.id, { size: e.target.value })}
                                        className="h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition bg-white w-full">
                                        <option value="">Choose…</option>
                                        {activeSizes.map((sz) => <option key={sz.id} value={sz.name}>{sz.name}</option>)}
                                      </select>
                                      <RowInput
                                        type="number" min="0"
                                        value={s.price || ""}
                                        onChange={(e) => updateColorSize(row.color, s.id, { price: Number(e.target.value) })}
                                        placeholder="e.g. 1200" />
                                      <RowInput
                                        type="number" min="0"
                                        value={s.stock || ""}
                                        onChange={(e) => updateColorSize(row.color, s.id, { stock: Number(e.target.value) })}
                                        placeholder="e.g. 50" />
                                      <RowInput
                                        value={s.sku}
                                        onChange={(e) => updateColorSize(row.color, s.id, { sku: e.target.value })}
                                        placeholder="SKU-01"
                                        className="text-xs" />
                                      <button type="button" onClick={() => removeColorSize(row.color, s.id)}
                                        className="size-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition shrink-0">
                                        <Trash2 className="size-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="px-4 py-3">
                              <button type="button" onClick={() => addSizeToColor(row.color)}
                                className="w-full h-9 rounded-xl border-2 border-dashed border-slate-200 hover:border-red-400 hover:bg-red-50/30 text-xs font-bold text-slate-500 hover:text-red-500 transition flex items-center justify-center gap-1.5">
                                <Plus className="size-3.5" /> Add size for {cName}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {(form.variantType === "color" || form.variantType === "color+size") && form.colorRows.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-3">👆 Tap a color above to get started</p>
                  )}

                  {/* Auto price summary */}
                  {minVarPrice > 0 && (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Product price — auto</p>
                        <p className="text-lg font-bold text-slate-900">
                          ৳{minVarPrice.toLocaleString()}
                          {maxVarPrice > minVarPrice && <span className="text-sm font-semibold text-slate-500"> – ৳{maxVarPrice.toLocaleString()}</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Total stock</p>
                        <p className="text-lg font-bold text-slate-900">{variantStockTotal}</p>
                      </div>
                    </div>
                  )}

                  {/* Optional MRP for variant products */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel hint="optional — crossed-out price">Original Price (MRP)</FieldLabel>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">৳</span>
                        <TInput type="number" min="0" value={form.oldPrice || ""}
                          onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder="e.g. 1500" className="pl-8" />
                      </div>
                      {discount > 0 && (
                        <p className="text-xs font-semibold text-emerald-600 mt-1.5">−{discount}% off will show on the product</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Visibility */}
              <div className="pt-2 border-t border-slate-100">
                <FieldLabel>Visibility</FieldLabel>
                <div className="flex gap-2 max-w-xs">
                  {(["active", "draft"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`flex-1 h-10 rounded-xl text-sm font-semibold border-2 transition ${form.status === s ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {s === "active" ? "🟢 Live" : "📝 Draft"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ════ STEP 3 — IMAGES & SEO ══════════════════════════════════════ */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add photos</h2>
                <p className="text-sm text-slate-400 mt-0.5">First photo = main photo customers see everywhere</p>
              </div>

              <ImageUploadZone images={allImages} onChange={handleImagesChange} maxImages={6} />

              <div className="border-t border-slate-100 pt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-700">Search Engine Preview (SEO)</h3>
                  <p className="text-xs text-slate-400">Optional — auto-uses product name if blank</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <FieldLabel hint={`${(form.metaTitle ?? "").length}/60`}>Meta Title</FieldLabel>
                    <TInput value={form.metaTitle ?? ""} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
                      placeholder={form.name || "Product title for Google"} />
                  </div>
                  <div>
                    <FieldLabel hint={`${(form.metaDescription ?? "").length}/160`}>Meta Description</FieldLabel>
                    <textarea value={form.metaDescription ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                      rows={3}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition resize-none"
                      placeholder="Short description shown in search results…" />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Google preview</p>
                    <p className="text-[#1a0dab] text-base leading-snug truncate">{form.metaTitle || form.name || "Product title"}</p>
                    <p className="text-[#006621] text-xs mt-0.5">shopbd.com/product/{form.slug || "product-slug"}</p>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{form.metaDescription || "Meta description will appear here…"}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── Step nav footer ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
            <button type="button" onClick={goBack} disabled={step === 0}
              className="h-11 px-5 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-0 flex items-center gap-1.5">
              <ChevronLeft className="size-4" /> Back
            </button>

            {!isLastStep ? (
              <button type="button" onClick={goNext}
                className="h-11 px-6 rounded-xl bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-semibold transition flex items-center gap-2">
                Continue <ChevronRight className="size-4" />
              </button>
            ) : (
              <button type="button" onClick={() => handleSave("active")} disabled={saving}
                className="h-11 px-6 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-sm font-bold transition flex items-center gap-2 shadow-lg shadow-red-500/25 disabled:opacity-50">
                <Save className="size-4" />
                {mode === "edit" ? "Save Changes" : "Publish Product"}
              </button>
            )}
          </div>
        </div>

        {/* ─── LIVE PREVIEW (sticky) ────────────────────────────────────────── */}
        <div className="hidden lg:block lg:sticky lg:top-6 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Eye className="size-4 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Preview</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="relative aspect-square bg-slate-100">
              {allImages[0] ? (
                <img src={allImages[0]} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                  <ImageIcon className="size-10" />
                  <span className="text-xs font-medium">No photo yet</span>
                </div>
              )}
              {discount > 0 && (
                <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">−{discount}%</span>
              )}
              {form.badge && (
                <span className={`absolute ${discount > 0 ? "top-9" : "top-2.5"} left-2.5 text-[10px] font-bold px-2 py-1 rounded-full ${
                  form.badge.tone === "sale" ? "bg-amber-400 text-amber-950"
                  : form.badge.tone === "trending" ? "bg-violet-500 text-white"
                  : "bg-slate-900 text-white"
                }`}>{form.badge.label}</span>
              )}
            </div>
            <div className="p-3.5 space-y-1.5">
              {(form.category || form.brand) && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 truncate">
                  {[form.category, form.brand].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 min-h-[2.4em]">
                {form.name.trim() || "Product name…"}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-red-500">
                  ৳{(effectivePrice || 0).toLocaleString()}
                  {hasVariants && maxVarPrice > minVarPrice && minVarPrice > 0 && <span className="text-xs font-medium text-slate-400">+</span>}
                </span>
                {savings > 0 && <span className="text-xs text-slate-400 line-through">৳{form.oldPrice?.toLocaleString()}</span>}
              </div>
              {selectedColorHexes.length > 0 && (
                <div className="flex gap-1 pt-0.5">
                  {selectedColorHexes.slice(0, 6).map((c, i) => (
                    <span key={i} className="size-3.5 rounded-full border border-white shadow-sm" style={{ background: c }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Checklist</p>
            {[
              { ok: !!form.name.trim(),  label: "Product name" },
              { ok: !!form.categoryId,   label: "Category" },
              { ok: !!form.description?.trim() && form.description !== "<p></p>", label: "Description" },
              { ok: hasVariants ? (totalVariantCount > 0 && minVarPrice > 0) : form.price > 0, label: hasVariants ? "Variant prices" : "Sale price" },
              { ok: effectiveStock > 0,  label: "Stock added" },
              { ok: allImages.length > 0, label: "At least 1 photo" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span className={`size-5 rounded-full flex items-center justify-center shrink-0 ${item.ok ? "bg-emerald-100" : "bg-slate-100"}`}>
                  <Check className={`size-3 ${item.ok ? "text-emerald-600" : "text-slate-300"}`} />
                </span>
                <span className={`text-xs ${item.ok ? "text-slate-600 font-medium" : "text-slate-400"}`}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Variant summary */}
          {hasVariants && totalVariantCount > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Summary</p>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Variants</span>
                <span className="font-bold text-slate-700">{totalVariantCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Price</span>
                <span className="font-bold text-slate-700">
                  {minVarPrice > 0 ? `৳${minVarPrice.toLocaleString()}${maxVarPrice > minVarPrice ? ` – ৳${maxVarPrice.toLocaleString()}` : ""}` : "—"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total stock</span>
                <span className="font-bold text-slate-700">{variantStockTotal}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
