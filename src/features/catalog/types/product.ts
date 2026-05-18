import type { ProductSize } from "@prisma/client";

export interface ProductImageDTO {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductVariantDTO {
  id: string;
  size: ProductSize;
  color: string;
  sku: string;
  stock: number;
  priceOverride: number | null;
}

export interface ProductSummaryDTO {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  primaryImage: string | null;
}

export interface ProductDetailDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  composition: string;
  cut: string | null;
  basePrice: number;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
  availableSizes: ProductSize[];
  availableColors: string[];
}
