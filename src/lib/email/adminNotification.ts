import type { OrderDTO } from "@/features/order/types/order";
import { escapeHtml } from "@/lib/utils/sanitize";
import { formatPriceRub, formatRuDate } from "@/lib/utils/format";

const DELIVERY_LABEL: Record<OrderDTO["deliveryProvider"], string> = {
  CDEK: "СДЭК",
  POCHTA: "Почта России",
  BOXBERRY: "Boxberry",
  YANDEX: "Яндекс Доставка",
  PICKUP: "Самовывоз",
};

interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Internal admin notification — full dump of the order:
 * customer data, delivery, items, totals. Stylistically plain.
 */
export function buildAdminNotificationEmail(order: OrderDTO): BuiltEmail {
  const subject = `[DESTON] Новый заказ ${order.number}`;

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.productName)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.size)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(i.color)}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${i.quantity}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(formatPriceRub(i.unitPrice))}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(formatPriceRub(i.unitPrice * i.quantity))}</td>
        </tr>`,
    )
    .join("");

  const html = `
<!doctype html>
<html lang="ru">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f6f6f6;color:#111;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" style="max-width:640px;background:#fff;border:1px solid #e1e1e1;">
        <tr><td style="padding:20px;">
          <h1 style="margin:0 0 4px;font-size:18px;color:#111;">Новый заказ ${escapeHtml(order.number)}</h1>
          <p style="margin:0 0 16px;color:#555;font-size:13px;">${escapeHtml(formatRuDate(order.createdAt))}</p>

          <h2 style="margin:16px 0 8px;font-size:14px;color:#111;border-bottom:1px solid #eee;padding-bottom:4px;">Покупатель</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#222;">
            <tr><td style="padding:3px 0;width:140px;color:#666;">Имя</td><td>${escapeHtml(order.firstName)}</td></tr>
            <tr><td style="padding:3px 0;color:#666;">Фамилия</td><td>${escapeHtml(order.lastName)}</td></tr>
            <tr><td style="padding:3px 0;color:#666;">Email</td><td><a href="mailto:${escapeHtml(order.email)}">${escapeHtml(order.email)}</a></td></tr>
            <tr><td style="padding:3px 0;color:#666;">Телефон</td><td>${escapeHtml(order.phone)}</td></tr>
          </table>

          <h2 style="margin:16px 0 8px;font-size:14px;color:#111;border-bottom:1px solid #eee;padding-bottom:4px;">Доставка</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#222;">
            <tr><td style="padding:3px 0;width:140px;color:#666;">Способ</td><td>${escapeHtml(DELIVERY_LABEL[order.deliveryProvider])}</td></tr>
            <tr><td style="padding:3px 0;color:#666;">Город</td><td>${escapeHtml(order.city)}</td></tr>
            <tr><td style="padding:3px 0;color:#666;">Адрес</td><td>${escapeHtml(order.address)}</td></tr>
            ${order.pickupPointCode ? `<tr><td style="padding:3px 0;color:#666;">ПВЗ</td><td>${escapeHtml(order.pickupPointCode)}</td></tr>` : ""}
            ${order.comment ? `<tr><td style="padding:3px 0;color:#666;">Комментарий</td><td>${escapeHtml(order.comment)}</td></tr>` : ""}
          </table>

          <h2 style="margin:16px 0 8px;font-size:14px;color:#111;border-bottom:1px solid #eee;padding-bottom:4px;">Позиции</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#222;border-collapse:collapse;">
            <thead>
              <tr style="background:#fafafa;">
                <th align="left" style="padding:6px 8px;border:1px solid #ddd;">Товар</th>
                <th align="left" style="padding:6px 8px;border:1px solid #ddd;">Размер</th>
                <th align="left" style="padding:6px 8px;border:1px solid #ddd;">Цвет</th>
                <th align="left" style="padding:6px 8px;border:1px solid #ddd;">Кол-во</th>
                <th align="left" style="padding:6px 8px;border:1px solid #ddd;">Цена</th>
                <th align="left" style="padding:6px 8px;border:1px solid #ddd;">Сумма</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:13px;color:#222;">
            <tr><td align="right" style="padding:3px 0;color:#666;">Подытог:</td><td align="right" width="120">${escapeHtml(formatPriceRub(order.subtotal))}</td></tr>
            <tr><td align="right" style="padding:3px 0;color:#666;">Доставка:</td><td align="right">${escapeHtml(formatPriceRub(order.deliveryCost))}</td></tr>
            <tr><td align="right" style="padding:6px 0;font-size:15px;"><strong>Итого:</strong></td><td align="right"><strong>${escapeHtml(formatPriceRub(order.total))}</strong></td></tr>
          </table>

          <p style="margin:20px 0 0;color:#888;font-size:11px;">Автоматическое уведомление DESTON. Не отвечайте на это письмо — связаться с покупателем можно по его email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const lines: string[] = [
    `Новый заказ ${order.number}`,
    `Дата: ${formatRuDate(order.createdAt)}`,
    "",
    "Покупатель:",
    `  Имя:     ${order.firstName}`,
    `  Фамилия: ${order.lastName}`,
    `  Email:   ${order.email}`,
    `  Телефон: ${order.phone}`,
    "",
    "Доставка:",
    `  Способ:  ${DELIVERY_LABEL[order.deliveryProvider]}`,
    `  Город:   ${order.city}`,
    `  Адрес:   ${order.address}`,
  ];
  if (order.pickupPointCode) lines.push(`  ПВЗ:     ${order.pickupPointCode}`);
  if (order.comment) lines.push(`  Коммент: ${order.comment}`);

  lines.push("", "Позиции:");
  for (const i of order.items) {
    lines.push(
      `  - ${i.productName} | ${i.size} | ${i.color} | x${i.quantity} | ${formatPriceRub(i.unitPrice)} | сумма ${formatPriceRub(i.unitPrice * i.quantity)}`,
    );
  }
  lines.push(
    "",
    `Подытог: ${formatPriceRub(order.subtotal)}`,
    `Доставка: ${formatPriceRub(order.deliveryCost)}`,
    `Итого: ${formatPriceRub(order.total)}`,
  );

  return { subject, html, text: lines.join("\n") };
}
