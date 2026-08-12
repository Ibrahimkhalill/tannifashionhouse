import { useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

export function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { login } = useStore();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [loading, setLoading] = useState(false);

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  // Signup state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [spw, setSpw] = useState("");
  const [showSpw, setShowSpw] = useState(false);

  if (!open) return null;

  const resetForms = () => {
    setIdentifier(""); setPw(""); setShowPw(false); setRemember(false);
    setName(""); setPhone(""); setEmail(""); setSpw(""); setShowSpw(false);
  };

  const close = () => { resetForms(); onClose(); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !pw) { toast.error("Enter your phone number or email and password"); return; }
    setLoading(true);
    try {
      const res = await signIn("credentials", { phone: identifier, password: pw, redirect: false });
      if (res?.error) {
        toast.error("Invalid phone/email or password");
        return;
      }
      login({ name: identifier, phone: identifier });
      toast.success("Welcome back!");
      close();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !spw) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email.trim() || undefined, password: spw }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create account");
        return;
      }
      const signInRes = await signIn("credentials", { phone, password: spw, redirect: false });
      if (signInRes?.error) {
        toast.error("Account created — please sign in");
        setTab("login");
        return;
      }
      login({ name, phone });
      toast.success("Account created!", { description: `Welcome, ${name}!` });
      close();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Close button */}
        <button
          onClick={close}
          className="absolute right-4 top-4 z-10 size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="px-7 pt-8 pb-7">
          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {tab === "login" ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {tab === "login"
                ? "Sign in to access your personalized experience."
                : "Shop faster, track orders, save favourites."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-full bg-secondary mb-6">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 h-9 rounded-full text-sm font-semibold transition ${tab === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 h-9 rounded-full text-sm font-semibold transition ${tab === "signup" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Register
            </button>
          </div>

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Phone number or email <span className="text-red-500">*</span>
                </label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Phone number or email"
                  className="w-full h-12 px-4 rounded-2xl border bg-background text-sm outline-none focus:border-foreground transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    type={showPw ? "text" : "password"}
                    placeholder="Password"
                    className="w-full h-12 px-4 pr-12 rounded-2xl border bg-background text-sm outline-none focus:border-foreground transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="size-4 rounded border"
                  />
                  Remember me
                </label>
                <button type="button" className="text-sm underline underline-offset-2 font-medium hover:text-accent transition">
                  Forgot Your Password?
                </button>
              </div>

              <button disabled={loading} className="w-full h-12 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition mt-1 disabled:opacity-60">
                {loading ? "Signing in…" : "Login"}
              </button>
            </form>
          )}

          {/* Signup form */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-12 px-4 rounded-2xl border bg-background text-sm outline-none focus:border-foreground transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full h-12 px-4 rounded-2xl border bg-background text-sm outline-none focus:border-foreground transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email address</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email address (optional)"
                  className="w-full h-12 px-4 rounded-2xl border bg-background text-sm outline-none focus:border-foreground transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    value={spw}
                    onChange={(e) => setSpw(e.target.value)}
                    type={showSpw ? "text" : "password"}
                    placeholder="Password"
                    className="w-full h-12 px-4 pr-12 rounded-2xl border bg-background text-sm outline-none focus:border-foreground transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSpw(!showSpw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showSpw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <button disabled={loading} className="w-full h-12 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition mt-1 disabled:opacity-60">
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}

          {/* Footer switch */}
          <p className="mt-5 text-sm text-muted-foreground text-center">
            {tab === "login" ? (
              <>{"Don't have an account? "}
                <button onClick={() => setTab("signup")} className="font-semibold text-foreground hover:underline">
                  Register
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button onClick={() => setTab("login")} className="font-semibold text-foreground hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
