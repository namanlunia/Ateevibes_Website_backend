import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Ateevibes Database Seed...");

  // 1. Initial Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("AteevibesAdmin2026!", salt);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ateevibes.com" },
    update: {},
    create: {
      email: "admin@ateevibes.com",
      passwordHash,
      name: "Atelier Director",
      role: "OWNER",
      isActive: true,
    },
  });
  console.log(`✓ Admin user bootstrapped: ${admin.email} (Role: ${admin.role})`);

  // 2. Categories & Subcategories
  const categories = [
    {
      id: "cat-round-neck",
      slug: "round-neck",
      name: "Round Neck Tees",
      tagline: "Classic comfort reimagined",
      description: "Everyday elevated essentials in matty, 2-way stretch, imported tencil, and waffle textures.",
      image: "/products/500/pastel-green.jpg",
      subCategories: [
        { id: "sub-matty", slug: "matty", name: "Matty Round Neck", description: "Ultra soft matty fabric for all-day comfort." },
        { id: "sub-2-way", slug: "2-way", name: "2-Way Round Neck", description: "Engineered 2-way stretch with breathable recovery." },
        { id: "sub-tencil", slug: "tencil", name: "Tencil Round Neck", description: "Silky smooth imported tencil fabric." },
        { id: "sub-waffle", slug: "waffle", name: "Waffle Round Neck", description: "Textured honeycomb waffle weave with a modern drape." },
      ],
    },
    {
      id: "cat-polo-collar",
      slug: "polo-collar",
      name: "Polo & Collar Tees",
      tagline: "Effortless smart-casual vibes",
      description: "Refined collars with premium knits including matty, jacquard, waffle, and artistic printed accents.",
      image: "/products/1400/white.jpg",
      subCategories: [
        { id: "sub-matty-polo", slug: "matty-polo", name: "Matty Polo", description: "Crisp collar polo in our signature matty knit." },
        { id: "sub-jacquard-polo", slug: "jacquard-polo", name: "Jacquard Polo", description: "Geometric textured knit with a structured collar." },
        { id: "sub-waffle-polo", slug: "waffle-polo", name: "Waffle Polo", description: "Honeycomb knit collar tee (Coming Soon)." },
        { id: "sub-printed-collar", slug: "printed-collar", name: "Printed Collar Polo", description: "Gradient stripes and abstract motifs on premium collar knits." },
      ],
    },
    {
      id: "cat-jacquard",
      slug: "jacquard",
      name: "Jacquard Tees",
      tagline: "Dimensional knit craftsmanship",
      description: "Intricately woven textures and royal patterns in both half and full sleeve silhouettes.",
      image: "/products/1007/green.jpg",
      subCategories: [
        { id: "sub-jacquard-half", slug: "half-sleeve", name: "Jacquard Half Sleeve", description: "Breathable textured weave designed for Indian summers." },
        { id: "sub-jacquard-full", slug: "full-sleeve", name: "Jacquard Full Sleeve", description: "Structured full-sleeve jacquard for cooler days and evening vibes." },
        { id: "sub-royal-half", slug: "royal-print-half-sleeve", name: "Royal Print Half Sleeve", description: "China jacquard knit with regal abstract texture." },
        { id: "sub-royal-full", slug: "royal-print-full-sleeve", name: "Royal Print Full Sleeve", description: "Flagship China jacquard full sleeve tee with modern contour fit." },
      ],
    },
    {
      id: "cat-printed",
      slug: "printed",
      name: "Printed Tees",
      tagline: "Same print, different vibes",
      description: "Vibrant, bright and long-lasting tie-dye, brushstrokes, and contemporary printed designs.",
      image: "/products/102/r-gold.jpg",
      subCategories: [
        { id: "sub-tai-dai-half", slug: "tai-dai-half-sleeve", name: "Tai Dai Print Half Sleeve", description: "Soft moisture-friendly tie-dye in half sleeve." },
        { id: "sub-tai-dai-full", slug: "tai-dai-full-sleeve", name: "Tai Dai Print Full Sleeve", description: "Dynamic tie-dye prints on stretch full-sleeve knit." },
        { id: "sub-premium-printed", slug: "premium-printed-round-neck", name: "Premium Printed Round Neck", description: "Bold brushstrokes and modern graphic textures." },
      ],
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        tagline: cat.tagline,
        description: cat.description,
        image: cat.image,
      },
      create: {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        tagline: cat.tagline,
        description: cat.description,
        image: cat.image,
      },
    });

    for (const sub of cat.subCategories) {
      await prisma.subCategory.upsert({
        where: {
          categoryId_slug: {
            categoryId: cat.id,
            slug: sub.slug,
          },
        },
        update: {
          name: sub.name,
          description: sub.description,
        },
        create: {
          id: sub.id,
          categoryId: cat.id,
          slug: sub.slug,
          name: sub.name,
          description: sub.description,
        },
      });
    }
  }
  console.log(`✓ Seeded ${categories.length} categories with subcategories`);

  // 3. Products, Variants & Seeded Stock Levels
  const catMap: Record<string, string> = {
    "round-neck": "cat-round-neck",
    "polo-collar": "cat-polo-collar",
    "jacquard": "cat-jacquard",
    "printed": "cat-printed",
  };
  const subCatMap: Record<string, string> = {
    "matty": "sub-matty",
    "2-way": "sub-2-way",
    "tencil": "sub-tencil",
    "waffle": "sub-waffle",
    "matty-polo": "sub-matty-polo",
    "jacquard-polo": "sub-jacquard-polo",
    "waffle-polo": "sub-waffle-polo",
    "printed-collar": "sub-printed-collar",
    "half-sleeve": "sub-jacquard-half",
    "full-sleeve": "sub-jacquard-full",
    "royal-print-half-sleeve": "sub-royal-half",
    "royal-print-full-sleeve": "sub-royal-full",
    "tai-dai-half-sleeve": "sub-tai-dai-half",
    "tai-dai-full-sleeve": "sub-tai-dai-full",
    "premium-printed-round-neck": "sub-premium-printed",
  };

  const seedProductsRaw = fs.readFileSync(path.join(__dirname, "seed-products.json"), "utf8");
  const seedProducts = JSON.parse(seedProductsRaw);

  const sizes = ["S", "M", "L", "XL"];
  let totalStockRows = 0;

  for (let pIdx = 0; pIdx < seedProducts.length; pIdx++) {
    const p = seedProducts[pIdx];
    const categoryId = catMap[p.category] || "cat-round-neck";
    const subCategoryId = p.subCategory ? subCatMap[p.subCategory] || null : null;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        pno: p.pno,
        name: p.name,
        categoryId,
        subCategoryId,
        sleeve: p.sleeve || "half",
        neck: p.neck || "round",
        fabric: p.fabric || "Matty",
        printType: p.printType || "Solid / Weave",
        mrp: p.mrp || 999,
        compareAtPrice: p.compareAtPrice || null,
        priceConfirmed: p.priceConfirmed ?? true,
        status: (p.status as any) || "active",
        badges: p.badges || [],
        highlights: p.highlights || [],
        description: p.description || "",
        rating: p.rating || 4.8,
        reviewCount: p.reviewCount || 0,
        popularity: p.popularity || 80,
        catalogPoster: p.catalogPoster || null,
      },
      create: {
        id: p.id,
        slug: p.slug,
        pno: p.pno,
        name: p.name,
        categoryId,
        subCategoryId,
        sleeve: p.sleeve || "half",
        neck: p.neck || "round",
        fabric: p.fabric || "Matty",
        printType: p.printType || "Solid / Weave",
        mrp: p.mrp || 999,
        compareAtPrice: p.compareAtPrice || null,
        priceConfirmed: p.priceConfirmed ?? true,
        status: (p.status as any) || "active",
        badges: p.badges || [],
        highlights: p.highlights || [],
        description: p.description || "",
        rating: p.rating || 4.8,
        reviewCount: p.reviewCount || 0,
        popularity: p.popularity || 80,
        catalogPoster: p.catalogPoster || null,
      },
    });

    if (Array.isArray(p.variants)) {
      for (let vIdx = 0; vIdx < p.variants.length; vIdx++) {
        const v = p.variants[vIdx];
        const sku = `${p.pno}-${v.colourSlug || vIdx + 1}`.toUpperCase();

        const variant = await prisma.productVariant.upsert({
          where: { sku },
          update: {
            colourName: v.colourName,
            colourSlug: v.colourSlug || "default",
            hex: v.hex || "#111111",
            patternImage: v.patternImage || null,
            images: v.images || [],
          },
          create: {
            id: v.id || `var-${p.id}-${vIdx + 1}`,
            productId: product.id,
            sku,
            colourName: v.colourName,
            colourSlug: v.colourSlug || "default",
            hex: v.hex || "#111111",
            patternImage: v.patternImage || null,
            images: v.images || [],
          },
        });

        // AFTER variants are created: idempotent upsert for EVERY size in ["S", "M", "L", "XL"]
        for (const size of sizes) {
          // Realistic deterministic quantities per size:
          // S: 8–14, M: 10–16, L: 6–12, XL: 3–8
          let qty = 10;
          if (size === "S") qty = 8 + ((pIdx * 3 + vIdx * 2) % 7);       // 8 to 14
          else if (size === "M") qty = 10 + ((pIdx * 2 + vIdx * 3) % 7); // 10 to 16
          else if (size === "L") qty = 6 + ((pIdx * 4 + vIdx) % 7);      // 6 to 12
          else if (size === "XL") qty = 3 + ((pIdx + vIdx * 2) % 6);     // 3 to 8

          // Give ONE size of ONE variant per product quantity 0 for out-of-stock demo
          if (vIdx === 0 && size === "XL") {
            qty = 0;
          }

          await prisma.variantStock.upsert({
            where: {
              variantId_size: {
                variantId: variant.id,
                size,
              },
            },
            update: {
              quantity: qty,
              reserved: 0,
              lowStockThreshold: 3,
            },
            create: {
              variantId: variant.id,
              size,
              quantity: qty,
              reserved: 0,
              lowStockThreshold: 3,
            },
          });
          totalStockRows++;
        }
      }
    }
  }
  console.log(`✓ Seeded ${seedProducts.length} products with variants and ${totalStockRows} variantStock rows`);

  // 4. Store Settings
  const settings = [
    { key: "STORE_NAME", value: "Ateevibes", description: "Online menswear and T-shirt brand" },
    { key: "ATELIER_ORIGIN", value: "Surat, Gujarat, India", description: "Manufacturing atelier location" },
    { key: "FREE_SHIPPING_THRESHOLD", value: "1499", description: "Cart threshold in INR for free standard delivery" },
    { key: "STANDARD_SHIPPING_FEE", value: "79", description: "Standard courier delivery fee in INR" },
    { key: "COD_FEE", value: "49", description: "Cash on delivery handling fee in INR" },
    { key: "RETURN_POLICY_STATEMENT", value: "Atelier limited batch production. Sales final upon delivery unless transit damage is verified within 48 hours.", description: "Authoritative return policy note" },
  ];

  for (const s of settings) {
    await prisma.storeSettings.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log("✓ Seeded store settings");

  // 5. Supplier
  await prisma.supplier.upsert({
    where: { id: "sup-surat-01" },
    update: {},
    create: {
      id: "sup-surat-01",
      name: "Surat Textile Atelier",
      contactName: "Ramesh Patel",
      email: "production@surat-atelier.com",
      phone: "+919825000000",
      address: "Ring Road Textile Market, Surat, Gujarat",
      notes: "Master weaver and dyer for China jacquard and honeycomb waffle knits",
    },
  });
  console.log("✓ Seeded master supplier");

  console.log("✅ Ateevibes Database Seed Completed.");
}

main()
  .catch((e) => {
    console.error("Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
