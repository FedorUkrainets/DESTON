import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Помощь",
  description: "Помощь по оформлению заказа в DESTON.",
};

export default function HelpPage(): React.ReactElement {
  return (
    <section className={styles.section} aria-label="Помощь">
      <article className={styles.article}>
        <h1 className={styles.title}>Помощь</h1>
        <p className={styles.paragraph}>
          Если у вас остались вопросы по оформлению заказа, размерной сетке или доставке —
          напишите нам в Telegram или на email. Мы ответим в течение рабочего дня.
        </p>
        <p className={styles.paragraph}>
          Полные контакты доступны на странице «Контакты».
        </p>
      </article>
    </section>
  );
}
