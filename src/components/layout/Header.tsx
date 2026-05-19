"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore, selectTotalCount } from "@/features/cart/store/cartStore";
import styles from "./Header.module.css";

interface NavItem {
  href: "/" | "/catalog" | "/contacts" | "/help" | "/privacy";
  label: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/contacts", label: "Контакты" },
  { href: "/help", label: "Помощь" },
  { href: "/privacy", label: "Политика" },
] as const;

export function Header(): React.ReactElement {
  const pathname = usePathname();
  const openCart = useCartStore((s) => s.open);
  const count = useCartStore(selectTotalCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Counter renders only after mount — avoids SSR/CSR mismatch from persisted cart.
  const displayCount = mounted ? count : 0;

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Главная навигация">
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        className={styles.cartButton}
        onClick={openCart}
        aria-label={`Корзина${displayCount ? `, ${displayCount} товаров` : ""}`}
      >
        <span className={styles.cartButtonText}>
          Корзина <span aria-hidden="true">+</span>
        </span>
        {displayCount > 0 ? (
          <span className={styles.cartCounter} aria-hidden="true">
            {displayCount}
          </span>
        ) : null}
      </button>
    </header>
  );
}
