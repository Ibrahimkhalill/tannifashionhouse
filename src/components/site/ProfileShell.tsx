"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { Layout } from "@/components/site/Layout";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Package, Bell, MapPin, Settings,
  Heart, ShoppingCart, LogOut, ChevronRight, X, Menu,
} from "lucide-react";

const NAV = [
  { href: "/profile",               label: "Dashboard",     icon: LayoutDashboard, exact: true },
  { href: "/profile/orders",        label: "Order History", icon: Package },
  { href: "/profile/notifications", label: "Notifications", icon: Bell },
  { href: "/profile/addresses",     label: "My Addresses",  icon: MapPin },
  { href: "/profile/settings",      label: "Settings",      icon: Settings },
];

const NAV_LINKS = [
  { href: "/wishlist", label: "Wishlist",      icon: Heart },
  { href: "/cart",     label: "Shopping Cart", icon: ShoppingCart },
];

export function ProfileShell({ children, title, activeLabel, activeIcon: ActiveIconOverride }: {
  children: React.ReactNode;
  title?: string;
  activeLabel?: string;
  activeIcon?: LucideIcon;
}) {
  const { user, logout } = useStore();
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Only redirect once auth has resolved — otherwise a logged-in user is
  // bounced to "/" on direct navigation/refresh before the session loads.
  useEffect(() => {
    if (status !== "loading" && !user) router.replace("/");
  }, [status, user, router]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [drawerOpen]);

  // While the session is resolving, show a shimmer placeholder that mirrors
  // the profile layout instead of redirecting or flashing an empty screen.
  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
          {status === "loading" ? (
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              {/* sidebar */}
              <div className="hidden space-y-2 lg:block">
                <div className="skeleton-shimmer h-16 rounded-2xl" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-11 rounded-xl" />
                ))}
              </div>
              {/* content */}
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Layout>
    );
  }

  const handleLogout = () => {
    logout();
    toast("Signed out");
    router.push("/");
  };

  const matchedNav = NAV.find((n) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href)
  ) ?? NAV[0];
  const activeNav = {
    ...matchedNav,
    label: activeLabel ?? matchedNav.label,
    icon: ActiveIconOverride ?? matchedNav.icon,
  };

  return (
    <Layout hideTrust>
      <div className="min-h-screen bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-5 lg:px-6 lg:py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 lg:mb-6">
            <Link href="/" className="hover:text-foreground transition">Home</Link>
            <ChevronRight className="size-3" />
            <Link href="/profile" className="hover:text-foreground transition">My Account</Link>
            {activeNav.href !== "/profile" && (
              <>
                <ChevronRight className="size-3" />
                <span className="text-foreground font-medium">{activeNav.label}</span>
              </>
            )}
            {activeNav.href === "/profile" && (
              <ChevronRight className="size-3" />
            )}
            {activeNav.href === "/profile" && (
              <span className="text-foreground font-medium">Dashboard</span>
            )}
          </nav>

          <div className="grid lg:grid-cols-[280px_1fr] gap-4 lg:gap-6 items-start">

            {/* Mobile trigger pill */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center justify-between w-full bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04)] px-3.5 py-2.5 active:scale-[0.99] transition"
              aria-label="Open account navigation"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span className="size-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <activeNav.icon className="size-[18px] text-black" strokeWidth={2} />
                </span>
                <span className="text-left min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 font-semibold">My Account</span>
                  <span className="block text-[13px] font-bold truncate">{activeNav.label}</span>
                </span>
              </span>
              <span className="size-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Menu className="size-[18px]" strokeWidth={2} />
              </span>
            </button>

            {/* Desktop sidebar */}
            <aside className="hidden lg:block sticky top-24 self-start bg-white rounded-2xl border shadow-[0_1px_3px_oklch(0_0_0/0.04),0_12px_32px_-18px_oklch(0_0_0/0.06)] overflow-hidden">
              <SidebarPanel user={user} pathname={pathname} onLogout={handleLogout} />
            </aside>

            {/* Mobile drawer */}
            {drawerOpen && createPortal(
              <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setDrawerOpen(false)}
                  className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
                />
                <aside className="absolute left-0 top-0 h-full w-[320px] max-w-[88vw] bg-white shadow-2xl animate-in slide-in-from-left duration-300 ease-out flex flex-col">
                  <SidebarPanel user={user} pathname={pathname} onLogout={handleLogout} onClose={() => setDrawerOpen(false)} />
                </aside>
              </div>,
              document.body
            )}

            {/* Page content */}
            <div className="min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function SidebarPanel({
  user, pathname, onLogout, onClose,
}: {
  user: { name: string; phone: string; email?: string };
  pathname: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  const isActive = (nav: typeof NAV[number]) =>
    nav.exact ? pathname === nav.href : pathname.startsWith(nav.href);

  return (
    <>
      {/* Header */}
      <div className="px-4 lg:px-5 pt-4 pb-3 lg:pt-5 lg:pb-4 border-b flex items-center gap-2.5">
        <div className="size-10 lg:size-11 rounded-xl bg-black text-white flex items-center justify-center text-sm lg:text-base font-bold shrink-0">
          {user.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 font-semibold">Signed in</p>
          <p className="text-[13px] lg:text-sm font-bold truncate">{user.name}</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close navigation"
            className="size-9 rounded-xl bg-secondary hover:bg-border flex items-center justify-center transition lg:hidden">
            <X className="size-[18px]" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="py-2 lg:py-3 px-2.5 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2.5 my-0.5 rounded-xl relative
                text-[13px] lg:text-sm font-medium
                transition-all duration-200 ease-out
                active:scale-[0.985]
                ${active
                  ? "text-black font-semibold bg-accent/10"
                  : "text-muted-foreground hover:text-black hover:bg-secondary/60"}
              `}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-accent" />
              )}
              <span className={`size-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                active ? "bg-accent text-white" : "bg-secondary text-muted-foreground"
              }`}>
                <item.icon className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="truncate text-left">{item.label}</span>
              {active && <ChevronRight className="size-3.5 text-accent ml-auto shrink-0" />}
            </Link>
          );
        })}

        <div className="mt-1 pt-1 border-t border-border/60">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 my-0.5 rounded-xl text-[13px] lg:text-sm font-medium text-muted-foreground hover:text-black hover:bg-secondary/60 transition-all duration-200"
            >
              <span className="size-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <item.icon className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="truncate">{item.label}</span>
              <ChevronRight className="size-3.5 ml-auto shrink-0 opacity-40" />
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-2.5 pb-3 pt-1.5 border-t">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[13px] lg:text-sm font-medium text-muted-foreground hover:text-accent hover:bg-accent/10 active:scale-[0.985] transition-all duration-200 ease-out"
        >
          <span className="size-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <LogOut className="size-[18px]" strokeWidth={2} />
          </span>
          Log out
        </button>
      </div>
    </>
  );
}
