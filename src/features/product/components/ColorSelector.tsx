"use client";

import styles from "./ColorSelector.module.css";

interface ColorSelectorProps {
  available: string[];
  value: string | null;
  onChange: (color: string) => void;
}

export function ColorSelector({ available, value, onChange }: ColorSelectorProps): React.ReactElement {
  return (
    <div className={styles.row} role="radiogroup" aria-label="Выберите цвет">
      {available.map((color, idx) => {
        const active = value === color;
        return (
          <span key={color} className={styles.cell}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(color)}
              className={`${styles.color} ${active ? styles.colorActive : ""}`}
            >
              {color}
            </button>
            {idx < available.length - 1 ? (
              <span aria-hidden="true" className={styles.divider}>
                /
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
