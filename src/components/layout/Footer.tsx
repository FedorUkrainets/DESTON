import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer(): React.ReactElement {
  return (
    <footer className={styles.footer} aria-label="Подвал сайта">
      <div className={styles.logo} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="28" height="28" focusable="false">
          <path
            d="M16 0l3.6 9.6 10.4-.6-8 7.2 3.2 9.8-9.2-5.4-9.2 5.4 3.2-9.8-8-7.2 10.4.6z"
            fill="var(--color-accent)"
          />
        </svg>
      </div>

      <div className={styles.center} aria-hidden="false">
        ALL RIGHTS RESERVE
      </div>

      <ul className={styles.links}>
        <li>
          <Link href="/contacts" className={styles.link}>
            Telegram
          </Link>
        </li>
        <li>
          <Link href="/contacts" className={styles.link}>
            Отзывы
          </Link>
        </li>
      </ul>
    </footer>
  );
}
