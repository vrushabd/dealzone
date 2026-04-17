import { prisma } from './src/lib/prisma';

async function main() {
    const cats = [
        { slug: "electronics", icon: "📱" },
        { slug: "fashion", icon: "👕" },
        { slug: "home-kitchen", icon: "🍳" },
        { slug: "beauty", icon: "✨" },
        { slug: "gaming", icon: "🕹️" },
        { slug: "books", icon: "📖" },
    ];

    console.log("Updating category icons...");
    for (const cat of cats) {
        await prisma.category.updateMany({
            where: { slug: cat.slug },
            data: { icon: cat.icon }
        });
    }
    console.log("Category icons updated successfully!");
}

main().catch(console.error);
