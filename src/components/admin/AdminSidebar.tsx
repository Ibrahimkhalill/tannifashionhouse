"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, Users, X,
  BarChart2, LogOut, Layers, Image, Home, Ruler, Palette, Store, Settings,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const NAV = [
  {
    label: null,
    items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" }],
  },
  {
    label: "CATALOG",
    items: [
      { icon: Package, label: "Products",   href: "/admin/products" },
      { icon: Layers,  label: "Categories", href: "/admin/categories" },
      { icon: Ruler,   label: "Sizes",      href: "/admin/sizes" },
      { icon: Palette, label: "Colors",     href: "/admin/colors" },
      { icon: Store,   label: "Brands",     href: "/admin/brands" },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { icon: Image, label: "Hero Slider",     href: "/admin/banners" },
      { icon: Home,  label: "Homepage Config", href: "/admin/homepage" },
    ],
  },
  {
    label: "ORDERS",
    items: [
      { icon: ShoppingCart, label: "Orders",    href: "/admin/orders" },
      { icon: Users,        label: "Customers", href: "/admin/customers" },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 shrink-0">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2">
          <div className="min-w-0 leading-none">
            <span className="text-lg font-bold text-[#ef4444]">Tanni</span>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Fashion House</p>
          </div>
          <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white/70">ADMIN</span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white transition">
          <X className="size-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2 mb-2">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? "bg-[#ef4444] text-white shadow-lg shadow-red-500/20"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" strokeWidth={active ? 2.5 : 2} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-1 shrink-0">
        <Link
          href="/admin/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/admin/settings"
              ? "bg-[#ef4444] text-white shadow-lg shadow-red-500/20"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Settings className="size-4 shrink-0" strokeWidth={pathname === "/admin/settings" ? 2.5 : 2} />
          Settings
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <BarChart2 className="size-4" strokeWidth={2} />
          View Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="size-4" strokeWidth={2} />
          Logout
        </button>
        <Link
          href="/admin/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl hover:bg-white/10 transition"
        >
          <div className="size-8 rounded-full bg-[#ef4444] flex items-center justify-center text-white text-xs font-bold shrink-0">
            A
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.user?.name ?? "Admin User"}</p>
            <p className="text-xs text-white/40 truncate">{session?.user?.phone ?? ""}</p>
          </div>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#0f172a] h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f172a] flex flex-col animate-slide-left">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
