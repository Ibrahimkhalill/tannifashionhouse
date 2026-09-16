const fs = require("fs");
const path = "src/app/product/[id]/layout.tsx";
const content = `import type { Metadata } from "next";
import { db } from "@/lib/db";

const DEFAULT_SITE_URL = "https://www.tannifashionhouse.com";

function getSiteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL;

  return raw.replace(/\/$/, "");
}

function toAbsoluteUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${baseUrl}${value}`;
  return `${baseUrl}/${value}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const siteUrl = getSiteUrl();

  const product = await db.product.findFirst({
    where: {
      OR: [{ slug: id }, { id }],
      status: "ACTIVE",
    },
    select: {
      slug: true,
      name: true,
      metaDesc: true,
      description: true,
      images: true,
    },
  });

  if (!product) {
    return {
      title: "Product",
      alternates: { canonical: `${siteUrl}/product/${id}` },
    };
  }

  const description =
    (product.metaDesc || "").trim() ||
    (product.description || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) ||
    "Tanni Fashion House product";

  const imageUrl = toAbsoluteUrl(product.images?.[0], siteUrl);
  const canonical = `${siteUrl}/product/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: product.name,
      description,
      images: imageUrl
        ? [{ url: imageUrl, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
fs.writeFileSync(path, content, "utf8");
