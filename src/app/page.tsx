import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "DESTON — главная",
  description: "DESTON: streetwear, худи и тишэрты.",
};

export default function HomePage(): React.ReactElement {
  return (
    <section className={styles.section} aria-label="Главная">
      <Link
        href="/catalog"
        className={styles.banner}
        aria-label="Перейти в каталог"
      >
        <div className={styles.bannerInner}>
          <span className={styles.brand}>DES&#x2731;TON</span>
          <span className={`${styles.brand} ${styles.brandMirror}`}>DES&#x2731;TON</span>
        </div>
        <span className={styles.cta}>Открыть каталог</span>
      </Link>
    </section>
  );
}
