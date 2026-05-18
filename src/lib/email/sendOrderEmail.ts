import { getResend, resendConfig } from "@/lib/resend";
import { buildOrderConfirmationEmail } from "./orderConfirmation";
import type { OrderDTO } from "@/features/order/types/order";

/**
 * Sends the order confirmation email. Silent no-op (logs only) if Resend
 * isn't configured — the order is still created.
 */
export async function sendOrderConfirmationEmail(order: OrderDTO): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(`[email] Resend not configured — skipping email for order ${order.number}`);
    return;
  }

  const { subject, html, text } = buildOrderConfirmationEmail(order);

  await resend.emails.send({
    from: resendConfig.from,
    to: order.email,
    replyTo: resendConfig.replyTo,
    subject,
    html,
    text,
  });
}
