/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding Coupons...");

  const coupons = [
    {
      id: "c1",
      title: "Extra 10% Off Amazon Fashion",
      code: "FASHION10",
      description: "Valid on selected apparel and accessories.",
      discount: "10%",
      store: "Amazon",
      link: "https://amazon.in",
    },
    {
      id: "c2",
      title: "Flipkart Electronics Sale - Up to 15% off",
      code: "ELEC15",
      description: "Get additional discount on refurbished laptops.",
      discount: "15%",
      store: "Flipkart",
      link: "https://flipkart.com",
    },
    {
      id: "c3",
      title: "Myntra First Order Discount",
      code: "MYNTRA200",
      description: "Flat ₹200 off on your first purchase above ₹999.",
      discount: "₹200",
      store: "Myntra",
      link: "https://myntra.com",
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { id: c.id },
      update: {
        title: c.title,
        code: c.code,
        description: c.description,
        discount: c.discount,
        store: c.store,
        link: c.link,
      },
      create: c,
    });
  }

  console.log("✅ Seeded " + coupons.length + " coupons successfully.");
  await prisma.$disconnect();
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
