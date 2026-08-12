"use client";

import { useState } from "react";
import { ProfileShell } from "@/components/site/ProfileShell";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useStore();
  if (!user) return null;

  return (
    <ProfileShell>
      <SettingsInner initName={user.name} email={user.email ?? ""} />
    </ProfileShell>
  );
}

function SettingsInner({ initName, email: initEmail }: { initName: string; email: string }) {
  const { login, user } = useStore();
  const [name, setName] = useState(initName);
  const [email, setEmail] = useState(initEmail);
  const [savingAccount, setSavingAccount] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSavingAccount(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Could not save"); return; }
      // Reflect the new name/email in the header + local user immediately.
      if (user) login({ ...user, name: data.user.name, email: data.user.email ?? undefined });
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
        method: "PATCH", headers: { "Content-Type": "application/json" },
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
    <div className="animate-fade-up space-y-4 lg:space-y-5">
      <form onSubmit={saveAccount} className="bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] p-5 sm:p-6 lg:p-7">
        <h3 className="text-[15px] sm:text-base lg:text-lg font-bold tracking-tight">Account Settings</h3>
        <div className="mt-5 lg:mt-6">
          <Field id="full-name" label="Full Name" value={name} onChange={setName} placeholder="John Doe" />
        </div>
        <div className="mt-4 lg:mt-5">
          <Field id="email" label="Email Address" type="email" value={email} onChange={setEmail} placeholder="john.doe@example.com" />
        </div>
        <button type="submit" disabled={savingAccount} className="mt-6 inline-flex items-center justify-center h-10 lg:h-11 px-5 lg:px-6 rounded-full bg-black text-white text-xs lg:text-sm font-semibold hover:bg-accent active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-50">
          {savingAccount ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] p-5 sm:p-6 lg:p-7">
        <h3 className="text-[15px] sm:text-base lg:text-lg font-bold tracking-tight">Change Password</h3>
        <div className="mt-5 lg:mt-6">
          <Field id="current-pw" label="Current Password" type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" />
        </div>
        <div className="mt-4 lg:mt-5 grid sm:grid-cols-2 gap-4 lg:gap-5">
          <Field id="new-pw" label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" />
          <Field id="confirm-pw" label="Confirm Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
        </div>
        <button type="submit" disabled={savingPw} className="mt-6 inline-flex items-center justify-center h-10 lg:h-11 px-5 lg:px-6 rounded-full bg-black text-white text-xs lg:text-sm font-semibold hover:bg-accent active:scale-[0.98] transition-all duration-200 ease-out disabled:opacity-50">
          {savingPw ? "Updating…" : "Change Password"}
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
      <label htmlFor={id} className="block text-[12px] lg:text-[13px] font-semibold text-foreground mb-2">{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off"
        className="w-full h-10 lg:h-11 px-3.5 lg:px-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-muted-foreground/70 outline-none transition-all duration-200 hover:border-gray-300 focus:border-black focus:ring-4 focus:ring-black/5" />
    </div>
  );
}
