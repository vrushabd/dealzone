import { prisma } from './src/lib/prisma';

async function main() {
    const products = await prisma.product.findMany({ select: { id: true, title: true } });
    console.log(JSON.stringify(products, null, 2));

    // Also delete any hardcoded "dummy" products (like the initial seeds if present)
    const dummyKeywords = ['Macbook', 'Gaming Mouse', 'Wireless Headphones'];
    const dummyProducts = products.filter(p => dummyKeywords.some(k => p.title.includes(k)));
    
    if (dummyProducts.length > 0) {
        console.log("Deleting dummy products...", dummyProducts.map(p => p.title));
        await prisma.product.deleteMany({
            where: { id: { in: dummyProducts.map(p => p.id) } }
        });
    } else {
        const dummyPosts = await prisma.post.findMany({});
        console.log("Posts found:", dummyPosts.length);
        if (dummyPosts.length > 0) {
            await prisma.post.deleteMany({});
        }
    }
}

main().catch(console.error);
