"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { AdminCardGridSkeleton } from "@/components/admin/AdminSkeletons";

type AdminColor = { id: string; name: string; hex: string; status: "ACTIVE" | "INACTIVE" };

const emptyForm = (): Omit<AdminColor, "id"> => ({
  name: "", hex: "#000000", status: "ACTIVE",
});

export default function ColorsPage() {
  const [colors, setColors] = useState<AdminColor[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal]       = useState<"add" | "edit" | "delete" | null>(null);
  const [editing, setEditing]   = useState<AdminColor | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/colors").then((r) => r.json()).then((d) => setColors(d.colors ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setForm(emptyForm()); setEditing(null); setModal("add"); };
  const openEdit = (c: AdminColor) => {
    setEditing(c);
    setForm({ name: c.name, hex: c.hex, status: c.status });
    setModal("edit");
  };
  const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
  const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); };
  useEscapeClose(modal !== null, closeModal);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Color name is required"); return; }
    if (!form.hex.match(/^#[0-9a-fA-F]{6}$/)) { toast.error("Enter a valid 6-digit hex color code"); return; }
    const res = modal === "edit" && editing
      ? await fetch(`/api/admin/colors/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/colors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save color");
      return;
    }
    toast.success(modal === "edit" ? "Color updated" : "Color added");
    closeModal();
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/colors/${deleteId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete color"); return; }
    toast.success("Color deleted");
    closeModal();
    load();
  };

  const toggleStatus = async (c: AdminColor) => {
    const status = c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/admin/colors/${c.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: c.name, hex: c.hex, status }),
    });
    if (res.ok) load();
    else toast.error("Failed to update status");
  };

  if (loading) return <AdminCardGridSkeleton cards={8} cols="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Colors</h2>
          <p className="text-sm text-slate-400">{colors.length} colors in catalog</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 h-10 px-4 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Plus className="size-4" /> Add Color
        </button>
      </div>

      {/* Color grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {colors.length === 0 && (
            <div className="col-span-6 text-center py-12 text-slate-400">No colors added yet</div>
          )}
          {colors.map((c) => (
            <div key={c.id} className={`group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition ${c.status === "ACTIVE" ? "border-slate-200 hover:border-slate-300 hover:shadow-sm" : "border-dashed border-slate-200 opacity-60"}`}>
              {/* Color circle */}
              <div className="size-14 rounded-full border-4 border-white shadow-lg shrink-0" style={{ background: c.hex }} />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs font-mono text-slate-400">{c.hex}</p>
              </div>
              <button onClick={() => toggleStatus(c)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold lowercase ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {c.status.toLowerCase()}
              </button>
              {/* Action buttons on hover */}
              <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                <button onClick={() => openEdit(c)} className="size-6 flex items-center justify-center rounded-lg bg-white shadow border border-slate-200 text-blue-500 hover:bg-blue-50">
                  <Pencil className="size-3" />
                </button>
                <button onClick={() => openDelete(c.id)} className="size-6 flex items-center justify-center rounded-lg bg-white shadow border border-slate-200 text-red-500 hover:bg-red-50">
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
          {/* Quick add card */}
          <button onClick={openAdd}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-red-300 hover:bg-red-50/30 transition text-slate-400 hover:text-red-500 min-h-[130px]">
            <div className="size-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
              <Plus className="size-5" />
            </div>
            <span className="text-xs font-medium">Add Color</span>
          </button>
        </div>
      </div>

      {/* Table view */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">All Colors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Color</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Hex Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colors.map((c, i) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="size-8 rounded-full border-2 border-white shadow-md" style={{ background: c.hex }} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">{c.hex}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(c)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition lowercase ${c.status === "ACTIVE" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                      {c.status.toLowerCase()}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(c)} className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => openDelete(c.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition">
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
              <h3 className="text-lg font-bold text-slate-800">{modal === "add" ? "Add Color" : "Edit Color"}</h3>
              <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Color preview */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="size-16 rounded-2xl border-4 border-white shadow-lg shrink-0" style={{ background: form.hex }} />
                <div>
                  <p className="font-semibold text-slate-800">{form.name || "Color Name"}</p>
                  <p className="text-xs font-mono text-slate-400">{form.hex}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Color Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                  placeholder="e.g. Royal Blue" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Hex Color *</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={form.hex} onChange={(e) => setForm((f) => ({ ...f, hex: e.target.value }))}
                    className="size-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 shrink-0" />
                  <input value={form.hex} onChange={(e) => setForm((f) => ({ ...f, hex: e.target.value }))}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition font-mono"
                    placeholder="#000000" />
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
                <Check className="size-4" /> {modal === "add" ? "Add Color" : "Save Changes"}
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
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Color?</h3>
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
