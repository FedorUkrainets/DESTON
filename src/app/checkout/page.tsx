import type { Metadata } from "next";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Оформление заказа в DESTON.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage(): React.ReactElement {
  return (
    <section className={styles.section} aria-label="Оформление заказа">
      <CheckoutForm />
    </section>
  );
}
