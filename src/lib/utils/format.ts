/**
 * Currency / order-number / date formatters.
 * The price model is in integer rubles (no kopecks) — DESTON product prices end in ".490р" etc.
 * Display format mirrors the mock: `3.490 р` (thousand separator is a dot, currency suffix " р").
 */

export function formatPriceRub(value: number): string {
  if (!Number.isFinite(value)) return "0 р";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  const withSeparators = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${withSeparators} р`;
}

export function formatOrderNumber(seedDate: Date = new Date()): string {
  const y = seedDate.getFullYear();
  const m = String(seedDate.getMonth() + 1).padStart(2, "0");
  const d = String(seedDate.getDate()).padStart(2, "0");
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `DST-${y}${m}${d}-${rnd}`;
}

export function formatRuDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
