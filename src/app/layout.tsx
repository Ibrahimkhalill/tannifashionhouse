import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// Distinctive display/body font for the fashion brand (was Inter).
const inter = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const hind = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  variable: "--font-hind",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Tanni Fashion House — Bangladesh's Best Online Shopping Platform",
  description: "Tanni Fashion House — Bangladesh's Best Online Shopping Platform",
  authors: [{ name: "Tanni Fashion House" }],
  openGraph: {
    title: "Tanni Fashion House — Bangladesh's Best Online Shopping Platform",
    description: "Tanni Fashion House — Bangladesh's Best Online Shopping Platform",
    type: "website",
  },
  twitter: {
    card: "summary",
    site: "@TanniFashionHouse",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full w-full min-w-0">
      <body className={`${inter.variable} ${hind.variable} ${inter.className} min-h-full w-full min-w-0 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
