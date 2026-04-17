const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({ select: { id: true, title: true } });
    const posts = await prisma.blogPost.findMany({ select: { id: true, title: true } });
    console.log("PRODUCTS:");
    products.forEach(p => console.log(`[${p.id}] ${p.title}`));
    console.log("\nBLOG POSTS:");
    posts.forEach(p => console.log(`[${p.id}] ${p.title}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
