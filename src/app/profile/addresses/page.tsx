"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ProfileShell } from "@/components/site/ProfileShell";
import { useStore } from "@/lib/store";
import { MapPin, Plus, Pencil, Trash2, Star, X } from "lucide-react";
import { toast } from "sonner";

type Address = {
  id: string; label: string; name: string; phone: string;
  line1: string; line2: string | null; city: string; district: string; isDefault: boolean;
};
type AddressFormState = Omit<Address, "id">;
const EMPTY_FORM: AddressFormState = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "", district: "", isDefault: false };
const LABELS = ["Home", "Work", "Other"];

export default function AddressesPage() {
  const { user } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const load = useCallback(() => {
    if (!user) { setLoading(false); return; }
    fetch("/api/addresses")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.addresses) setAddresses(d.addresses); })
      .finally(() => setLoading(false));
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (a: Address) => { setEditing(a); setModalOpen(true); };

  const handleSave = async (form: AddressFormState) => {
    const res = editing
      ? await fetch(`/api/addresses/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Failed to save address");
      return;
    }
    toast.success(editing ? "Address updated" : "Address added");
    setModalOpen(false);
    load();
  };

  const deleteAddress = async (id: string) => {
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Address removed"); load(); }
    else toast.error("Failed to remove address");
  };

  const setDefaultAddress = async (a: Address) => {
    const res = await fetch(`/api/addresses/${a.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...a, line2: a.line2 ?? "", isDefault: true }),
    });
    if (res.ok) { toast.success("Default address updated"); load(); }
    else toast.error("Failed to update default");
  };

  if (!user) {
    return (
      <ProfileShell>
        <div className="bg-white rounded-2xl border shadow-sm py-16 text-center">
          <MapPin className="size-10 mx-auto text-muted-foreground/30 mb-3" strokeWidth={1.5} />
          <p className="font-bold text-base">Sign in to manage addresses</p>
          <p className="text-sm text-muted-foreground mt-2">Your saved addresses appear here once you sign in.</p>
        </div>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell>
      <div className="animate-fade-up space-y-4 lg:space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Saved addresses for faster checkout</p>
          <button
            onClick={openAdd}
            className="shrink-0 h-9 px-3.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-accent active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5"
          >
            <Plus className="size-3.5" strokeWidth={2} /> Add New
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
                <div className="skeleton-shimmer h-6 w-16 rounded-full" />
                <div className="skeleton-shimmer h-4 w-32 rounded-md" />
                <div className="skeleton-shimmer h-3.5 w-full rounded-md" />
                <div className="skeleton-shimmer h-3.5 w-2/3 rounded-md" />
                <div className="border-t pt-3 flex gap-2">
                  <div className="skeleton-shimmer h-4 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm py-16 text-center">
            <div className="mx-auto size-16 rounded-full bg-secondary flex items-center justify-center mb-5">
              <MapPin className="size-7 text-muted-foreground/70" />
            </div>
            <p className="font-bold text-base">No Addresses Found</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              {"You haven't saved any addresses yet. Add one now for a faster checkout experience."}
            </p>
            <button
              onClick={openAdd}
              className="mt-6 h-10 px-7 rounded-full border-2 border-black text-sm font-bold hover:bg-black hover:text-white transition"
            >
              Add New Address
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 relative">
                {a.isDefault && (
                  <span className="absolute top-4 right-4 text-[10px] px-2.5 py-1 rounded-full bg-black text-white font-semibold">Default</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                    {a.label}
                  </span>
                </div>
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</p>
                  <p className="text-sm text-muted-foreground">{a.city}, {a.district}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{a.phone}</p>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t mt-auto">
                  {!a.isDefault && (
                    <button onClick={() => setDefaultAddress(a)} className="flex items-center gap-1.5 text-xs text-black font-semibold hover:text-accent transition">
                      <Star className="size-3.5" /> Set default
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => openEdit(a)} className="size-8 rounded-xl hover:bg-secondary flex items-center justify-center text-muted-foreground/70 hover:text-black transition">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => deleteAddress(a.id)} className="size-8 rounded-xl hover:bg-accent/10 flex items-center justify-center text-muted-foreground/70 hover:text-accent transition">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={openAdd}
              className="bg-white rounded-2xl border border-dashed shadow-sm p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground/70 hover:border-black hover:text-black transition min-h-40"
            >
              <Plus className="size-7 opacity-40" />
              <p className="text-sm font-medium">Add new address</p>
            </button>
          </div>
        )}

        {modalOpen && (
          <AddressDrawer
            initial={editing ?? undefined}
            onSave={handleSave}
            onClose={() => setModalOpen(false)}
          />
        )}
      </div>
    </ProfileShell>
  );
}

function AddressDrawer({ initial, onSave, onClose }: {
  initial?: Address;
  onSave: (form: AddressFormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AddressFormState>(
    initial
      ? { label: initial.label, name: initial.name, phone: initial.phone, line1: initial.line1, line2: initial.line2 ?? "", city: initial.city, district: initial.district, isDefault: initial.isDefault }
      : { ...EMPTY_FORM }
  );

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  const set = (k: keyof AddressFormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.line1 || !form.city || !form.district) {
      toast.error("Please fill all required fields");
      return;
    }
    onSave(form);
  };

  return createPortal(
    <div className="fixed inset-0 z-50" role="presentation">
      <button type="button" aria-label="Close" onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200" />
      <aside role="dialog" aria-label={initial ? "Edit Address" : "Add New Address"}
        className="fixed right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 sm:max-w-[440px] z-[51]">
        <header className="flex shrink-0 items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{initial ? "Edit Address" : "Add New Address"}</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{initial ? "Update your saved address" : "Save an address for faster checkout"}</p>
          </div>
          <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition" aria-label="Close">
            <X className="size-4" strokeWidth={2.25} />
          </button>
        </header>

        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5 block">Address Type</label>
            <div className="flex gap-2">
              {LABELS.map((l) => (
                <button key={l} type="button" onClick={() => set("label", l)}
                  className={`h-9 px-5 rounded-full text-xs font-semibold border transition-all ${form.label === l ? "bg-black text-white border-black" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *" value={form.name} onChange={(v) => set("name", v)} placeholder="Recipient name" />
            <Field label="Phone *" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+880 1xxx xxxxxx" />
          </div>
          <Field label="Address Line 1 *" value={form.line1} onChange={(v) => set("line1", v)} placeholder="House / Road / Area" />
          <Field label="Address Line 2" value={form.line2 ?? ""} onChange={(v) => set("line2", v)} placeholder="Apartment, floor (optional)" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City *" value={form.city} onChange={(v) => set("city", v)} placeholder="e.g. Dhaka" />
            <Field label="District *" value={form.district} onChange={(v) => set("district", v)} placeholder="e.g. Dhaka" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
            <div role="switch" aria-checked={form.isDefault} onClick={() => set("isDefault", !form.isDefault)}
              className={`w-11 h-6 rounded-full relative transition-colors ${form.isDefault ? "bg-black" : "bg-border"}`}>
              <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-all ${form.isDefault ? "left-6" : "left-1"}`} />
            </div>
            <span className="text-sm font-medium">Set as default address</span>
          </label>
        </form>

        <footer className="shrink-0 border-t px-6 py-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 h-12 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition">Cancel</button>
          <button onClick={submit} className="flex-1 h-12 rounded-full bg-black text-white text-sm font-semibold hover:bg-accent transition">
            {initial ? "Save Changes" : "Add Address"}
          </button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-11 px-4 rounded-xl border bg-secondary/60 text-sm outline-none focus:border-black transition" />
    </div>
  );
}
