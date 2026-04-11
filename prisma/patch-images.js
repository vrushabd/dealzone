/**
 * Patches all existing product images to use working CDN URLs.
 * Run: node prisma/patch-images.js
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Reliable, publicly accessible product images that will always load
const imageMap = {
  "boat-airdopes-141-tws-earbuds":
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80",
  "samsung-43-crystal-4k-smart-tv":
    "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500&q=80",
  "apple-airpods-pro-2nd-gen":
    "https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=500&q=80",
  "redmi-note-13-pro-plus-5g":
    "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80",
  "oneplus-nord-buds-3-pro":
    "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=500&q=80",
  "sony-ps5-dualsense-controller":
    "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&q=80",
  "razer-deathadder-v3-gaming-mouse":
    "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&q=80",
  "puma-mens-running-shoes-enzo-2":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
  "levi-511-slim-fit-jeans":
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80",
  "instant-pot-duo-7-in-1":
    "https://images.unsplash.com/photo-1585515320310-259814833e62?w=500&q=80",
  "philips-air-fryer-hd9200":
    "https://images.unsplash.com/photo-1648017893040-f59c99a1e7a0?w=500&q=80",
  "lakme-9to5-primer-matte-lip-color":
    "https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=500&q=80",
  "atomic-habits-james-clear":
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80",
  "rich-dad-poor-dad-kiyosaki":
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
};

async function main() {
  console.log("🖼️  Patching product images...");
  let updated = 0;
  for (const [slug, image] of Object.entries(imageMap)) {
    const res = await prisma.product.updateMany({ where: { slug }, data: { image } });
    if (res.count > 0) {
      console.log(`  ✅ ${slug}`);
      updated++;
    } else {
      console.log(`  ⚠️  ${slug} not found`);
    }
  }
  console.log(`\n🎉 Patched ${updated} product images.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
