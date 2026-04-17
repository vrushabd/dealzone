import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SEEDED_PRODUCT_SLUGS = [
  // prisma/seed.ts
  "boat-airdopes-141-tws-earbuds",
  "samsung-43-crystal-4k-smart-tv",
  "apple-airpods-pro-2nd-gen",
  "redmi-note-13-pro-plus-5g",
  // prisma/seed.js extras
  "oneplus-nord-buds-3-pro",
  "sony-ps5-dualsense-controller",
  "razer-deathadder-v3-gaming-mouse",
  "puma-mens-running-shoes-enzo-2",
  "levi-511-slim-fit-jeans",
  "instant-pot-duo-7-in-1",
  "philips-air-fryer-hd9200",
  "lakme-9to5-primer-matte-lip-color",
  "atomic-habits-james-clear",
  "rich-dad-poor-dad-kiyosaki",
];

const SEEDED_POST_SLUGS = ["best-deals-this-week"];

const SEEDED_COUPON_CODES = [
  // prisma/seed.js
  "AMZELECTRO10",
  "FLIPBIG20",
  "MYNTRA30",
  // prisma/seed-coupons.js
  "FASHION10",
  "ELEC15",
  "MYNTRA200",
];

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const seededProducts = await prisma.product.findMany({
      where: { slug: { in: SEEDED_PRODUCT_SLUGS } },
      select: { id: true, slug: true },
    });

    const productIds = seededProducts.map((p) => p.id);

    // Remove relations first to avoid FK constraint issues.
    const [
      priceHistory,
      alerts,
      reviews,
      tracked,
      clicks,
    ] = await Promise.all([
      prisma.productPriceHistory.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.priceAlert.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.productReview.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.trackedProduct.deleteMany({ where: { productId: { in: productIds } } }),
      prisma.affiliateClick.deleteMany({ where: { productId: { in: productIds } } }),
    ]);

    const products = await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });

    const posts = await prisma.post.deleteMany({
      where: { slug: { in: SEEDED_POST_SLUGS } },
    });

    const coupons = await prisma.coupon.deleteMany({
      where: { code: { in: SEEDED_COUPON_CODES } },
    });

    return NextResponse.json({
      ok: true,
      deleted: {
        products: products.count,
        posts: posts.count,
        coupons: coupons.count,
        relations: {
          affiliateClicks: clicks.count,
          trackedProducts: tracked.count,
          reviews: reviews.count,
          priceAlerts: alerts.count,
          priceHistory: priceHistory.count,
        },
      },
      matchedProductSlugs: seededProducts.map((p) => p.slug),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

