import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const U = (id: string, w = 600, h = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=75`;

async function main() {
  console.log("🌱 Seeding fashion store...");

  // ── Admin ──────────────────────────────────────────────────────────────────
  const phone    = process.env.ADMIN_PHONE    ?? "01700000000";
  const email    = process.env.ADMIN_EMAIL    ?? "admin@fashionstore.com";
  const password = process.env.ADMIN_PASSWORD ?? "change_me";

  const existingAdmin = await db.user.findFirst({ where: { OR: [{ phone }, { email }] } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(password, 12);
    await db.user.create({ data: { name: "Admin", phone, email, password: hashed, role: "ADMIN" } });
    console.log("✓ Admin created:", phone);
  } else {
    console.log("✓ Admin already exists");
  }

  // ── Parent category (fashion only) ───────────────────────────────────────────
  const parent = await db.category.upsert({
    where: { slug: "fashion" },
    update: { name: "Fashion", image: U("photo-1558618666-fcd25c85cd64", 400, 300) },
    create: { name: "Fashion", slug: "fashion", image: U("photo-1558618666-fcd25c85cd64", 400, 300), status: "ACTIVE" },
  });

  // ── Subcategories (clothing types) ───────────────────────────────────────────
  const subCats = [
    { slug: "t-shirts",  name: "T-Shirts",  image: U("photo-1521572163474-6864f9cf17ab", 400, 300) },
    { slug: "shirts",    name: "Shirts",    image: U("photo-1602810316693-3667c854239a", 400, 300) },
    { slug: "polo",      name: "Polo",      image: U("photo-1586790170083-2f9ceadc732d", 400, 300) },
    { slug: "panjabi",   name: "Panjabi",   image: U("photo-1610030469983-98e550d6193c", 400, 300) },
    { slug: "jeans",     name: "Jeans",     image: U("photo-1576871337622-98d48d1cf531", 400, 300) },
    { slug: "tops",      name: "Tops",      image: U("photo-1558769132-cb1aea458c5e", 400, 300) },
    { slug: "dresses",   name: "Dresses",   image: U("photo-1515372039744-b8f02a3ae446", 400, 300) },
    { slug: "outerwear", name: "Outerwear", image: U("photo-1539109136881-3be0616acf4b", 400, 300) },
    { slug: "shoes",     name: "Shoes",     image: U("photo-1542291026-7eec264c27ff", 400, 300) },
  ];
  for (const s of subCats) {
    await db.category.upsert({
      where: { slug: s.slug },
      update: { name: s.name, image: s.image, parentId: parent.id },
      create: { name: s.name, slug: s.slug, image: s.image, parentId: parent.id, status: "ACTIVE" },
    });
  }
  console.log("✓ Categories seeded");

  // ── Brands ────────────────────────────────────────────────────────────────
  const brands = [
    { slug: "urbanfit",    name: "UrbanFit",     description: "Everyday urban wear" },
    { slug: "loom-field",  name: "Loom & Field", description: "Premium outerwear" },
    { slug: "aerostep",    name: "AeroStep",     description: "Sports footwear" },
    { slug: "denimco",     name: "DenimCo",      description: "Denim specialists" },
    { slug: "boardroombd", name: "BoardroomBD",  description: "Formal wear" },
    { slug: "panjabihouse",name: "Panjabi House",description: "Traditional panjabi" },
    { slug: "stylehut",    name: "StyleHut",     description: "Women's fashion" },
  ];
  const brandMap: Record<string, string> = {};
  for (const b of brands) {
    const brand = await db.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, description: b.description },
      create: { name: b.name, slug: b.slug, description: b.description, status: "ACTIVE" },
    });
    brandMap[b.slug] = brand.id;
  }
  console.log("✓ Brands seeded");

  // ── Products (fashion only) ──────────────────────────────────────────────────
  const products = [
    {
      slug: "cotton-tshirt", name: "Premium Cotton T-Shirt",
      subcategory: "T-Shirts", brand: "urbanfit", material: "100% cotton jersey",
      sizes: ["S", "M", "L", "XL"], price: 1200, oldPrice: 1500, stock: 40,
      images: [U("photo-1521572163474-6864f9cf17ab"), U("photo-1583743814966-8936f5b7be1a"), U("photo-1618354691373-d851c5c3a990"), U("photo-1529374255404-311a2a4f1fd9")],
      colorImages: [U("photo-1521572163474-6864f9cf17ab"), U("photo-1583743814966-8936f5b7be1a"), U("photo-1618354691373-d851c5c3a990"), U("photo-1529374255404-311a2a4f1fd9")],
      colors: ["#f5b6c8", "#7d8ce0", "#ffffff", "#000000"],
      badgeLabel: "New", badgeTone: "new", featured: true, trending: true,
      tags: ["cotton", "summer", "casual"],
      description: "Classic premium cotton t-shirt for everyday wear. Breathable fabric, perfect fit.",
    },
    {
      slug: "polo-shirt", name: "Classic Pique Polo Shirt",
      subcategory: "Polo", brand: "urbanfit", material: "Cotton pique",
      sizes: ["S", "M", "L", "XL"], price: 1450, oldPrice: 1800, stock: 35,
      images: [U("photo-1586790170083-2f9ceadc732d"), U("photo-1571945153237-4929e783af4a"), U("photo-1618453292459-53424b66bb6a")],
      colorImages: [], colors: ["#1e3a5f", "#ffffff", "#22c55e"],
      badgeLabel: undefined, badgeTone: undefined, featured: true, trending: false,
      tags: ["polo", "casual", "cotton"],
      description: "Smart-casual pique polo. Soft, durable, and easy to style.",
    },
    {
      slug: "formal-shirt", name: "Slim Fit Formal Shirt",
      subcategory: "Shirts", brand: "boardroombd", material: "Cotton poplin",
      sizes: ["S", "M", "L", "XL"], price: 1800, oldPrice: 2200, stock: 29,
      images: [U("photo-1602810316693-3667c854239a"), U("photo-1620012253295-c15cc3e65df4"), U("photo-1563630423918-b58f07336ac9"), U("photo-1604695573706-53170668f6a6")],
      colorImages: [], colors: ["#ffffff", "#add8e6", "#d3d3d3"],
      badgeLabel: undefined, badgeTone: undefined, featured: false, trending: false,
      tags: ["shirt", "formal", "office"],
      description: "Slim fit formal shirt for professional occasions.",
    },
    {
      slug: "casual-denim-shirt", name: "Casual Denim Shirt",
      subcategory: "Shirts", brand: "denimco", material: "Denim cotton",
      sizes: ["S", "M", "L", "XL"], price: 1650, oldPrice: 2000, stock: 26,
      images: [U("photo-1596755094514-f87e34085b2c"), U("photo-1589310243389-96a5483213a8"), U("photo-1607345366928-199ea26cfe3e")],
      colorImages: [], colors: ["#4a6fa5", "#2c2c2c"],
      badgeLabel: "Sale", badgeTone: "sale", featured: false, trending: true,
      tags: ["denim", "shirt", "casual"],
      description: "Rugged casual denim shirt — layer it or wear it solo.",
    },
    {
      slug: "premium-panjabi", name: "Premium Cotton Panjabi",
      subcategory: "Panjabi", brand: "panjabihouse", material: "Premium cotton",
      sizes: ["38", "40", "42", "44"], price: 2400, oldPrice: 3000, stock: 22,
      images: [U("photo-1610030469983-98e550d6193c"), U("photo-1622470953794-aa9c70b0fb9d"), U("photo-1621786030484-4c855eed6974")],
      colorImages: [], colors: ["#ffffff", "#1e3a5f", "#a06b48"],
      badgeLabel: "New", badgeTone: "new", featured: true, trending: true,
      tags: ["panjabi", "eid", "traditional"],
      description: "Elegant premium cotton panjabi for festive occasions.",
    },
    {
      slug: "slim-jeans", name: "Slim Fit Stretch Jeans",
      subcategory: "Jeans", brand: "denimco", material: "Stretch denim",
      sizes: ["30", "32", "34", "36"], price: 2100, oldPrice: 2600, stock: 33,
      images: [U("photo-1541099649105-f69ad21f3246"), U("photo-1542272604-787c3835535d"), U("photo-1555689502-c4b22d76c56f")],
      colorImages: [], colors: ["#1e3a5f", "#2c2c2c", "#6b7280"],
      badgeLabel: undefined, badgeTone: undefined, featured: false, trending: true,
      tags: ["jeans", "denim", "slim"],
      description: "Comfortable slim fit stretch jeans that move with you.",
    },
    {
      slug: "denim-jacket", name: "Classic Denim Jacket",
      subcategory: "Outerwear", brand: "denimco", material: "100% denim",
      sizes: ["S", "M", "L", "XL"], price: 3200, oldPrice: 3800, stock: 38,
      images: [U("photo-1576871337622-98d48d1cf531"), U("photo-1551537482-f2075a1d41f2"), U("photo-1611312449408-fcece27cdbb7"), U("photo-1598033129183-c4f50c736f10")],
      colorImages: [], colors: ["#4a6fa5", "#2c2c2c"],
      badgeLabel: "Trending", badgeTone: "trending", featured: true, trending: true,
      tags: ["denim", "jacket", "casual"],
      description: "Timeless denim jacket that goes with everything.",
    },
    {
      slug: "plaid-coat", name: "Plaid Trench Coat",
      subcategory: "Outerwear", brand: "loom-field", material: "Wool blend",
      sizes: ["S", "M", "L", "XL"], price: 4800, oldPrice: 5500, stock: 12,
      images: [U("photo-1539109136881-3be0616acf4b"), U("photo-1548454782-15b189d129ab"), U("photo-1607345366928-199ea26cfe3e"), U("photo-1591047139829-d91aecb6caea")],
      colorImages: [U("photo-1539109136881-3be0616acf4b"), U("photo-1548454782-15b189d129ab")],
      colors: ["#a06b48", "#2c2c2c"],
      badgeLabel: "Sale", badgeTone: "sale", featured: false, trending: false,
      tags: ["coat", "winter", "wool"],
      description: "Timeless plaid trench coat. Wool blend for warmth and style.",
    },
    {
      slug: "cotton-top", name: "Floral Summer Top",
      subcategory: "Tops", brand: "stylehut", material: "Organic cotton",
      sizes: ["S", "M", "L"], price: 1200, oldPrice: 1400, stock: 48,
      images: [U("photo-1558769132-cb1aea458c5e"), U("photo-1515886657613-9f3515b0c78f"), U("photo-1572804013309-59a88b7e92f1"), U("photo-1554568218-0f1715e72254")],
      colorImages: [], colors: ["#ffffff", "#d4b3ff", "#f5b6c8"],
      badgeLabel: "New", badgeTone: "new", featured: true, trending: false,
      tags: ["top", "summer", "floral"],
      description: "Light and breezy floral top for warm weather.",
    },
    {
      slug: "womens-kurti", name: "Printed A-Line Kurti",
      subcategory: "Tops", brand: "stylehut", material: "Viscose rayon",
      sizes: ["S", "M", "L", "XL"], price: 1600, oldPrice: 2000, stock: 30,
      images: [U("photo-1583391733956-6c78276477e2"), U("photo-1610189844811-d0d1f3f3f3f3"), U("photo-1596993100471-c3905dafa78e")],
      colorImages: [], colors: ["#ec4899", "#1e3a5f", "#eab308"],
      badgeLabel: undefined, badgeTone: undefined, featured: false, trending: true,
      tags: ["kurti", "ethnic", "women"],
      description: "Comfortable printed A-line kurti for daily and festive wear.",
    },
    {
      slug: "floral-dress", name: "Floral Maxi Dress",
      subcategory: "Dresses", brand: "stylehut", material: "Chiffon",
      sizes: ["S", "M", "L"], price: 2300, oldPrice: 2900, stock: 18,
      images: [U("photo-1515372039744-b8f02a3ae446"), U("photo-1595777457583-95e059d581b8"), U("photo-1572804013427-4d7ca7268217")],
      colorImages: [], colors: ["#ec4899", "#f5b6c8", "#22c55e"],
      badgeLabel: "New", badgeTone: "new", featured: true, trending: false,
      tags: ["dress", "maxi", "floral"],
      description: "Flowy floral maxi dress — effortless elegance for any occasion.",
    },
    {
      slug: "sport-shoes", name: "Pro Sport Running Shoes",
      subcategory: "Shoes", brand: "aerostep", material: "Mesh & synthetic upper",
      sizes: ["39", "40", "41", "42", "43"], price: 3500, oldPrice: 4200, stock: 54,
      images: [U("photo-1542291026-7eec264c27ff"), U("photo-1595950653106-6c9ebd614d3a"), U("photo-1608231387042-66d1773070a5"), U("photo-1560769629-975ec94e6a86")],
      colorImages: [U("photo-1542291026-7eec264c27ff"), U("photo-1595950653106-6c9ebd614d3a"), U("photo-1608231387042-66d1773070a5")],
      colors: ["#000000", "#d96a7a", "#ffffff"],
      badgeLabel: undefined, badgeTone: undefined, featured: true, trending: true,
      tags: ["shoes", "running", "sport"],
      description: "High-performance running shoes with superior cushioning.",
    },
    {
      slug: "casual-sneakers", name: "Everyday Canvas Sneakers",
      subcategory: "Shoes", brand: "aerostep", material: "Canvas & rubber",
      sizes: ["39", "40", "41", "42", "43"], price: 1900, oldPrice: 2400, stock: 44,
      images: [U("photo-1525966222134-fcfa99b8ae77"), U("photo-1600185365483-26d7a4cc7519"), U("photo-1595341888016-a392ef81b7de")],
      colorImages: [], colors: ["#ffffff", "#000000", "#ef4444"],
      badgeLabel: "Sale", badgeTone: "sale", featured: false, trending: true,
      tags: ["sneakers", "casual", "canvas"],
      description: "Versatile canvas sneakers for everyday comfort.",
    },
  ];

  for (const p of products) {
    // Products live under the parent "fashion" category; the clothing type is kept
    // as the `subcategory` string (matches how category pages filter with ?sub=).
    const categoryId = parent.id;
    const brandId = brandMap[p.brand] ?? null;
    // Each colour needs its own image so selecting it swaps the main photo.
    // Fall back to the product's own images (one per colour) when not provided.
    const colorImages = p.colorImages.length
      ? p.colorImages
      : p.colors.map((_, i) => p.images[i % p.images.length]);
    const data = {
      name: p.name, description: p.description, price: p.price, oldPrice: p.oldPrice,
      stock: p.stock, images: p.images, colorImages, colors: p.colors,
      sizes: p.sizes, badgeLabel: p.badgeLabel ?? null, badgeTone: p.badgeTone ?? null,
      featured: p.featured, trending: p.trending, tags: p.tags, subcategory: p.subcategory,
      material: p.material, categoryId, brandId, status: "ACTIVE" as const,
    };
    await db.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
  }
  console.log(`✓ ${products.length} products seeded`);

  // ── Hero slides (fashion) ────────────────────────────────────────────────────
  const heroSlides = [
    { badge: "New Season", title: "Latest Fashion Trends",   subtitle: "Discover the newest arrivals — styles for every occasion.", cta: "Shop Now",     slug: "fashion", image: U("photo-1483985988355-763728e1935b", 1600, 800), gradient: "from-zinc-900 via-black to-black",     order: 0 },
    { badge: "Up to 40% Off", title: "Panjabi Collection",   subtitle: "Elegant panjabi for festive days — premium cotton, modern cuts.", cta: "Shop Panjabi", slug: "panjabi", image: U("photo-1490481651871-ab68de25d43d", 1600, 800), gradient: "from-neutral-900 via-black to-black", order: 1 },
    { badge: "For Her",    title: "Women's Fashion",          subtitle: "Tops, kurtis & dresses curated just for you.", cta: "Shop Women",  slug: "dresses", image: U("photo-1469334031218-e382a71b716b", 1600, 800), gradient: "from-stone-900 via-black to-black",   order: 2 },
  ];
  await db.heroSlide.deleteMany({});
  for (const s of heroSlides) await db.heroSlide.create({ data: { ...s, active: true } });
  console.log("✓ Hero slides seeded");

  // ── Promo banners (fashion) ──────────────────────────────────────────────────
  const promoBanners = [
    { eyebrow: "New Arrival", title: "Summer Styles\nfor Everyone",  subtitle: "Fresh looks, up to 30% off", image: U("photo-1523381210434-271e8be1f52b", 480, 480), href: "/category/fashion", bg: "#fdf2f0", order: 0 },
    { eyebrow: "Festive",     title: "Panjabi & Ethnic\nCollection", subtitle: "Celebrate in style",         image: U("photo-1610030469983-98e550d6193c", 480, 480), href: "/category/panjabi", bg: "#eef2ff", order: 1 },
  ];
  await db.promoBanner.deleteMany({});
  for (const b of promoBanners) await db.promoBanner.create({ data: { ...b, active: true } });
  console.log("✓ Promo banners seeded");

  // ── Sizes & Colors (for the admin product form) ──────────────────────────────
  const sizes = [
    { name: "XS", type: "clothing" }, { name: "S", type: "clothing" }, { name: "M", type: "clothing" },
    { name: "L", type: "clothing" }, { name: "XL", type: "clothing" }, { name: "XXL", type: "clothing" },
    { name: "38", type: "clothing" }, { name: "40", type: "clothing" }, { name: "42", type: "clothing" }, { name: "44", type: "clothing" },
    { name: "30", type: "clothing" }, { name: "32", type: "clothing" }, { name: "34", type: "clothing" }, { name: "36", type: "clothing" },
    { name: "39", type: "footwear" }, { name: "40", type: "footwear" }, { name: "41", type: "footwear" },
    { name: "42", type: "footwear" }, { name: "43", type: "footwear" }, { name: "Free Size", type: "general" },
  ];
  for (const s of sizes) {
    const ex = await db.size.findUnique({ where: { name: s.name } }); // name is globally unique
    if (!ex) await db.size.create({ data: { ...s, status: "ACTIVE" } });
  }
  const colors = [
    { name: "Black", hex: "#000000" }, { name: "White", hex: "#ffffff" }, { name: "Navy", hex: "#1e3a5f" },
    { name: "Blue", hex: "#3b82f6" }, { name: "Red", hex: "#ef4444" }, { name: "Green", hex: "#22c55e" },
    { name: "Pink", hex: "#ec4899" }, { name: "Yellow", hex: "#eab308" },
  ];
  for (const c of colors) {
    await db.color.upsert({ where: { hex: c.hex }, update: { name: c.name }, create: { ...c, status: "ACTIVE" } });
  }
  console.log("✓ Sizes & colors seeded");

  console.log("\n🎉 Fashion store seeding complete!");
}

main().catch(console.error).finally(() => db.$disconnect());
