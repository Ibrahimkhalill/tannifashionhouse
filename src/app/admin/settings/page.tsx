"use client";

import { useState, useEffect } from "react";
import { User, Lock, Phone, Save, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

type Account = { name: string; phone: string; email: string | null };

export default function AdminSettingsPage() {
  const { update: updateSession } = useSession();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setAccount(d.user);
          setName(d.user.name ?? "");
          setEmail(d.user.email ?? "");
        }
      })
      .catch(() => toast.error("Failed to load account"));
  }, []);

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSavingAccount(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not save"); return; }
      setAccount(data.user);
      await updateSession?.({ name: data.user.name, email: data.user.email });
      toast.success("Account details saved");
    } finally {
      setSavingAccount(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { toast.error("Please fill all password fields"); return; }
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords do not match"); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not update password"); return; }
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast.success("Password updated");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-400">Manage your admin account and password</p>
      </div>

      {/* Account details */}
      <form onSubmit={saveAccount} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="size-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <User className="size-5 text-[#ef4444]" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-800">Account details</h3>
            <p className="text-xs text-slate-400">Your name and email address</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field id="admin-name" label="Full name" value={name} onChange={setName} placeholder="Admin" />
          <Field id="admin-email" label="Email address" type="email" value={email} onChange={setEmail} placeholder="admin@example.com" />
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-2">Phone number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                value={account?.phone ?? ""}
                disabled
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Phone number can&apos;t be changed here — contact a developer if it needs to be updated.</p>
          </div>
        </div>

        <button type="submit" disabled={savingAccount}
          className="mt-6 flex items-center gap-2 h-10 px-5 bg-[#ef4444] hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition">
          <Save className="size-4" /> {savingAccount ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={changePassword} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="size-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Lock className="size-5 text-[#ef4444]" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-800">Change password</h3>
            <p className="text-xs text-slate-400">Use a strong password you don&apos;t use elsewhere</p>
          </div>
        </div>

        <div className="space-y-4">
          <Field id="current-pw" label="Current password" type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="new-pw" label="New password" type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" />
            <Field id="confirm-pw" label="Confirm new password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
          </div>
        </div>

        <button type="submit" disabled={savingPw}
          className="mt-6 flex items-center gap-2 h-10 px-5 bg-[#ef4444] hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition">
          <KeyRound className="size-4" /> {savingPw ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}

function Field({ id, label, value, onChange, placeholder, type = "text" }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-slate-600 mb-2">{label}</label>
      <input
        id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete="off"
        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/5"
      />
    </div>
  );
}
