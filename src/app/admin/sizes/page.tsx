"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { AdminCardGridSkeleton } from "@/components/admin/AdminSkeletons";

type SizeType = "clothing" | "footwear" | "general";
type AdminSize = { id: string; name: string; type: SizeType; status: "ACTIVE" | "INACTIVE" };

const emptyForm = (): Omit<AdminSize, "id"> => ({
  name: "", type: "clothing", status: "ACTIVE",
});

const TYPE_COLORS: Record<SizeType, string> = {
  clothing: "bg-blue-50 text-blue-700",
  footwear: "bg-purple-50 text-purple-700",
  general:  "bg-slate-100 text-slate-600",
};

export default function SizesPage() {
  const [sizes, setSizes] = useState<AdminSize[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal]       = useState<"add" | "edit" | "delete" | null>(null);
  const [editing, setEditing]   = useState<AdminSize | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/sizes").then((r) => r.json()).then((d) => setSizes(d.sizes ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const clothing = sizes.filter((s) => s.type === "clothing");
  const footwear = sizes.filter((s) => s.type === "footwear");
  const general  = sizes.filter((s) => s.type === "general");

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setModal("add"); };
  const openEdit = (s: AdminSize) => {
    setEditing(s);
    setForm({ name: s.name, type: s.type, status: s.status });
    setModal("edit");
  };
  const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
  const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); };
  useEscapeClose(modal !== null, closeModal);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Size name is required"); return; }
    if (modal === "add" && sizes.some((s) => s.name === form.name && s.type === form.type)) {
      toast.error("Size already exists for this type");
      return;
    }
    const res = modal === "edit" && editing
      ? await fetch(`/api/admin/sizes/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/sizes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save size");
      return;
    }
    toast.success(modal === "edit" ? "Size updated" : "Size added");
    closeModal();
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/sizes/${deleteId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete size"); return; }
    toast.success("Size deleted");
    closeModal();
    load();
  };

  const toggleStatus = async (s: AdminSize) => {
    const status = s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/admin/sizes/${s.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: s.name, type: s.type, status }),
    });
    if (res.ok) load();
    else toast.error("Failed to update status");
  };

  const SizeGroup = ({ label, items, type }: { label: string; items: AdminSize[]; type: SizeType }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Ruler className="size-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800">{label}</h3>
          <span className="text-xs text-slate-400 font-normal">({items.length})</span>
        </div>
        <button onClick={() => { setForm({ name: "", type, status: "ACTIVE" }); setEditing(null); setModal("add"); }}
          className="flex items-center gap-1.5 h-8 px-3 bg-[#ef4444] hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition">
          <Plus className="size-3.5" /> Add
        </button>
      </div>
      <div className="p-4 flex flex-wrap gap-3">
        {items.length === 0 && <p className="text-sm text-slate-400 py-4 w-full text-center">No sizes yet</p>}
        {items.map((s) => (
          <div key={s.id} className={`group relative flex flex-col items-center gap-1 p-3 rounded-xl border-2 min-w-[70px] transition ${s.status === "ACTIVE" ? "border-slate-200 hover:border-slate-300" : "border-dashed border-slate-200 opacity-60"}`}>
            <span className="text-base font-bold text-slate-800">{s.name}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.type]}`}>{s.type}</span>
            <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
              <button onClick={() => openEdit(s)} className="size-5 flex items-center justify-center rounded bg-blue-50 text-blue-500">
                <Pencil className="size-3" />
              </button>
              <button onClick={() => openDelete(s.id)} className="size-5 flex items-center justify-center rounded bg-red-50 text-red-500">
                <Trash2 className="size-3" />
              </button>
            </div>
            <button onClick={() => toggleStatus(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 lowercase ${s.status === "ACTIVE" ? "text-green-600" : "text-slate-400"}`}>
              {s.status.toLowerCase()}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) return <AdminCardGridSkeleton cards={6} cols="sm:grid-cols-2 lg:grid-cols-3" />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sizes</h2>
          <p className="text-sm text-slate-400">{sizes.length} total sizes across all types</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-10 px-4 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Plus className="size-4" /> Add Size
        </button>
      </div>

      <SizeGroup label="Clothing Sizes" items={clothing} type="clothing" />
      <SizeGroup label="Footwear Sizes" items={footwear} type="footwear" />
      <SizeGroup label="General Sizes" items={general} type="general" />

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{modal === "add" ? "Add Size" : "Edit Size"}</h3>
              <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Size Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                  placeholder="e.g. XL, 42, Free Size" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {(["clothing", "footwear", "general"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`h-9 px-4 rounded-xl text-sm font-semibold border transition capitalize ${form.type === t ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Status</label>
                <div className="flex gap-2">
                  {(["ACTIVE", "INACTIVE"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`h-9 px-4 rounded-xl text-sm font-semibold border transition capitalize ${form.status === s ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {s.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={closeModal} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 h-10 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5">
                <Check className="size-4" /> {modal === "add" ? "Add Size" : "Save Changes"}
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
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Size?</h3>
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
