/* eslint-disable no-console */
import { PrismaClient, ProductSize } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Seeding DESTON catalog…");

  const cropHoodie = await prisma.product.upsert({
    where: { slug: "hoodie-crop-fit" },
    update: {},
    create: {
      slug: "hoodie-crop-fit",
      name: 'Худи "Crop fit"',
      description:
        "Худи свободного кроя с укороченной длиной. Плотный материал, чёткий силуэт, фирменная посадка DESTON.",
      composition: "57% хлопка, 43% полиэстера",
      cut: "Широкий крой",
      basePrice: 3490,
      sortOrder: 1,
      images: {
        create: [{ url: "/images/placeholder.svg", alt: "Худи Crop fit", position: 0 }],
      },
      variants: {
        create: [
          { size: ProductSize.S, color: "Чёрный", sku: "HD-CROP-BLK-S", stock: 12 },
          { size: ProductSize.M, color: "Чёрный", sku: "HD-CROP-BLK-M", stock: 12 },
          { size: ProductSize.L, color: "Чёрный", sku: "HD-CROP-BLK-L", stock: 12 },
          { size: ProductSize.XL, color: "Чёрный", sku: "HD-CROP-BLK-XL", stock: 8 },
          { size: ProductSize.S, color: "Серый", sku: "HD-CROP-GRY-S", stock: 10 },
          { size: ProductSize.M, color: "Серый", sku: "HD-CROP-GRY-M", stock: 10 },
          { size: ProductSize.L, color: "Серый", sku: "HD-CROP-GRY-L", stock: 10 },
          { size: ProductSize.XL, color: "Серый", sku: "HD-CROP-GRY-XL", stock: 6 },
        ],
      },
    },
  });

  console.log(`Seeded: ${cropHoodie.slug}`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
