import { prisma } from "@/lib/prisma";
import type { ProductDetailDTO, ProductSummaryDTO } from "../types/product";
import type { ProductSize } from "@prisma/client";

export async function getProductSummaries(): Promise<ProductSummaryDTO[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
    },
  });

  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    basePrice: p.basePrice,
    primaryImage: p.images[0]?.url ?? null,
  }));
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: { orderBy: [{ size: "asc" }, { color: "asc" }] },
    },
  });
  if (!product) return null;

  const availableSizes: ProductSize[] = Array.from(new Set(product.variants.map((v) => v.size)));
  const availableColors = Array.from(new Set(product.variants.map((v) => v.color)));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    composition: product.composition,
    cut: product.cut,
    basePrice: product.basePrice,
    images: product.images.map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt,
      position: i.position,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color,
      sku: v.sku,
      stock: v.stock,
      priceOverride: v.priceOverride,
    })),
    availableSizes,
    availableColors,
  };
}
