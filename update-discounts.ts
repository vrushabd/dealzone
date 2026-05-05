import { prisma } from "./src/lib/prisma";

async function main() {
    const products = await prisma.product.findMany({ 
        where: { originalPrice: { not: null }, price: { not: null } } 
    });
    let count = 0;
    
    for (const p of products) {
        if (p.originalPrice && p.price && p.originalPrice > p.price) {
            const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
            await prisma.product.update({ 
                where: { id: p.id }, 
                data: { discount } 
            });
            count++;
        }
    }
    
    console.log("Updated", count, "products");
}

main().finally(() => prisma.$disconnect());
