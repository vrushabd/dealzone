/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  const shouldSeedSampleData =
    process.env.SEED_SAMPLE_DATA === "true" || process.env.NODE_ENV !== "production";

  // ── Admin ──────────────────────────────────────────────
  const existing = await prisma.admin.findUnique({
    where: { email: "admin@dealzone.com" },
  });
  if (!existing) {
    const password = await bcrypt.hash("admin123", 10);
    await prisma.admin.create({
      data: { email: "admin@dealzone.com", password },
    });
    console.log("✅ Admin: admin@dealzone.com / admin123");
  } else {
    console.log("ℹ️  Admin already exists");
  }

  // ── Categories ─────────────────────────────────────────
  const cats = [
    { name: "Electronics", slug: "electronics", icon: "📱" },
    { name: "Fashion", slug: "fashion", icon: "👕" },
    { name: "Home & Kitchen", slug: "home-kitchen", icon: "🍳" },
    { name: "Beauty", slug: "beauty", icon: "✨" },
    { name: "Gaming", slug: "gaming", icon: "🕹️" },
    { name: "Books", slug: "books", icon: "📖" },
  ];
  for (const cat of cats) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categories seeded");

  const getCat = (slug) => prisma.category.findUnique({ where: { slug } });

  // ── Electronics ────────────────────────────────────────
  const electronics = await getCat("electronics");
  if (electronics && shouldSeedSampleData) {
    const products = [
      {
        slug: "boat-airdopes-141-tws-earbuds",
        title: "boAt Airdopes 141 TWS Earbuds",
        description: "42H total battery, ENx technology, BEAST Mode, IPX4 rating and Bluetooth v5.3",
        image: "https://m.media-amazon.com/images/I/61pNHyxTaoL._SX679_.jpg",
        price: 999,
        originalPrice: 2990,
        discount: 67,
        amazonLink: "https://www.amazon.in/dp/B0BVXZ5Q2M",
        flipkartLink: "https://www.flipkart.com/search?q=boat+airdopes+141",
        featured: true,
        categoryId: electronics.id,
      },
      {
        slug: "samsung-43-crystal-4k-smart-tv",
        title: 'Samsung 43" Crystal 4K Ultra HD Smart TV',
        description: "Crystal 4K processor, Motion Xcelerator, OTS Lite, Amazon Alexa Built-in",
        image: "https://m.media-amazon.com/images/I/71f7JGNNsFL._SX679_.jpg",
        price: 29990,
        originalPrice: 46900,
        discount: 36,
        amazonLink: "https://www.amazon.in/dp/B0CRTB5G3M",
        flipkartLink: null,
        featured: true,
        categoryId: electronics.id,
      },
      {
        slug: "apple-airpods-pro-2nd-gen",
        title: "Apple AirPods Pro (2nd Generation)",
        description: "Active Noise Cancellation, Transparency mode, Adaptive Audio, Personalised Spatial Audio",
        image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._SX679_.jpg",
        price: 19900,
        originalPrice: 26900,
        discount: 26,
        amazonLink: "https://www.amazon.in/dp/B0BDHWDR12",
        flipkartLink: null,
        featured: false,
        categoryId: electronics.id,
      },
      {
        slug: "redmi-note-13-pro-plus-5g",
        title: "Redmi Note 13 Pro+ 5G",
        description: "200MP OIS Camera, 120W HyperCharge, 6.67\" 1.5K AMOLED Display, Dimensity 7200 Ultra",
        image: "https://m.media-amazon.com/images/I/71Q5VDOVTOL._SX679_.jpg",
        price: 24999,
        originalPrice: 31999,
        discount: 22,
        amazonLink: "https://www.amazon.in/dp/B0CR7PVTG8",
        flipkartLink: "https://www.flipkart.com/search?q=redmi+note+13+pro+plus",
        featured: true,
        categoryId: electronics.id,
      },
      {
        slug: "oneplus-nord-buds-3-pro",
        title: "OnePlus Nord Buds 3 Pro",
        description: "49dB ANC, 44H battery, IP55 rating, Fast Charge, 12.4mm dynamic drivers",
        image: "https://m.media-amazon.com/images/I/61NdxKiPlOL._SX679_.jpg",
        price: 2699,
        originalPrice: 4999,
        discount: 46,
        amazonLink: "https://www.amazon.in/dp/B0CQZJQ1WM",
        flipkartLink: null,
        featured: true,
        categoryId: electronics.id,
      },
    ];
    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }
  }
  if (shouldSeedSampleData) console.log("✅ Electronics seeded");

  // ── Gaming ─────────────────────────────────────────────
  const gaming = await getCat("gaming");
  if (gaming && shouldSeedSampleData) {
    const products = [
      {
        slug: "sony-ps5-dualsense-controller",
        title: "Sony PS5 DualSense Wireless Controller",
        description: "Haptic feedback, adaptive triggers, built-in microphone and speaker, USB-C charging",
        image: "https://m.media-amazon.com/images/I/61wNi1EI41L._SX679_.jpg",
        price: 5290,
        originalPrice: 6990,
        discount: 24,
        amazonLink: "https://www.amazon.in/dp/B08FC6C75Y",
        flipkartLink: "https://www.flipkart.com/search?q=ps5+dualsense+controller",
        featured: true,
        categoryId: gaming.id,
      },
      {
        slug: "razer-deathadder-v3-gaming-mouse",
        title: "Razer DeathAdder V3 Gaming Mouse",
        description: "Focus Pro 30K optical sensor, 6 programmable buttons, 90-hour battery life",
        image: "https://m.media-amazon.com/images/I/51Cz4RKhDML._SX679_.jpg",
        price: 7999,
        originalPrice: 12999,
        discount: 38,
        amazonLink: "https://www.amazon.in/dp/B0BS6HHNCX",
        flipkartLink: null,
        featured: false,
        categoryId: gaming.id,
      },
    ];
    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }
  }
  if (shouldSeedSampleData) console.log("✅ Gaming seeded");

  // ── Fashion ────────────────────────────────────────────
  const fashion = await getCat("fashion");
  if (fashion && shouldSeedSampleData) {
    const products = [
      {
        slug: "puma-mens-running-shoes-enzo-2",
        title: "Puma Men's Enzo 2 Running Shoes",
        description: "SoftFoam+ cushioning, lightweight mesh upper, rubber outsole for traction",
        image: "https://m.media-amazon.com/images/I/71nTnLWVVnL._UX695_.jpg",
        price: 2199,
        originalPrice: 4499,
        discount: 51,
        amazonLink: "https://www.amazon.in/dp/B09PQJBHVK",
        flipkartLink: "https://www.flipkart.com/search?q=puma+enzo+2+running+shoes",
        featured: false,
        categoryId: fashion.id,
      },
      {
        slug: "levi-511-slim-fit-jeans",
        title: "Levi's 511 Slim Fit Men's Jeans",
        description: "Slim fit through seat, hip and thigh, with just the right amount of stretch",
        image: "https://m.media-amazon.com/images/I/81uHj7gkSLL._UX679_.jpg",
        price: 1959,
        originalPrice: 3999,
        discount: 51,
        amazonLink: "https://www.amazon.in/dp/B08BZSLT5V",
        flipkartLink: "https://www.flipkart.com/search?q=levis+511+slim+fit+jeans",
        featured: false,
        categoryId: fashion.id,
      },
    ];
    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }
  }
  if (shouldSeedSampleData) console.log("✅ Fashion seeded");

  // ── Home & Kitchen ─────────────────────────────────────
  const home = await getCat("home-kitchen");
  if (home && shouldSeedSampleData) {
    const products = [
      {
        slug: "instant-pot-duo-7-in-1",
        title: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
        description: "Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker & warmer",
        image: "https://m.media-amazon.com/images/I/71K2dUbZj3L._SX679_.jpg",
        price: 6499,
        originalPrice: 10999,
        discount: 41,
        amazonLink: "https://www.amazon.in/dp/B00FLYWNYQ",
        flipkartLink: null,
        featured: true,
        categoryId: home.id,
      },
      {
        slug: "philips-air-fryer-hd9200",
        title: "Philips NA220/00 Air Fryer HD9200",
        description: "Rapid Air Technology, 1400W, 4.1L capacity, uses up to 90% less fat",
        image: "https://m.media-amazon.com/images/I/61yMLB-WJLL._SX679_.jpg",
        price: 7999,
        originalPrice: 12995,
        discount: 38,
        amazonLink: "https://www.amazon.in/dp/B095S6HJBR",
        flipkartLink: "https://www.flipkart.com/search?q=philips+air+fryer+hd9200",
        featured: false,
        categoryId: home.id,
      },
    ];
    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }
  }
  if (shouldSeedSampleData) console.log("✅ Home & Kitchen seeded");

  // ── Beauty ─────────────────────────────────────────────
  const beauty = await getCat("beauty");
  if (beauty && shouldSeedSampleData) {
    const products = [
      {
        slug: "lakme-9to5-primer-matte-lip-color",
        title: "Lakme 9to5 Primer + Matte Lip Color",
        description: "Primer enriched formula, 8hr wear, intense color, 36 shades, transferproof",
        image: "https://m.media-amazon.com/images/I/41ZluvXijWL._SX679_.jpg",
        price: 219,
        originalPrice: 400,
        discount: 45,
        amazonLink: "https://www.amazon.in/dp/B07CVFKHV5",
        flipkartLink: "https://www.flipkart.com/search?q=lakme+9to5+primer+matte",
        featured: false,
        categoryId: beauty.id,
      },
    ];
    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }
  }
  if (shouldSeedSampleData) console.log("✅ Beauty seeded");

  // ── Books ──────────────────────────────────────────────
  const books = await getCat("books");
  if (books && shouldSeedSampleData) {
    const products = [
      {
        slug: "atomic-habits-james-clear",
        title: "Atomic Habits by James Clear",
        description: "An easy & proven way to build good habits & break bad ones. Bestseller with 15M+ copies sold.",
        image: "https://m.media-amazon.com/images/I/91bYsX41DVL._SY466_.jpg",
        price: 435,
        originalPrice: 999,
        discount: 56,
        amazonLink: "https://www.amazon.in/dp/1847941834",
        flipkartLink: "https://www.flipkart.com/search?q=atomic+habits+james+clear",
        featured: false,
        categoryId: books.id,
      },
      {
        slug: "rich-dad-poor-dad-kiyosaki",
        title: "Rich Dad Poor Dad by Robert Kiyosaki",
        description: "What the rich teach their kids about money that the poor and middle class do not",
        image: "https://m.media-amazon.com/images/I/81BE7eeKzAL._SY466_.jpg",
        price: 299,
        originalPrice: 595,
        discount: 50,
        amazonLink: "https://www.amazon.in/dp/1612680194",
        flipkartLink: "https://www.flipkart.com/search?q=rich+dad+poor+dad",
        featured: false,
        categoryId: books.id,
      },
    ];
    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
    }
  }
  if (shouldSeedSampleData) console.log("✅ Books seeded");

  console.log("✅ Blog posts skipped (manage from Admin → Blog Posts)");

  // ── Coupons ────────────────────────────────────────────
  const coupons = [
    {
      title: "Amazon 10% off on Electronics",
      code: "AMZELECTRO10",
      description: "Get 10% instant discount on electronics using HDFC credit cards.",
      discount: "10%",
      store: "Amazon",
      link: "https://www.amazon.in",
      isVerified: true,
      isSecret: false,
    },
    {
      title: "Flipkart Big Bachat Sale",
      code: "FLIPBIG20",
      description: "Flat ₹200 off on orders above ₹999 on Flipkart.",
      discount: "₹200",
      store: "Flipkart",
      link: "https://www.flipkart.com",
      isVerified: true,
      isSecret: false,
    },
    {
      title: "Myntra First Order Discount",
      code: "MYNTRA30",
      description: "30% off on your first order at Myntra — fashion & accessories.",
      discount: "30%",
      store: "Myntra",
      link: "https://www.myntra.com",
      isVerified: true,
      isSecret: true,
    },
  ];
  for (const coupon of coupons) {
    const existing = await prisma.coupon.findFirst({ where: { code: coupon.code } });
    if (!existing) {
      await prisma.coupon.create({ data: coupon });
    }
  }
  console.log("✅ Coupons seeded");

  console.log("\n🎉 Done! Admin: admin@dealzone.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
