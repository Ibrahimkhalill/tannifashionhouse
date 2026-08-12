"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, GripVertical, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { AdminTablePageSkeleton } from "@/components/admin/AdminSkeletons";

type HeroSlide = {
  id: string; badge: string; title: string; subtitle: string; cta: string;
  slug: string; image: string; gradient: string; active: boolean; order: number;
};

const emptyForm = (): Omit<HeroSlide, "id"> => ({
  badge: "", title: "", subtitle: "", cta: "Shop Now", slug: "",
  image: "", gradient: "from-zinc-900 via-black to-black", active: true, order: 0,
});

const GRADIENT_OPTIONS = [
  { label: "Black Zinc", value: "from-zinc-900 via-black to-black" },
  { label: "Black Neutral", value: "from-neutral-900 via-black to-black" },
  { label: "Black Stone", value: "from-stone-900 via-black to-black" },
  { label: "Dark Slate", value: "from-slate-900 via-slate-800 to-slate-900" },
  { label: "Dark Gray", value: "from-gray-900 via-gray-800 to-gray-900" },
  { label: "Deep Indigo", value: "from-indigo-950 via-indigo-900 to-black" },
];

export default function BannersPage() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal]       = useState<"add" | "edit" | "delete" | null>(null);
  const [editing, setEditing]   = useState<HeroSlide | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/hero-slides").then((r) => r.json()).then((d) => setHeroSlides(d.slides ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const sorted = [...heroSlides].sort((a, b) => a.order - b.order);

  const openAdd = () => {
    setForm({ ...emptyForm(), order: heroSlides.length });
    setEditing(null); setModal("add");
  };
  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({ badge: s.badge, title: s.title, subtitle: s.subtitle, cta: s.cta, slug: s.slug, image: s.image, gradient: s.gradient, active: s.active, order: s.order });
    setModal("edit");
  };
  const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
  const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); };
  useEscapeClose(modal !== null, closeModal);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.slug.trim())  { toast.error("Category slug is required"); return; }
    const res = modal === "edit" && editing
      ? await fetch(`/api/admin/hero-slides/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/hero-slides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save slide");
      return;
    }
    toast.success(modal === "edit" ? "Slide updated" : "Slide added");
    closeModal();
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/hero-slides/${deleteId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete slide"); return; }
    toast.success("Slide deleted");
    closeModal();
    load();
  };

  const toggleActive = async (s: HeroSlide) => {
    const res = await fetch(`/api/admin/hero-slides/${s.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, active: !s.active }),
    });
    if (res.ok) load();
    else toast.error("Failed to update slide");
  };

  if (loading) return <AdminTablePageSkeleton rows={4} cols={4} />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hero Slider</h2>
          <p className="text-sm text-slate-400">{heroSlides.filter((s) => s.active).length} active slides · {heroSlides.length} total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-10 px-4 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Plus className="size-4" /> Add Slide
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        Slides are shown in order on the homepage hero carousel. Inactive slides are hidden from the storefront.
        If no image URL is provided, a dark gradient background is used.
      </div>

      {/* Slides list */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
            No slides yet. Add your first hero slide.
          </div>
        )}
        {sorted.map((s, idx) => (
          <div key={s.id} className={`bg-white rounded-2xl border-2 overflow-hidden transition ${s.active ? "border-slate-200" : "border-dashed border-slate-200 opacity-60"}`}>
            <div className="flex items-stretch gap-0">
              {/* Drag handle + order */}
              <div className="flex flex-col items-center justify-center gap-1 w-12 shrink-0 bg-slate-50 border-r border-slate-100 text-slate-300">
                <GripVertical className="size-4" />
                <span className="text-xs font-bold">{idx + 1}</span>
              </div>

              {/* Preview */}
              <div className={`w-32 sm:w-48 shrink-0 relative bg-gradient-to-br ${s.gradient} flex flex-col items-start justify-end p-4 overflow-hidden`} style={{ minHeight: 100 }}>
                {s.image && (
                  <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                )}
                {s.badge && (
                  <span className="relative z-10 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">{s.badge}</span>
                )}
                <p className="relative z-10 text-white text-xs font-semibold leading-tight line-clamp-2">{s.title || "Slide title"}</p>
              </div>

              {/* Info */}
              <div className="flex-1 px-4 py-3 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {s.badge && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{s.badge}</span>}
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">/{s.slug}</span>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm line-clamp-1">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.subtitle}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>CTA: <strong className="text-slate-700">{s.cta}</strong></span>
                  <span>·</span>
                  <span>Gradient: <strong className="text-slate-700">{GRADIENT_OPTIONS.find((g) => g.value === s.gradient)?.label ?? "Custom"}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center justify-center gap-2 px-4 shrink-0 border-l border-slate-100">
                <button onClick={() => toggleActive(s)}
                  className={`size-8 flex items-center justify-center rounded-lg transition ${s.active ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>
                  {s.active ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button onClick={() => openEdit(s)} className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => openDelete(s.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button onClick={openAdd}
          className="w-full bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50/30 py-8 flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition">
          <Plus className="size-5" />
          <span className="text-sm font-medium">Add New Slide</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">{modal === "add" ? "Add Slide" : "Edit Slide"}</h3>
              <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>

            {/* Live preview */}
            <div className={`h-28 relative bg-gradient-to-br ${form.gradient} flex flex-col items-start justify-end p-5 overflow-hidden shrink-0`}>
              {form.image && (
                <img src={form.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              )}
              <div className="relative z-10">
                {form.badge && <span className="bg-[#ef4444] text-white text-xs font-bold px-3 py-1 rounded-full block w-fit mb-1.5">{form.badge}</span>}
                <p className="text-white font-bold text-lg leading-tight">{form.title || "Slide title"}</p>
                <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{form.subtitle}</p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Badge Text</label>
                  <input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                    placeholder="e.g. 22% OFF" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">CTA Button</label>
                  <input value={form.cta} onChange={(e) => setForm((f) => ({ ...f, cta: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                    placeholder="e.g. Shop Now" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                  placeholder="e.g. Latest Fashion Trends" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Subtitle</label>
                <textarea value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition resize-none"
                  rows={2} placeholder="Short description shown below the title" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Category Slug * <span className="text-slate-400 font-normal">(link target)</span></label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                  placeholder="e.g. fashion, gadgets" />
                <p className="text-xs text-slate-400 mt-1">Links to /category/{"{slug}"}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Slide Image <span className="text-slate-400 font-normal">(optional)</span></label>
                <SingleImageUpload value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} hint="Hero slide image — PNG, JPG, WebP up to 8MB" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Background Gradient</label>
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENT_OPTIONS.map((g) => (
                    <button key={g.value} type="button" onClick={() => setForm((f) => ({ ...f, gradient: g.value }))}
                      className={`h-10 rounded-xl text-xs font-semibold border transition bg-gradient-to-r ${g.value} text-white ${form.gradient === g.value ? "ring-2 ring-red-400 border-transparent" : "border-transparent opacity-80 hover:opacity-100"}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                    min={0} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Visibility</label>
                  <div className="flex gap-2">
                    {([true, false] as const).map((v) => (
                      <button key={String(v)} type="button" onClick={() => setForm((f) => ({ ...f, active: v }))}
                        className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition ${form.active === v ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                        {v ? "Active" : "Hidden"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-slate-200 shrink-0">
              <button onClick={closeModal} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 h-10 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5">
                <Check className="size-4" /> {modal === "add" ? "Add Slide" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="size-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="size-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Slide?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
