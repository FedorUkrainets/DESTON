/**
 * Format Russian phone input as `8 XXX XXX XX XX`.
 *
 * - Accepts raw user input (anything).
 * - Returns a partially-formatted string that grows as digits are added.
 * - Strict validation lives in the Zod schema; this helper only shapes the display value.
 */
export function formatRuPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  const normalized = digits.startsWith("7") ? `8${digits.slice(1)}` : digits;
  const padded = normalized.padEnd(11, "•").slice(0, 11);

  const a = padded.slice(0, 1);
  const b = padded.slice(1, 4);
  const c = padded.slice(4, 7);
  const d = padded.slice(7, 9);
  const e = padded.slice(9, 11);

  const visibleParts = [a];
  if (digits.length > 1) visibleParts.push(b.replace(/•/g, ""));
  if (digits.length > 4) visibleParts.push(c.replace(/•/g, ""));
  if (digits.length > 7) visibleParts.push(d.replace(/•/g, ""));
  if (digits.length > 9) visibleParts.push(e.replace(/•/g, ""));

  return visibleParts.filter(Boolean).join(" ");
}
