import { prisma } from './src/lib/prisma';

async function main() {
    // Delete dummy blog posts generated previously 
    console.log("Deleting all dummy blog posts...");
    const deletedPosts = await prisma.post.deleteMany({});
    console.log(`Deleted ${deletedPosts.count} posts.`);

    // Delete dummy categories or products if needed? The user mentioned "dummy posts". 
    // They added products through the Add via URL mostly. We will only delete blog posts.
}

main().catch(console.error).finally(() => prisma.$disconnect());
