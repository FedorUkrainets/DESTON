"use client";

import { useCartStore } from "@/features/cart/store/cartStore";
import type { CartLineItem } from "@/features/cart/types/cart";
import { formatPriceRub } from "@/lib/utils/format";
import styles from "./CartItem.module.css";

interface CartItemProps {
  item: CartLineItem;
}

export function CartItem({ item }: CartItemProps): React.ReactElement {
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <article className={styles.item} aria-label={`${item.productName}, ${item.size}, ${item.color}`}>
      <div className={styles.thumb} aria-hidden="true">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className={styles.thumbImage} />
        ) : null}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{item.productName}</h3>
        <p className={styles.meta}>
          <span>Размер: ({item.size})</span>
        </p>
        <p className={styles.meta}>
          <span>Цвет: {item.color.toLowerCase()}</span>
        </p>
        <p className={styles.meta}>
          <span>Цена: {formatPriceRub(item.unitPrice)}</span>
        </p>
      </div>

      <div className={styles.controls}>
        <div className={styles.qty} role="group" aria-label="Количество">
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => decrement(item.variantId)}
            aria-label="Уменьшить"
          >
            −
          </button>
          <span className={styles.qtyValue} aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            className={styles.qtyBtn}
            onClick={() => increment(item.variantId)}
            aria-label="Увеличить"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className={styles.remove}
          onClick={() => removeItem(item.variantId)}
          aria-label="Удалить из корзины"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6h12z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}
