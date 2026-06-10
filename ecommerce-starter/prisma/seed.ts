import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "electronics" },
      update: {},
      create: { name: "Electronics", slug: "electronics", description: "Gadgets and devices" },
    }),
    prisma.category.upsert({
      where: { slug: "clothing" },
      update: {},
      create: { name: "Clothing", slug: "clothing", description: "Apparel and accessories" },
    }),
    prisma.category.upsert({
      where: { slug: "home-garden" },
      update: {},
      create: { name: "Home & Garden", slug: "home-garden", description: "For your home" },
    }),
  ]);

  // Products
  const products = [
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      description: "Premium noise-cancelling wireless headphones with 30-hour battery life.",
      price: 9999,
      compareAt: 12999,
      categoryId: categories[0].id,
      images: JSON.stringify(["https://placehold.co/600x600/1a1a2e/ffffff?text=Headphones"]),
      featured: true,
    },
    {
      name: "Smart Watch Pro",
      slug: "smart-watch-pro",
      description: "Track your fitness, receive notifications, and more with this premium smartwatch.",
      price: 19999,
      categoryId: categories[0].id,
      images: JSON.stringify(["https://placehold.co/600x600/16213e/ffffff?text=Watch"]),
      featured: true,
    },
    {
      name: "Cotton T-Shirt",
      slug: "cotton-t-shirt",
      description: "Soft, breathable 100% organic cotton t-shirt. Available in multiple colors.",
      price: 2499,
      compareAt: 3499,
      categoryId: categories[1].id,
      images: JSON.stringify(["https://placehold.co/600x600/0f3460/ffffff?text=T-Shirt"]),
      featured: false,
    },
    {
      name: "Denim Jacket",
      slug: "denim-jacket",
      description: "Classic denim jacket with a modern fit. Perfect for layering.",
      price: 7999,
      categoryId: categories[1].id,
      images: JSON.stringify(["https://placehold.co/600x600/533483/ffffff?text=Jacket"]),
      featured: true,
    },
    {
      name: "Ceramic Plant Pot",
      slug: "ceramic-plant-pot",
      description: "Hand-crafted ceramic pot perfect for indoor plants.",
      price: 1999,
      categoryId: categories[2].id,
      images: JSON.stringify(["https://placehold.co/600x600/2b2d42/ffffff?text=Pot"]),
      featured: false,
    },
    {
      name: "LED Desk Lamp",
      slug: "led-desk-lamp",
      description: "Adjustable LED desk lamp with 5 brightness levels and USB charging port.",
      price: 4999,
      compareAt: 5999,
      categoryId: categories[2].id,
      images: JSON.stringify(["https://placehold.co/600x600/8d99ae/ffffff?text=Lamp"]),
      featured: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }

  // Variants for Cotton T-Shirt
  const tshirt = await prisma.product.findUnique({ where: { slug: "cotton-t-shirt" } });
  if (tshirt) {
    const variants = [
      { name: "White / S", sku: "TSHIRT-WHITE-S", stock: 25, productId: tshirt.id },
      { name: "White / M", sku: "TSHIRT-WHITE-M", stock: 30, productId: tshirt.id },
      { name: "White / L", sku: "TSHIRT-WHITE-L", stock: 20, productId: tshirt.id },
      { name: "Black / S", sku: "TSHIRT-BLACK-S", stock: 15, productId: tshirt.id },
      { name: "Black / M", sku: "TSHIRT-BLACK-M", stock: 25, productId: tshirt.id },
      { name: "Black / L", sku: "TSHIRT-BLACK-L", stock: 10, productId: tshirt.id },
    ];
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: v,
      });
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
