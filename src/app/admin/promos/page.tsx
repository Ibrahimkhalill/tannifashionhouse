"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Eye, EyeOff, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { AdminCardGridSkeleton } from "@/components/admin/AdminSkeletons";

type PromoBanner = {
  id: string; eyebrow: string; title: string; subtitle: string;
  image: string; href: string; bg: string; active: boolean; order: number;
};

const emptyForm = (): Omit<PromoBanner, "id"> => ({
  eyebrow: "", title: "", subtitle: "", image: "", href: "/", bg: "#e8f5f0", active: true, order: 0,
});

const BG_PRESETS = [
  { label: "Mint", value: "#e8f5f0" },
  { label: "Peach", value: "#fdf2f0" },
  { label: "Lavender", value: "#eef2ff" },
  { label: "Lemon", value: "#fff9e6" },
  { label: "Sky", value: "#e0f2fe" },
  { label: "Rose", value: "#fce7f3" },
  { label: "Sage", value: "#f0fdf4" },
  { label: "Cream", value: "#fffbeb" },
];

export default function PromosPage() {
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal]       = useState<"add" | "edit" | "delete" | null>(null);
  const [editing, setEditing]   = useState<PromoBanner | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/promo-banners").then((r) => r.json()).then((d) => setPromoBanners(d.banners ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const sorted = [...promoBanners].sort((a, b) => a.order - b.order);

  const openAdd = () => {
    setForm({ ...emptyForm(), order: promoBanners.length });
    setEditing(null); setModal("add");
  };
  const openEdit = (b: PromoBanner) => {
    setEditing(b);
    setForm({ eyebrow: b.eyebrow, title: b.title, subtitle: b.subtitle, image: b.image, href: b.href, bg: b.bg, active: b.active, order: b.order });
    setModal("edit");
  };
  const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
  const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); };
  useEscapeClose(modal !== null, closeModal);

  const handleSave = async () => {
    if (!form.title.trim())    { toast.error("Title is required"); return; }
    if (!form.href.trim())     { toast.error("Link href is required"); return; }
    if (!form.image.trim())    { toast.error("Image is required"); return; }
    const res = modal === "edit" && editing
      ? await fetch(`/api/admin/promo-banners/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/promo-banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save banner");
      return;
    }
    toast.success(modal === "edit" ? "Promo banner updated" : "Promo banner added");
    closeModal();
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/promo-banners/${deleteId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete banner"); return; }
    toast.success("Banner deleted");
    closeModal();
    load();
  };

  const toggleActive = async (b: PromoBanner) => {
    const res = await fetch(`/api/admin/promo-banners/${b.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...b, active: !b.active }),
    });
    if (res.ok) load();
    else toast.error("Failed to update banner");
  };

  if (loading) return <AdminCardGridSkeleton cards={4} cols="sm:grid-cols-2" />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Promo Banners</h2>
          <p className="text-sm text-slate-400">{promoBanners.filter((b) => b.active).length} active banners · {promoBanners.length} total</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-10 px-4 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Plus className="size-4" /> Add Banner
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        These 4 promotional banners appear in a 2×2 grid below the hero slider on the homepage. They are shown in order.
      </div>

      {/* Grid preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map((b, idx) => (
          <div key={b.id} className={`rounded-2xl border-2 overflow-hidden transition ${b.active ? "border-slate-200" : "border-dashed border-slate-200 opacity-60"}`}
            style={{ background: b.bg }}>
            <div className="flex items-stretch min-h-[120px]">
              {/* Order handle */}
              <div className="flex flex-col items-center justify-center gap-1 w-10 shrink-0 bg-black/5 text-slate-400">
                <GripVertical className="size-3.5" />
                <span className="text-[10px] font-bold">{idx + 1}</span>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{b.eyebrow}</p>
                <h3 className="font-bold text-slate-800 text-sm leading-tight whitespace-pre-line line-clamp-2">{b.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{b.subtitle}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-2">{b.href}</p>
              </div>

              {/* Image */}
              {b.image && (
                <div className="w-24 shrink-0 relative">
                  <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
              {!b.image && (
                <div className="w-16 shrink-0 flex items-center justify-center text-slate-300 bg-black/5">
                  <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col items-center justify-center gap-2 px-3 shrink-0 border-l border-black/10">
                <button onClick={() => toggleActive(b)}
                  className={`size-7 flex items-center justify-center rounded-lg transition ${b.active ? "bg-green-100 text-green-600 hover:bg-green-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>
                  {b.active ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                </button>
                <button onClick={() => openEdit(b)} className="size-7 flex items-center justify-center rounded-lg hover:bg-blue-100 text-blue-500 transition">
                  <Pencil className="size-3" />
                </button>
                <button onClick={() => openDelete(b.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500 transition">
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button onClick={openAdd}
          className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50/30 min-h-[120px] flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition">
          <Plus className="size-6" />
          <span className="text-sm font-medium">Add Banner</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="text-lg font-bold text-slate-800">{modal === "add" ? "Add Promo Banner" : "Edit Promo Banner"}</h3>
              <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>

            {/* Live preview */}
            <div className="mx-6 mt-4 rounded-xl overflow-hidden shrink-0 border border-slate-200" style={{ background: form.bg, minHeight: 100 }}>
              <div className="flex items-stretch min-h-[100px]">
                <div className="flex-1 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{form.eyebrow || "EYEBROW"}</p>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight whitespace-pre-line">{form.title || "Banner title"}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{form.subtitle}</p>
                </div>
                {form.image && (
                  <div className="w-28 shrink-0 relative">
                    <img src={form.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Eyebrow Label</label>
                  <input value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                    placeholder="e.g. Premium, New Arrival" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Subtitle</label>
                  <input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                    placeholder="e.g. Get Extra 30% Off" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Title * <span className="text-slate-400 font-normal">(use \n for line break)</span></label>
                <textarea value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition resize-none"
                  rows={2} placeholder="Skincare & Beauty&#10;Essentials" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Link Href *</label>
                <input value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                  placeholder="/category/beauty" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Image <span className="text-slate-400 font-normal">(optional)</span></label>
                <SingleImageUpload value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} hint="Promo banner image — PNG, JPG, WebP up to 8MB" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Background Color</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {BG_PRESETS.map((p) => (
                    <button key={p.value} type="button" onClick={() => setForm((f) => ({ ...f, bg: p.value }))}
                      className={`h-10 rounded-xl text-xs font-semibold border-2 transition ${form.bg === p.value ? "border-red-400 ring-2 ring-red-200" : "border-slate-200"}`}
                      style={{ background: p.value }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.bg} onChange={(e) => setForm((f) => ({ ...f, bg: e.target.value }))}
                    className="size-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                  <input value={form.bg} onChange={(e) => setForm((f) => ({ ...f, bg: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm font-mono outline-none focus:border-red-400 transition"
                    placeholder="#e8f5f0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition" min={0} />
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
                <Check className="size-4" /> {modal === "add" ? "Add Banner" : "Save Changes"}
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
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Banner?</h3>
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
