"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "bn";

type Dict = Record<string, { en: string; bn: string }>;

export const dict: Dict = {
  // top bar
  "topbar.delivery": { en: "Free delivery on orders over ৳1,500 · Cash on Delivery available", bn: "১,৫০০৳-এর উপরে ফ্রি ডেলিভারি · ক্যাশ অন ডেলিভারি সুবিধা" },
  // search
  "search.placeholder": { en: "Search products, brands and categories", bn: "পণ্য, ব্র্যান্ড ও ক্যাটাগরি খুঁজুন" },
  "search.mobile": { en: "Search Tanni Fashion House", bn: "Tanni Fashion House-এ খুঁজুন" },
  // user
  "user.signin": { en: "Sign in", bn: "সাইন ইন" },
  "user.signout": { en: "Sign out", bn: "সাইন আউট" },
  "user.profile": { en: "My profile", bn: "আমার প্রোফাইল" },
  "user.orders": { en: "My orders", bn: "আমার অর্ডার" },
  "user.wishlist": { en: "Wishlist", bn: "উইশলিস্ট" },
  "user.menu": { en: "Menu", bn: "মেনু" },
  "user.create": { en: "Create account", bn: "অ্যাকাউন্ট তৈরি করুন" },
  "user.welcome_back": { en: "Welcome back to Tanni Fashion House", bn: "Tanni Fashion House-এ আবার স্বাগতম" },
  "user.signup_subtitle": { en: "Shop faster, track orders, save favourites.", bn: "দ্রুত কিনুন, অর্ডার ট্র্যাক করুন, প্রিয় পণ্য সংরক্ষণ করুন।" },
  "user.fullname": { en: "Full name", bn: "পুরো নাম" },
  "user.phone": { en: "Phone number", bn: "ফোন নম্বর" },
  "user.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "user.phone_or_email": { en: "Phone or email", bn: "ফোন বা ইমেইল" },
  "user.new_here": { en: "New here?", bn: "নতুন এখানে?" },
  "user.have_account": { en: "Already have an account?", bn: "ইতিমধ্যে অ্যাকাউন্ট আছে?" },
  // nav
  "nav.gadgets": { en: "Gadgets", bn: "গ্যাজেট" },
  "nav.fashion": { en: "Fashion", bn: "ফ্যাশন" },
  "nav.home": { en: "Home & Living", bn: "হোম ও লিভিং" },
  "nav.beauty": { en: "Beauty", bn: "বিউটি" },
  "nav.grocery": { en: "Grocery", bn: "মুদি" },
  "nav.deals": { en: "Deals", bn: "অফার" },
  "nav.track": { en: "Track order", bn: "অর্ডার ট্র্যাক করুন" },
  // category strip short
  "cat.gadgets": { en: "Gadgets", bn: "গ্যাজেট" },
  "cat.fashion": { en: "Fashion", bn: "ফ্যাশন" },
  "cat.home": { en: "Home", bn: "হোম" },
  "cat.beauty": { en: "Beauty", bn: "বিউটি" },
  "cat.grocery": { en: "Grocery", bn: "মুদি" },
  "cat.deals": { en: "Deals", bn: "অফার" },
  // hero
  "hero.s1.eyebrow": { en: "New season", bn: "নতুন সিজন" },
  "hero.s1.title": { en: "Fashion sale for everyone", bn: "সবার জন্য ফ্যাশন সেল" },
  "hero.s1.subtitle": { en: "Wear the change. Fashion that feels good.", bn: "পরিবর্তন পরিধান করুন। আরামদায়ক ফ্যাশন।" },
  "hero.s1.cta": { en: "Shop now", bn: "এখনই কিনুন" },
  "hero.s2.eyebrow": { en: "Gadgets week", bn: "গ্যাজেটস উইক" },
  "hero.s2.title": { en: "Smarter tech, fairer prices", bn: "স্মার্ট প্রযুক্তি, সঠিক দাম" },
  "hero.s2.subtitle": { en: "Phones, audio and wearables — delivered nationwide.", bn: "ফোন, অডিও ও ওয়্যারেবল — সারাদেশে ডেলিভারি।" },
  "hero.s2.cta": { en: "Explore gadgets", bn: "গ্যাজেট দেখুন" },
  "hero.s3.eyebrow": { en: "Beauty edit", bn: "বিউটি এডিট" },
  "hero.s3.title": { en: "Glow up your routine", bn: "রুটিন আরও উজ্জ্বল করুন" },
  "hero.s3.subtitle": { en: "Premium beauty essentials, curated for you.", bn: "আপনার জন্য বাছাই করা প্রিমিয়াম বিউটি পণ্য।" },
  "hero.s3.cta": { en: "Shop beauty", bn: "বিউটি কিনুন" },
  // sections
  "sec.featured.eyebrow": { en: "Best of the week", bn: "এই সপ্তাহের সেরা" },
  "sec.featured.title": { en: "Featured products", bn: "ফিচারড পণ্য" },
  "sec.viewall": { en: "View all", bn: "সব দেখুন" },
  "sec.fashion.eyebrow": { en: "Wear the season", bn: "সিজনের পোশাক" },
  "sec.fashion.title": { en: "Fashion edit", bn: "ফ্যাশন এডিট" },
  "sec.gadgets.eyebrow": { en: "Smarter tech", bn: "স্মার্ট প্রযুক্তি" },
  "sec.gadgets.title": { en: "Gadgets & electronics", bn: "গ্যাজেট ও ইলেকট্রনিক্স" },
  "sec.home.eyebrow": { en: "For your space", bn: "আপনার ঘরের জন্য" },
  "sec.home.title": { en: "Home & living", bn: "হোম ও লিভিং" },
  "sec.beauty.eyebrow": { en: "Glow up", bn: "সৌন্দর্য চর্চা" },
  "sec.beauty.title": { en: "Beauty & care", bn: "বিউটি ও কেয়ার" },
  "sec.trending.eyebrow": { en: "Hot right now", bn: "এখন জনপ্রিয়" },
  "sec.trending.title": { en: "Trending products", bn: "ট্রেন্ডিং পণ্য" },
  "badge.trending": { en: "Trending", bn: "ট্রেন্ডিং" },
  // offers
  "offers.limited": { en: "Limited time", bn: "সীমিত সময়" },
  "offers.title_1": { en: "Mega deals — up to", bn: "মেগা ডিল — সর্বোচ্চ" },
  "offers.title_2": { en: "OFF", bn: "ছাড়" },
  "offers.subtitle": { en: "Hand-picked offers refreshed daily. Shop before the timer runs out.", bn: "প্রতিদিন বাছাই করা অফার। সময় শেষ হওয়ার আগেই কিনুন।" },
  "offers.hrs": { en: "Hrs", bn: "ঘণ্টা" },
  "offers.min": { en: "Min", bn: "মিনিট" },
  "offers.sec": { en: "Sec", bn: "সেকেন্ড" },
  // trust
  "trust.delivery.title": { en: "Nationwide delivery", bn: "সারাদেশে ডেলিভারি" },
  "trust.delivery.desc": { en: "1–3 days across Bangladesh", bn: "বাংলাদেশজুড়ে ১–৩ দিনে" },
  "trust.secure.title": { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  "trust.secure.desc": { en: "Pay when you receive", bn: "পণ্য হাতে পেয়ে টাকা দিন" },
  "trust.returns.title": { en: "Check on delivery", bn: "ডেলিভারিতে যাচাই" },
  "trust.returns.desc": { en: "Return at your doorstep", bn: "দরজায় দাঁড়িয়ে রিটার্ন" },
  "trust.support.title": { en: "24/7 support", bn: "২৪/৭ সাপোর্ট" },
  "trust.support.desc": { en: "We're here to help", bn: "আমরা সাহায্যে আছি" },
  // footer
  "footer.tagline": { en: "Your outfit, your identity — a trusted address for tasteful, premium clothing. Cash on Delivery, nationwide.", bn: "আপনার পোশাক, আপনার ব্যক্তিত্বের পরিচয় — রুচিশীল ও প্রিমিয়াম পোশাকের বিশ্বস্ত ঠিকানা। ক্যাশ অন ডেলিভারি।" },
  "footer.bn_tagline": { en: "A new address for shopping", bn: "কেনাকাটার নতুন ঠিকানা" },
  "footer.shop": { en: "Shop", bn: "শপ" },
  "footer.help": { en: "Help", bn: "সাহায্য" },
  "footer.company": { en: "Company", bn: "কোম্পানি" },
  "footer.l.gadgets": { en: "T-Shirts", bn: "টি-শার্ট" },
  "footer.l.fashion": { en: "Shirts", bn: "শার্ট" },
  "footer.l.home": { en: "Panjabi", bn: "পাঞ্জাবি" },
  "footer.l.beauty": { en: "Dresses", bn: "ড্রেস" },
  "footer.l.grocery": { en: "Shoes", bn: "জুতা" },
  "footer.l.track": { en: "Track order", bn: "অর্ডার ট্র্যাক" },
  "footer.l.shipping": { en: "Shipping", bn: "শিপিং" },
  "footer.l.returns": { en: "Returns", bn: "রিটার্ন" },
  "footer.l.faq": { en: "FAQ", bn: "প্রশ্নোত্তর" },
  "footer.l.contact": { en: "Contact", bn: "যোগাযোগ" },
  "footer.l.about": { en: "About", bn: "আমাদের সম্পর্কে" },
  "footer.l.careers": { en: "Careers", bn: "ক্যারিয়ার" },
  "footer.l.press": { en: "Press", bn: "প্রেস" },
  "footer.l.blog": { en: "Blog", bn: "ব্লগ" },
  "footer.copyright": { en: "© 2026 Tanni Fashion House · All rights reserved", bn: "© ২০২৬ Tanni Fashion House · সর্বস্বত্ব সংরক্ষিত" },
  "footer.made": { en: "Made in Bangladesh 🇧🇩", bn: "বাংলাদেশে তৈরি 🇧🇩" },
  // language toggle
  "lang.toggle": { en: "বাংলা", bn: "EN" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shopbd:lang") as Lang | null;
      if (saved === "en" || saved === "bn") setLangState(saved);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("shopbd:lang", l); } catch {}
  };
  const t = (k: keyof typeof dict) => dict[k]?.[lang] ?? String(k);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const v = useContext(I18nCtx);
  if (!v) throw new Error("useT must be used within I18nProvider");
  return v;
}
