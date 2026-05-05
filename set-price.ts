import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const updated = await prisma.product.updateMany({
    where: {
      title: { contains: "earbud", mode: "insensitive" }
    },
    data: { price: 1 }
  });
  console.log("Updated", updated.count, "products to ₹1");
  const products = await prisma.product.findMany({ select: { id: true, title: true, price: true }});
  console.log(products.filter(p => p.price === 1));
}
run();
