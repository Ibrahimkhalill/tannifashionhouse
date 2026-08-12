"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useProductCache } from "@/hooks/useProductCache";

export function WishlistDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const { lang } = useT();
  const productCache = useProductCache(wishlist);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const items = wishlist.map((id) => productCache[id]).filter(Boolean);

  const addAllToCart = () => {
    items.forEach((item) => addToCart(item.id, { size: item.sizes[0] }));
    toast.success("Wishlist added to cart");
  };

  return (
    <div className="fixed inset-0 z-[60] animate-fade-in">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={onClose} />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-background shadow-2xl flex flex-col animate-slide-right ${lang === "bn" ? "font-bn" : ""}`}
        role="dialog"
        aria-label="Wishlist"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="size-4 fill-current text-accent" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">My wishlist</p>
              <p className="text-[11px] text-muted-foreground">{items.length} {items.length === 1 ? "item" : "items"}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-9 rounded-full border flex items-center justify-center hover:bg-secondary transition" aria-label="Close wishlist">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="size-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Heart className="size-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold">Your wishlist is empty</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Save products you love and find them here later.</p>
              <button onClick={onClose} className="h-11 px-6 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition">
                Continue shopping
              </button>
            </div>
          ) : (
            <ul className="p-4 space-y-3">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 rounded-2xl border bg-card p-3 hover:border-foreground/30 transition">
                  <Link href={`/product/${item.id}`} onClick={onClose} className="size-20 rounded-xl bg-secondary overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="size-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start gap-2">
                      <Link href={`/product/${item.id}`} onClick={onClose} className="text-sm font-medium leading-snug line-clamp-2 hover:text-accent transition flex-1">
                        {item.name}
                      </Link>
                      <button onClick={() => { toggleWishlist(item.id); toast("Removed from wishlist"); }} className="size-7 rounded-full hover:bg-secondary flex items-center justify-center shrink-0 text-muted-foreground hover:text-accent transition" aria-label="Remove from wishlist">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{item.category}</p>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <p className="text-sm font-semibold">BDT {item.price.toLocaleString()}</p>
                      <button
                        onClick={() => { addToCart(item.id, { size: item.sizes[0] }); toast.success("Added to cart", { description: item.name }); }}
                        className="h-8 px-3 rounded-full bg-foreground text-background text-xs font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition"
                      >
                        <ShoppingCart className="size-3" /> Add
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className=" bg-card shrink-0 p-5 space-y-3">
          
            <div className="grid grid-cols-2 gap-2">
              <Link href="/wishlist" onClick={onClose} className="h-11 rounded-full border-2 border-foreground/90 text-sm font-semibold flex items-center justify-center hover:bg-secondary transition">
                View wishlist
              </Link>

              <button onClick={addAllToCart} className="w-full h-12 rounded-full bg-foreground text-background text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition">
              <ShoppingCart className="size-4" /> Add all to cart
            </button>
             
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}