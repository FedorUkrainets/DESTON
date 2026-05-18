"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: readonly SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, placeholder, id, className, ...rest },
  ref,
) {
  const selectId = id ?? `select-${rest.name ?? Math.random().toString(36).slice(2, 8)}`;
  const describedBy = error ? `${selectId}-err` : undefined;

  return (
    <div className={`${styles.field} ${error ? styles.fieldError : ""} ${className ?? ""}`}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={styles.wrapper}>
        <select
          ref={ref}
          id={selectId}
          className={styles.select}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className={styles.chevron}>
          ⌄
        </span>
      </div>
      {error ? (
        <span id={`${selectId}-err`} className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
});
