"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { AdminCardGridSkeleton } from "@/components/admin/AdminSkeletons";

type AdminBadge = { id: string; label: string; tone: "new" | "sale" | "trending"; status: "active" | "inactive" };

const emptyForm = (): Omit<AdminBadge, "id"> => ({
  label: "", tone: "new", status: "active",
});

const TONE_STYLE: Record<AdminBadge["tone"], string> = {
  new:      "bg-slate-800 text-white",
  sale:     "bg-red-100 text-red-600",
  trending: "bg-amber-100 text-amber-600",
};

const TONE_DESCRIPTIONS: Record<AdminBadge["tone"], string> = {
  new:      "Dark badge — for new arrivals",
  sale:     "Red badge — for sale items",
  trending: "Amber badge — for trending products",
};

export default function BadgesPage() {
  const [badges, setBadges] = useState<AdminBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal]       = useState<"add" | "edit" | "delete" | null>(null);
  const [editing, setEditing]   = useState<AdminBadge | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/badges").then((r) => r.json()).then((d) => setBadges(d.badges ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setModal("add"); };
  const openEdit = (b: AdminBadge) => {
    setEditing(b);
    setForm({ label: b.label, tone: b.tone, status: b.status });
    setModal("edit");
  };
  const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
  const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); };
  useEscapeClose(modal !== null, closeModal);

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error("Badge label is required"); return; }
    const res = modal === "edit" && editing
      ? await fetch(`/api/admin/badges/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/badges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save badge");
      return;
    }
    toast.success(modal === "edit" ? "Badge updated" : "Badge added");
    closeModal();
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/badges/${deleteId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete badge"); return; }
    toast.success("Badge deleted");
    closeModal();
    load();
  };

  const toggleStatus = async (b: AdminBadge) => {
    const res = await fetch(`/api/admin/badges/${b.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: b.label, tone: b.tone, status: b.status === "active" ? "inactive" : "active" }),
    });
    if (res.ok) load();
    else toast.error("Failed to update badge");
  };

  if (loading) return <AdminCardGridSkeleton cards={6} cols="sm:grid-cols-2 lg:grid-cols-3" />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Badges</h2>
          <p className="text-sm text-slate-400">{badges.length} badges configured</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-10 px-4 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Plus className="size-4" /> Add Badge
        </button>
      </div>

      {/* Badge preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">No badges yet</div>
        )}
        {badges.map((b) => (
          <div key={b.id} className={`bg-white rounded-2xl border-2 p-5 transition ${b.status === "active" ? "border-slate-200" : "border-dashed border-slate-200 opacity-60"}`}>
            <div className="flex items-start justify-between mb-4">
              <span className={`text-sm font-bold px-4 py-1.5 rounded-full uppercase ${TONE_STYLE[b.tone]}`}>
                {b.label}
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(b)} className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition">
                  <Pencil className="size-3.5" />
                </button>
                <button onClick={() => openDelete(b.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">{TONE_DESCRIPTIONS[b.tone]}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tone: {b.tone}</span>
              <button onClick={() => toggleStatus(b)}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition ${b.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                {b.status}
              </button>
            </div>
          </div>
        ))}
        {/* Add new card */}
        <button onClick={openAdd}
          className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50/30 p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-red-500 transition min-h-[130px]">
          <Plus className="size-8" />
          <span className="text-sm font-medium">Add New Badge</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">All Badges</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Badge</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Tone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {badges.map((b, i) => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${TONE_STYLE[b.tone]}`}>
                      {b.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 capitalize">{b.tone}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(b)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition ${b.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {b.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(b)} className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => openDelete(b.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{modal === "add" ? "Add Badge" : "Edit Badge"}</h3>
              <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Preview */}
              <div className="flex items-center justify-center p-4 bg-slate-50 rounded-xl">
                <span className={`text-sm font-bold px-4 py-1.5 rounded-full uppercase ${TONE_STYLE[form.tone]}`}>
                  {form.label || "PREVIEW"}
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Badge Label *</label>
                <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value.toUpperCase() }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition font-semibold"
                  placeholder="e.g. NEW, HOT, SALE" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Tone *</label>
                <div className="flex gap-2 flex-wrap">
                  {(["new", "sale", "trending"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, tone: t }))}
                      className={`h-9 px-4 rounded-xl text-sm font-semibold border transition capitalize ${form.tone === t ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{TONE_DESCRIPTIONS[form.tone]}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">Status</label>
                <div className="flex gap-2">
                  {(["active", "inactive"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`h-9 px-4 rounded-xl text-sm font-semibold border transition capitalize ${form.status === s ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-200">
              <button onClick={closeModal} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={handleSave} className="flex-1 h-10 rounded-xl bg-[#ef4444] hover:bg-red-600 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5">
                <Check className="size-4" /> {modal === "add" ? "Add Badge" : "Save Changes"}
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
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Badge?</h3>
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
