import Link from "next/link";
import type { ProductSummaryDTO } from "@/features/catalog/types/product";
import { formatPriceRub } from "@/lib/utils/format";
import styles from "./ProductCard.module.css";

interface ProductCardProps {
  product: ProductSummaryDTO;
}

export function ProductCard({ product }: ProductCardProps): React.ReactElement {
  return (
    <Link
      href={`/catalog/${product.slug}`}
      className={styles.card}
      aria-label={`${product.name}, ${formatPriceRub(product.basePrice)}`}
    >
      <div className={styles.tile}>
        {product.primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.primaryImage} alt="" className={styles.image} />
        ) : null}

        <div className={styles.meta} aria-hidden="true">
          <span className={styles.name}>{product.name}</span>
          <span className={styles.price}>{formatPriceRub(product.basePrice)}</span>
        </div>
      </div>
    </Link>
  );
}

interface ProductCardSkeletonProps {
  count?: number;
}

export function ProductCardPlaceholder({ count = 1 }: ProductCardSkeletonProps): React.ReactElement {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.placeholder} aria-hidden="true" />
      ))}
    </>
  );
}
