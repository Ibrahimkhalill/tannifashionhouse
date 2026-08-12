// Shared content types for storefront components that read from the public API.
// These mirror the Prisma HeroSlide / PromoBanner / Category shapes.

export type HeroSlide = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  slug: string;
  image: string;
  gradient: string;
  active?: boolean;
  order?: number;
};

export type PromoBanner = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  bg: string;
  active?: boolean;
  order?: number;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  image?: string | null;
  status?: string;
};
