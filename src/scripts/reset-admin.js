/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function reset() {
  console.log("Resetting admin password...");

  const hashedPassword = await bcrypt.hash("pass1234", 10);

  await prisma.admin.upsert({
    where: { email: "admin@gmail.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@gmail.com",
      password: hashedPassword,
    },
  });
  await prisma.admin.deleteMany({
    where: {
      email: { not: "admin@gmail.com" },
    },
  });

  console.log("Admin password reset to 'pass1234' for admin@gmail.com.");
  await prisma.$disconnect();
}

reset().catch(console.error);
