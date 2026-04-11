const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.product.updateMany({
    where: {
      image: {
        contains: 'photo-1505740420928-5e560c06d30e'
      }
    },
    data: {
      image: null
    }
  });
  console.log(`Fixed ${result.count} products with demo headphone image.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
