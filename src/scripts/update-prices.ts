import { prisma } from '../lib/prisma';
import { scrapeProduct } from '../lib/features/scraper/scraper';

async function updatePrices() {
    console.log('--- Starting Price Update Job ---');

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { amazonLink: { not: null } },
                { flipkartLink: { not: null } },
                { meeshoLink: { not: null } },
            ],
        },
        select: {
            id: true,
            title: true,
            amazonLink: true,
            flipkartLink: true,
            meeshoLink: true,
        },
    });

    console.log(`Updating ${products.length} products...`);

    for (const product of products) {
        const url = product.amazonLink || product.flipkartLink || product.meeshoLink;
        if (!url) continue;

        console.log(`Checking ${product.title}...`);
        const scraped = await scrapeProduct(url);

        if (scraped) {
            // Update product info
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    price: scraped.price,
                    availability: scraped.availability,
                },
            });

            // Add to history
            await prisma.productPriceHistory.create({
                data: {
                    productId: product.id,
                    price: scraped.price,
                },
            });

            // Check alerts
            const alerts = await prisma.trackedProduct.findMany({
                where: {
                    productId: product.id,
                    isActive: true,
                    targetPrice: { gte: scraped.price },
                },
            });

            for (const alert of alerts) {
                console.log(`!!! PRICE DROP ALERT for ${alert.email}: ${product.title} is now ₹${scraped.price}`);
                // Here you would integrate with an email service like Resend or Nodemailer
            }
        }

        // Tiny delay to avoid aggressive scraping
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('--- Price Update Job Finished ---');
}

updatePrices()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
