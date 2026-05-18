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

interface BuildEmailResult {
  subject: string;
  html: string;
  text: string;
}

export function buildOrderConfirmationEmail(order: OrderDTO): BuildEmailResult {
  const subject = `DESTON — заказ ${order.number}`;

  const lines = order.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.productName)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.size)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(i.color)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${i.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(formatPriceRub(i.unitPrice))}</td>
        </tr>`,
    )
    .join("");

  const html = `
<!doctype html>
<html lang="ru">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" style="max-width:560px;background:#0a0a0a;border:1px solid #1c1c1c;">
        <tr><td style="padding:24px;">
          <h1 style="margin:0 0 8px;font-size:20px;color:#fff;">Заказ ${escapeHtml(order.number)} принят</h1>
          <p style="margin:0 0 16px;color:#d6d6d6;">Дата: ${escapeHtml(formatRuDate(order.createdAt))}</p>

          <h2 style="margin:16px 0 8px;font-size:14px;color:#ff3da7;">Покупатель</h2>
          <p style="margin:0;color:#d6d6d6;">
            ${escapeHtml(order.firstName)} ${escapeHtml(order.lastName)}<br/>
            ${escapeHtml(order.email)}<br/>
            ${escapeHtml(order.phone)}
          </p>

          <h2 style="margin:16px 0 8px;font-size:14px;color:#ff3da7;">Доставка</h2>
          <p style="margin:0;color:#d6d6d6;">
            ${escapeHtml(DELIVERY_LABEL[order.deliveryProvider])}<br/>
            ${escapeHtml(order.city)}, ${escapeHtml(order.address)}
            ${order.pickupPointCode ? `<br/>ПВЗ: ${escapeHtml(order.pickupPointCode)}` : ""}
            ${order.comment ? `<br/>Комментарий: ${escapeHtml(order.comment)}` : ""}
          </p>

          <h2 style="margin:16px 0 8px;font-size:14px;color:#ff3da7;">Состав заказа</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="color:#fff;font-size:13px;">
            <thead>
              <tr>
                <th align="left" style="padding:8px;border-bottom:1px solid #2a2a2a;">Товар</th>
                <th align="left" style="padding:8px;border-bottom:1px solid #2a2a2a;">Размер</th>
                <th align="left" style="padding:8px;border-bottom:1px solid #2a2a2a;">Цвет</th>
                <th align="left" style="padding:8px;border-bottom:1px solid #2a2a2a;">Кол-во</th>
                <th align="left" style="padding:8px;border-bottom:1px solid #2a2a2a;">Цена</th>
              </tr>
            </thead>
            <tbody>${lines}</tbody>
          </table>

          <p style="margin:16px 0 4px;color:#d6d6d6;">Подытог: ${escapeHtml(formatPriceRub(order.subtotal))}</p>
          <p style="margin:0 0 4px;color:#d6d6d6;">Доставка: ${escapeHtml(formatPriceRub(order.deliveryCost))}</p>
          <p style="margin:0;color:#fff;font-size:16px;"><strong>Итого: ${escapeHtml(formatPriceRub(order.total))}</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const textLines: string[] = [
    `Заказ ${order.number}`,
    `Дата: ${formatRuDate(order.createdAt)}`,
    "",
    "Покупатель:",
    `  ${order.firstName} ${order.lastName}`,
    `  ${order.email}`,
    `  ${order.phone}`,
    "",
    "Доставка:",
    `  ${DELIVERY_LABEL[order.deliveryProvider]}`,
    `  ${order.city}, ${order.address}`,
  ];
  if (order.pickupPointCode) textLines.push(`  ПВЗ: ${order.pickupPointCode}`);
  if (order.comment) textLines.push(`  Комментарий: ${order.comment}`);
  textLines.push("", "Состав:");
  for (const item of order.items) {
    textLines.push(
      `  - ${item.productName} | ${item.size} | ${item.color} | x${item.quantity} | ${formatPriceRub(item.unitPrice)}`,
    );
  }
  textLines.push(
    "",
    `Подытог: ${formatPriceRub(order.subtotal)}`,
    `Доставка: ${formatPriceRub(order.deliveryCost)}`,
    `Итого: ${formatPriceRub(order.total)}`,
  );

  return { subject, html, text: textLines.join("\n") };
}
