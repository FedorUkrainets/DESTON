import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contacts`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.2 },
  ];

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });
    return [
      ...staticEntries,
      ...products.map((p) => ({
        url: `${base}/catalog/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
