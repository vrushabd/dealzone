/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function update() {
  console.log("💰 Updating Cashback Data...");

  await prisma.product.updateMany({
    where: { slug: "samsung-43-crystal-4k-smart-tv" },
    data: { cashbackAmazon: 5.5, cashbackPaytm: 10 },
  });

  await prisma.product.updateMany({
    where: { slug: "boat-airdopes-141-tws-earbuds" },
    data: { cashbackFlipkart: 8, cashbackPhonePe: 12 },
  });

  console.log("✅ Cashback values updated successfully.");
  await prisma.$disconnect();
}

update().catch((error) => {
  console.error("❌ Cashback update failed:", error);
  process.exit(1);
});
