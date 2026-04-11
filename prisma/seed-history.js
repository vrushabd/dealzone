/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("📈 Seeding price history...");

    // Get all products with a price
    const products = await prisma.product.findMany({
        where: { price: { not: null } },
        select: { id: true, price: true, slug: true },
    });

    if (products.length === 0) {
        console.log("⚠️  No products found. Run the main seed first.");
        return;
    }

    let totalInserted = 0;

    for (const product of products) {
        const basePrice = product.price;

        // Check if history already exists for this product
        const existing = await prisma.productPriceHistory.count({
            where: { productId: product.id },
        });
        if (existing >= 10) {
            console.log(`  ⏭  ${product.slug}: history already exists (${existing} points)`);
            continue;
        }

        // Generate 30 days of price history ending today
        const now = new Date();
        const points = [];

        for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
            const date = new Date(now);
            date.setDate(now.getDate() - daysAgo);

            // Realistic price variation: ±15% with occasional spikes
            let variation = 1;
            if (daysAgo > 20) variation = 1 + (Math.random() * 0.15); // higher in past
            else if (daysAgo > 10) variation = 1 + (Math.random() * 0.08);
            else variation = 1 - (Math.random() * 0.05); // trending down recently

            // Occasional flash sale dip
            if (daysAgo === 15 || daysAgo === 7) variation = 1 - (Math.random() * 0.12 + 0.05);

            const price = Math.round(basePrice * variation);
            points.push({ productId: product.id, price, timestamp: date });
        }

        await prisma.productPriceHistory.createMany({ data: points, skipDuplicates: true });
        totalInserted += points.length;
        console.log(`  ✅ ${product.slug}: ${points.length} price points seeded`);
    }

    console.log(`\n📊 Done! ${totalInserted} price history points created across ${products.length} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
