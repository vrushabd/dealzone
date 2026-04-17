import { prisma } from './src/lib/prisma';

async function main() {
    const products = await prisma.product.findMany();
    
    // Group by title to find duplicates
    const titleGroups = new Map();
    const badTitles = ["02x512P4", "0anWVsX1", "0dwln59z", "Buy Products Online at Best Price", "Razer DeathAdder V3", "Atomic Habits", "Rich Dad Poor Dad"];
    
    const idsToDelete = new Set<string>();

    for (const p of products) {
        if (badTitles.some(b => p.title.includes(b))) {
            idsToDelete.add(p.id);
            continue;
        }

        if (!titleGroups.has(p.title)) {
            titleGroups.set(p.title, p);
        } else {
            // Keep the first one, delete the rest
            idsToDelete.add(p.id);
        }
    }

    if (idsToDelete.size > 0) {
        const idArray = Array.from(idsToDelete);
        console.log(`Deleting ${idArray.length} duplicate/dummy products...`);

        // Delete relations first
        await prisma.productPriceHistory.deleteMany({ where: { productId: { in: idArray } } });
        await prisma.priceAlert.deleteMany({ where: { productId: { in: idArray } } });
        await prisma.productReview.deleteMany({ where: { productId: { in: idArray } } });
        await prisma.trackedProduct.deleteMany({ where: { productId: { in: idArray } } });
        await prisma.affiliateClick.deleteMany({ where: { productId: { in: idArray } } });

        // Delete products
        await prisma.product.deleteMany({ where: { id: { in: idArray } } });
        console.log("Cleanup complete!");
    } else {
        console.log("No dummy products to delete.");
    }
}

main().catch(console.error);
