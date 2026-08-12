"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, AlertTriangle, Search, Layers, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useEscapeClose } from "@/hooks/use-escape-close";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { AdminTablePageSkeleton } from "@/components/admin/AdminSkeletons";

type Category = {
  id: string; name: string; slug: string; parentId: string | null;
  image: string | null; status: "ACTIVE" | "INACTIVE"; createdAt: string;
};

const emptyForm = () => ({
  name: "", slug: "", parentId: null as string | null, image: "", status: "ACTIVE" as "ACTIVE" | "INACTIVE",
});

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch]     = useState("");
  const [view, setView]         = useState<"parents" | "subcategories" | "tree">("parents");
  const [modal, setModal]       = useState<"add" | "edit" | "delete" | null>(null);
  const [editing, setEditing]   = useState<Category | null>(null);
  const [form, setForm]         = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const parents = useMemo(() => categories.filter((c) => !c.parentId), [categories]);
  const subcategories = useMemo(() => categories.filter((c) => c.parentId), [categories]);

  const displayList = useMemo(() => {
    const base = view === "parents" ? parents : view === "subcategories" ? subcategories : categories;
    if (!search) return base;
    return base.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [view, parents, subcategories, categories, search]);

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    return categories.find((c) => c.id === parentId)?.name ?? null;
  };

  const openAdd = (parentId?: string) => {
    setForm({ ...emptyForm(), parentId: parentId ?? null });
    setEditing(null);
    setModal("add");
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId, image: cat.image ?? "", status: cat.status });
    setModal("edit");
  };

  const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
  const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); };
  useEscapeClose(modal !== null, closeModal);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    const slug = form.slug.trim() || slugify(form.name);
    const body = { ...form, slug };
    const res = modal === "edit" && editing
      ? await fetch(`/api/admin/categories/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save category");
      return;
    }
    toast.success(modal === "edit" ? "Category updated" : "Category added successfully");
    closeModal();
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const hasSubs = categories.some((c) => c.parentId === deleteId);
    if (hasSubs) { toast.error("Delete all subcategories first"); return; }
    const res = await fetch(`/api/admin/categories/${deleteId}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Failed to delete category"); return; }
    toast.success("Category deleted");
    closeModal();
    load();
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  };

  const toggleStatus = async (cat: Category) => {
    const status = cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cat.name, slug: cat.slug, parentId: cat.parentId, image: cat.image ?? "", status }),
    });
    if (res.ok) {
      toast.success(`Category ${status === "ACTIVE" ? "activated" : "deactivated"}`);
      load();
    } else {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <AdminTablePageSkeleton rows={8} cols={6} />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Categories</h2>
          <p className="text-sm text-slate-400">{categories.length} total categories ({parents.length} parents, {subcategories.length} subcategories)</p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-2 h-10 px-4 bg-[#ef4444] hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shrink-0">
          <Plus className="size-4" /> Add Category
        </button>
      </div>

      {/* View tabs + Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
          {(["parents", "subcategories", "tree"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition ${
                view === v ? "bg-[#0f172a] text-white border-[#0f172a]" : "border-slate-200 text-slate-600 hover:border-slate-400"
              }`}>
              {v === "parents" ? `Parents (${parents.length})` : v === "subcategories" ? `Subcategories (${subcategories.length})` : "Tree View"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition" />
        </div>
      </div>

      {/* Tree view */}
      {view === "tree" ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Category Tree</h3>
          </div>
          <div className="p-4 space-y-2">
            {parents.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase())).map((parent) => {
              const subs = subcategories.filter((s) => s.parentId === parent.id);
              return (
                <div key={parent.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                    <div className="size-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <Layers className="size-4 text-red-500" />
                    </div>
                    <span className="font-semibold text-slate-800 flex-1">{parent.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${parent.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {parent.status.toLowerCase()}
                    </span>
                    <span className="text-xs text-slate-400">{subs.length} subs</span>
                    <button onClick={() => openAdd(parent.id)} className="text-xs text-red-500 hover:underline font-medium">+ Sub</button>
                    <button onClick={() => openEdit(parent)} className="size-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="size-3.5" /></button>
                    <button onClick={() => openDelete(parent.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="size-3.5" /></button>
                  </div>
                  {subs.length > 0 && (
                    <div className="divide-y divide-slate-100">
                      {subs.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 pl-12">
                          <ChevronRight className="size-3.5 text-slate-300 shrink-0" />
                          <span className="text-sm text-slate-700 flex-1">{sub.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                            {sub.status.toLowerCase()}
                          </span>
                          <button onClick={() => openEdit(sub)} className="size-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="size-3.5" /></button>
                          <button onClick={() => openDelete(sub.id)} className="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="size-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List view */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Slug</th>
                  {view === "subcategories" && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Parent</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayList.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-slate-400">No categories found</td></tr>
                )}
                {displayList.map((cat, i) => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                          <Layers className="size-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{cat.name}</p>
                          {getParentName(cat.parentId) && (
                            <p className="text-xs text-slate-400">Sub of: {getParentName(cat.parentId)}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{cat.slug}</span>
                    </td>
                    {view === "subcategories" && (
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{getParentName(cat.parentId) ?? "—"}</span>
                      </td>
                    )}
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleStatus(cat)}
                        className={`text-xs px-3 py-1 rounded-full font-semibold transition ${cat.status === "ACTIVE" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                        {cat.status.toLowerCase()}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 hidden md:table-cell">
                      {new Date(cat.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(cat)} className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 transition">
                          <Pencil className="size-3.5" />
                        </button>
                        <button onClick={() => openDelete(cat.id)} className="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 transition">
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
      )}

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()} className="animate-scale-in bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">{modal === "add" ? "Add Category" : "Edit Category"}</h3>
              <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                <X className="size-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Category Name *</label>
                <input value={form.name} onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition"
                  placeholder="e.g. Men's Clothing" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Slug</label>
                <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition font-mono"
                  placeholder="mens-clothing" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Parent Category</label>
                <select value={form.parentId ?? ""} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 bg-white transition">
                  <option value="">None (Top-level category)</option>
                  {parents.filter((p) => !editing || p.id !== editing.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Image (optional)</label>
                <SingleImageUpload value={form.image} onChange={(image) => setForm((f) => ({ ...f, image }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-1.5">Status</label>
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
                <Check className="size-4" /> {modal === "add" ? "Add Category" : "Save Changes"}
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
            <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Category?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone. Subcategories must be deleted first.</p>
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
