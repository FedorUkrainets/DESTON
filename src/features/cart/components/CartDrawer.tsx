"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore, selectSubtotal } from "@/features/cart/store/cartStore";
import { formatPriceRub } from "@/lib/utils/format";
import { CartItem } from "./CartItem";
import styles from "./CartDrawer.module.css";

export function CartDrawer(): React.ReactElement {
  const router = useRouter();
  const isOpen = useCartStore((s) => s.isOpen);
  const items = useCartStore((s) => s.items);
  const close = useCartStore((s) => s.close);
  const subtotal = useCartStore(selectSubtotal);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close]);

  const goCheckout = (): void => {
    close();
    router.push("/checkout");
  };

  const isEmpty = items.length === 0;

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
        aria-hidden={!isOpen}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Ваш заказ</h2>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Закрыть корзину"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className={styles.body}>
          {isEmpty ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Корзина пуста</p>
              <Link href="/catalog" onClick={close} className={styles.emptyCta}>
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {items.map((i) => (
                <li key={i.variantId}>
                  <CartItem item={i} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {!isEmpty ? (
          <footer className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Сумма:</span>
              <strong className={styles.totalValue}>{formatPriceRub(subtotal)}</strong>
            </div>
            <button type="button" className={styles.checkout} onClick={goCheckout}>
              Оформить
            </button>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
