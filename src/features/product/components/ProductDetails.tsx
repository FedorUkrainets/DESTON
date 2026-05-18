"use client";

import { useMemo, useState } from "react";
import type { ProductSize } from "@prisma/client";
import type { ProductDetailDTO } from "@/features/catalog/types/product";
import { useCartStore } from "@/features/cart/store/cartStore";
import { formatPriceRub } from "@/lib/utils/format";
import { ProductGallery } from "./ProductGallery";
import { SizeSelector } from "./SizeSelector";
import { ColorSelector } from "./ColorSelector";
import { SizeChart } from "./SizeChart";
import styles from "./ProductDetails.module.css";

interface ProductDetailsProps {
  product: ProductDetailDTO;
}

export function ProductDetails({ product }: ProductDetailsProps): React.ReactElement {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(
    product.availableSizes[0] ?? null,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    product.availableColors[0] ?? null,
  );
  const [chartOpen, setChartOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const selectedVariant = useMemo(() => {
    if (!selectedSize || !selectedColor) return null;
    return (
      product.variants.find((v) => v.size === selectedSize && v.color === selectedColor) ?? null
    );
  }, [product.variants, selectedSize, selectedColor]);

  const price = selectedVariant?.priceOverride ?? product.basePrice;
  const inStock = (selectedVariant?.stock ?? 0) > 0;
  const canAdd = Boolean(selectedVariant) && inStock;

  const handleAdd = (): void => {
    if (!selectedVariant || !selectedSize || !selectedColor) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      size: selectedSize,
      color: selectedColor,
      unitPrice: price,
      quantity: 1,
      imageUrl: product.images[0]?.url ?? null,
    });
  };

  return (
    <article className={styles.layout}>
      <div className={styles.galleryColumn}>
        <ProductGallery images={product.images} alt={product.name} />
      </div>

      <div className={styles.infoColumn}>
        <h1 className={styles.title}>{product.name}</h1>

        <dl className={styles.specs}>
          <div className={styles.specRow}>
            <dt className={styles.specKey}>Размер:</dt>
            <dd className={styles.specVal}>
              <SizeSelector
                available={product.availableSizes}
                value={selectedSize}
                onChange={setSelectedSize}
              />
            </dd>
          </div>

          <div className={styles.specRow}>
            <dt className={styles.specKey}>Цвет:</dt>
            <dd className={styles.specVal}>
              <ColorSelector
                available={product.availableColors}
                value={selectedColor}
                onChange={setSelectedColor}
              />
            </dd>
          </div>

          <div className={styles.specRow}>
            <dt className={styles.specKey}>Состав:</dt>
            <dd className={styles.specVal}>
              <p className={styles.compLine}>{product.composition}</p>
              {product.cut ? <p className={styles.compLine}>{product.cut}</p> : null}
            </dd>
          </div>

          <div className={styles.specRow}>
            <dt className={styles.specKey}>Цена:</dt>
            <dd className={styles.specVal}>
              <span className={styles.price}>{formatPriceRub(price)}</span>
            </dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleAdd}
            disabled={!canAdd}
          >
            {canAdd ? "Добавить в корзину" : inStock ? "Выберите размер и цвет" : "Нет в наличии"}
          </button>
          <button
            type="button"
            className={styles.chartBtn}
            onClick={() => setChartOpen((v) => !v)}
            aria-expanded={chartOpen}
          >
            Размерная сетка
          </button>
        </div>
      </div>

      <div className={styles.chartColumn} aria-live="polite">
        <SizeChart open={chartOpen} onClose={() => setChartOpen(false)} />
      </div>
    </article>
  );
}
