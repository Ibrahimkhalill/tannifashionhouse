"use client";

import { Layout } from "@/components/site/Layout";
import { HeroSlider } from "@/components/site/HeroSlider";
import { SubcategorySection } from "@/components/site/SubcategorySection";
import { FeaturedGrid } from "@/components/site/FeaturedGrid";
import { NewArrivals } from "@/components/site/NewArrivals";
import { TrendingSection } from "@/components/site/TrendingSection";

// Fashion-only storefront — every section is admin-driven and hides itself when
// there's no data (no hero slides / no featured / no trending / no promos).
function Index() {
  return (
    <Layout>
      <HeroSlider />

      {/* Shop by clothing category (admin categories) */}
      <SubcategorySection slug="fashion" title="Shop by Category" />

      {/* New arrivals — every product, newest first (normal products always show) */}
      <NewArrivals />

      {/* Featured (admin marks products "featured") */}
      <FeaturedGrid />

      {/* Trending (admin marks products "trending") */}
      <TrendingSection />
    </Layout>
  );
}

export default Index;
