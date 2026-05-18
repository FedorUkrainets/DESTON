"use client";

import type { ProductSize } from "@prisma/client";
import styles from "./SizeSelector.module.css";

const SIZE_ORDER: readonly ProductSize[] = ["S", "M", "L", "XL"];

interface SizeSelectorProps {
  available: ProductSize[];
  value: ProductSize | null;
  onChange: (size: ProductSize) => void;
}

export function SizeSelector({ available, value, onChange }: SizeSelectorProps): React.ReactElement {
  return (
    <div className={styles.row} role="radiogroup" aria-label="Выберите размер">
      {SIZE_ORDER.map((size, idx) => {
        const enabled = available.includes(size);
        const active = value === size;
        return (
          <span key={size} className={styles.cell}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!enabled}
              onClick={() => enabled && onChange(size)}
              className={`${styles.size} ${active ? styles.sizeActive : ""}`}
            >
              {size}
            </button>
            {idx < SIZE_ORDER.length - 1 ? (
              <span aria-hidden="true" className={styles.divider}>
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
