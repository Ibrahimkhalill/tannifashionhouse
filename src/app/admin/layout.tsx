"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":       "Dashboard",
  "/admin/products":        "Products",
  "/admin/products/new":    "Add Product",
  "/admin/orders":     "Orders",
  "/admin/customers":  "Customers",
  "/admin/categories": "Categories",
  "/admin/brands":     "Brands",
  "/admin/sizes":      "Sizes",
  "/admin/colors":     "Colors",
  "/admin/badges":     "Badges",
  "/admin/offers":    "Offers & Coupons",
  "/admin/banners":   "Hero Slider",
  "/admin/promos":    "Promo Banners",
  "/admin/homepage":  "Homepage Config",
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const title = PAGE_TITLES[pathname]
    ?? (pathname.endsWith("/edit") ? "Edit Product" : "Admin");

  if (isLogin) return <>{children}</>;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
