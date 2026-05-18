import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Контакты DESTON: email, Telegram, отзывы, Avito.",
};

interface Row {
  label: string;
  value: string;
}

const ROWS: readonly Row[] = [
  { label: "email", value: "------@----.---" },
  { label: "telegram", value: "------------" },
  { label: "reviews", value: "-------------" },
  { label: "avito", value: "----------------" },
];

export default function ContactsPage(): React.ReactElement {
  return (
    <section className={styles.section} aria-label="Контакты">
      <ul className={styles.list}>
        {ROWS.map((r) => (
          <li key={r.label} className={styles.row}>
            <span className={styles.label}>{r.label}:</span>
            <span className={styles.value}>{r.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
