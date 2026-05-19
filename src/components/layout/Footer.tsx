import styles from "./Footer.module.css";

interface ExternalLink {
  href: string;
  label: string;
}

const EXTERNAL_LINKS: readonly ExternalLink[] = [
  { href: "https://t.me/DESTONSTORE", label: "Telegram" },
  { href: "https://t.me/destonot", label: "Отзывы" },
] as const;

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

      <div className={styles.center}>ALL RIGHTS RESERVE</div>

      <ul className={styles.links}>
        {EXTERNAL_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
