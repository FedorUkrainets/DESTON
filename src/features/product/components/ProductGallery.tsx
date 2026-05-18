"use client";

import { useState } from "react";
import type { ProductImageDTO } from "@/features/catalog/types/product";
import styles from "./ProductGallery.module.css";

interface ProductGalleryProps {
  images: ProductImageDTO[];
  alt: string;
}

export function ProductGallery({ images, alt }: ProductGalleryProps): React.ReactElement {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;
  const total = images.length;

  const prev = (): void => setIndex((i) => (total > 0 ? (i - 1 + total) % total : 0));
  const next = (): void => setIndex((i) => (total > 0 ? (i + 1) % total : 0));

  const current = hasImages ? images[index] : undefined;

  return (
    <div className={styles.gallery}>
      <div className={styles.frame}>
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.alt ?? alt} className={styles.image} />
        ) : null}
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className={`${styles.nav} ${styles.navPrev}`}
              aria-label="Предыдущее фото"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className={`${styles.nav} ${styles.navNext}`}
              aria-label="Следующее фото"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
