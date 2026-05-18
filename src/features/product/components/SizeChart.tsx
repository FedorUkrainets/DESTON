"use client";

import { useEffect } from "react";
import styles from "./SizeChart.module.css";

interface SizeChartProps {
  open: boolean;
  onClose: () => void;
  /**
   * Path to the size-chart image (PNG / JPG / SVG).
   * Default points to /public/images/size-chart.png — drop your file there.
   */
  imageSrc?: string;
  imageAlt?: string;
}

export function SizeChart({
  open,
  onClose,
  imageSrc = "/images/size-chart.svg",
  imageAlt = "Размерная сетка DESTON",
}: SizeChartProps): React.ReactElement | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <aside
      className={styles.panel}
      role="dialog"
      aria-modal="false"
      aria-label="Размерная сетка"
    >
      <header className={styles.header}>
        <h3 className={styles.title}>Размерная Сетка</h3>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </header>

      <div className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className={styles.image}
          onError={(e) => {
            // Hide broken image gracefully so the empty panel still renders.
            const target = e.currentTarget;
            target.style.display = "none";
          }}
        />
      </div>
    </aside>
  );
}
