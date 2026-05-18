/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const updated = await prisma.productImage.updateMany({
    where: { url: "/images/placeholder.png" },
    data: { url: "/images/placeholder.svg" },
  });
  console.log(`Updated ${updated.count} image(s).`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
