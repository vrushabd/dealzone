/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding historical data...");

  const products = await prisma.product.findMany();

  for (const product of products) {
    if (product.title.toLowerCase().includes("are you a human")) continue;

    console.log(`Seeding history for: ${product.title}`);

    const basePrice = product.price || 50000;
    const history = [];

    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const price = basePrice + (Math.random() - 0.7) * 2000;
      history.push({
        productId: product.id,
        price: Math.round(price),
        timestamp: date,
      });
    }

    await prisma.productPriceHistory.createMany({ data: history });
  }

  console.log("Seeding complete.");
  await prisma.$disconnect();
}

seed().catch(console.error);
