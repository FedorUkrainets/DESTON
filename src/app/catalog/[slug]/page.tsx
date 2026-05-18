import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/features/catalog/api/getProducts";
import { ProductDetails } from "@/features/product/components/ProductDetails";
import styles from "./page.module.css";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Товар не найден" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps): Promise<React.ReactElement> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className={styles.section}>
      <ProductDetails product={product} />
    </section>
  );
}
