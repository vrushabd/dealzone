/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function reset() {
  console.log("Resetting admin password...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { email: "admin@dealzone.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@dealzone.com",
      password: hashedPassword,
    },
  });

  console.log("Admin password reset to 'admin123'.");
  await prisma.$disconnect();
}

reset().catch(console.error);
