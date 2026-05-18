import type { ProductSummaryDTO } from "@/features/catalog/types/product";
import { ProductCard, ProductCardPlaceholder } from "./ProductCard";
import styles from "./ProductGrid.module.css";

interface ProductGridProps {
  products: ProductSummaryDTO[];
  /** When there are fewer products than slots, fill the grid with empty tiles to mirror the mock. */
  minSlots?: number;
}

export function ProductGrid({ products, minSlots = 8 }: ProductGridProps): React.ReactElement {
  const placeholderCount = Math.max(0, minSlots - products.length);

  return (
    <div className={styles.grid} role="list" aria-label="Список товаров">
      {products.map((p) => (
        <div className={styles.cell} role="listitem" key={p.id}>
          <ProductCard product={p} />
        </div>
      ))}
      {placeholderCount > 0 ? <ProductCardPlaceholder count={placeholderCount} /> : null}
    </div>
  );
}
