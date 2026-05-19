import type { Metadata } from "next";
import { getProductSummaries } from "@/features/catalog/api/getProducts";
import { ProductGrid } from "@/features/catalog/components/ProductGrid";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Каталог",
  description: "Все товары DESTON.",
};

// SSR на каждый запрос — данные каталога живут в БД и меняются на лету;
// статическая генерация во время `next build` без работающей БД бессмысленна.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CatalogPage(): Promise<React.ReactElement> {
  const products = await getProductSummaries();
  return (
    <section className={styles.section} aria-label="Каталог">
      <ProductGrid products={products} minSlots={8} />
    </section>
  );
}
