import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log("🌱 Seeding database...");

    // Admin
    const password = await bcrypt.hash("admin123", 10);
    await prisma.admin.upsert({
        where: { email: "admin@dealzone.com" },
        update: {},
        create: { email: "admin@dealzone.com", password },
    });
    console.log("✅ Admin created: admin@dealzone.com / admin123");

    // Categories
    const cats = [
        { name: "Electronics", slug: "electronics", icon: "💻" },
        { name: "Fashion", slug: "fashion", icon: "👗" },
        { name: "Home & Kitchen", slug: "home-kitchen", icon: "🏠" },
        { name: "Beauty", slug: "beauty", icon: "💄" },
        { name: "Gaming", slug: "gaming", icon: "🎮" },
        { name: "Books", slug: "books", icon: "📚" },
    ];

    for (const cat of cats) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
        });
    }
    console.log("✅ Categories seeded");

    // Sample products
    const electronics = await prisma.category.findUnique({ where: { slug: "electronics" } });
    if (electronics) {
        const sampleProducts = [
            {
                title: "boAt Airdopes 141 TWS Earbuds",
                slug: "boat-airdopes-141-tws-earbuds",
                description: "boAt Airdopes 141 earbuds with 42H total battery, ENx technology, BEAST Mode, IPX4 rating and Bluetooth v5.3",
                image: "https://m.media-amazon.com/images/I/61pNHyxTaoL._SX679_.jpg",
                price: 999,
                originalPrice: 2990,
                discount: 67,
                amazonLink: "https://www.amazon.in/dp/B0BVXZ5Q2M",
                flipkartLink: "https://www.flipkart.com/search?q=boat+airdopes+141",
                featured: true,
                categoryId: electronics.id,
            },
            {
                title: "Samsung 108 cm (43 inch) Crystal 4K Ultra HD Smart TV",
                slug: "samsung-43-crystal-4k-smart-tv",
                description: "Crystal 4K processor, Crystal Display, Motion Xcelerator, OTS Lite, Amazon Alexa Built-in, 3 HDMI Ports",
                image: "https://m.media-amazon.com/images/I/71f7JGNNsFL._SX679_.jpg",
                price: 29990,
                originalPrice: 46900,
                discount: 36,
                amazonLink: "https://www.amazon.in/dp/B0CRTB5G3M",
                featured: true,
                categoryId: electronics.id,
            },
            {
                title: "Apple AirPods Pro (2nd Generation)",
                slug: "apple-airpods-pro-2nd-gen",
                description: "Active Noise Cancellation, Transparency mode, Adaptive Audio, Personalised Spatial Audio",
                image: "https://m.media-amazon.com/images/I/61SUj2aKoEL._SX679_.jpg",
                price: 19900,
                originalPrice: 26900,
                discount: 26,
                amazonLink: "https://www.amazon.in/dp/B0BDHWDR12",
                featured: false,
                categoryId: electronics.id,
            },
            {
                title: "Redmi Note 13 Pro+ 5G",
                slug: "redmi-note-13-pro-plus-5g",
                description: "200MP OIS Camera, 120W HyperCharge, 6.67\" 1.5K AMOLED Display, Dimensity 7200 Ultra",
                image: "https://m.media-amazon.com/images/I/71Q5VDOVTOL._SX679_.jpg",
                price: 24999,
                originalPrice: 31999,
                discount: 22,
                amazonLink: "https://www.amazon.in/dp/B0CR7PVTG8",
                featured: true,
                categoryId: electronics.id,
            },
        ];

        for (const p of sampleProducts) {
            await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
        }
    }
    console.log("✅ Sample products seeded");

    // Sample blog post
    await prisma.post.upsert({
        where: { slug: "best-deals-this-week" },
        update: {},
        create: {
            title: "Best Deals This Week – Don't Miss Out!",
            slug: "best-deals-this-week",
            excerpt: "We've curated the best discounts from Amazon and Flipkart this week. Check out these incredible offers!",
            content: `Welcome to DealZone's weekly deals roundup!\n\nThis week we've found some incredible deals that you simply cannot miss. From electronics to fashion, we've got something for everyone.\n\nTop Picks:\n\n1. boAt Airdopes 141 – Down to ₹999 from ₹2,990 (67% off!)\n2. Samsung 43" 4K Smart TV – ₹29,990 from ₹46,900 (36% off!)\n3. Apple AirPods Pro 2nd Gen – ₹19,900 from ₹26,900 (26% off!)\n\nSimply click on the "Buy on Amazon" or "Buy on Flipkart" button on any product page and you'll be redirected with our affiliate link — no extra cost to you!\n\nHappy shopping! 🛍️`,
            published: true,
        },
    });
    console.log("✅ Sample blog post seeded");

    console.log("\n🎉 Database seeded successfully!");
    console.log("👉 Admin login: admin@dealzone.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
