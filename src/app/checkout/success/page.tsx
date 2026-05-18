import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Заказ оформлен",
  description: "Заказ принят. Подтверждение отправлено на email.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const sp = await searchParams;
  const orderNumber = typeof sp.order === "string" ? sp.order : null;

  return (
    <section className={styles.section} aria-label="Заказ оформлен">
      <div className={styles.card}>
        <h1 className={styles.title}>Заказ оформлен</h1>
        <p className={styles.paragraph}>
          Спасибо! Мы отправили подтверждение на ваш email.
        </p>
        {orderNumber ? (
          <p className={styles.paragraph}>
            Номер заказа: <span className={styles.code}>{orderNumber}</span>
          </p>
        ) : null}
        <Link href="/catalog" className={styles.link}>
          Вернуться в каталог
        </Link>
      </div>
    </section>
  );
}
