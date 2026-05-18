import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFoundPage(): React.ReactElement {
  return (
    <section className={styles.section} aria-label="Страница не найдена">
      <h1 className={styles.title}>404</h1>
      <p className={styles.paragraph}>Страница не найдена.</p>
      <Link href="/" className={styles.link}>
        На главную
      </Link>
    </section>
  );
}
