import { env } from "@/lib/env";
import { getResend, resendConfig } from "@/lib/resend";
import { buildOrderConfirmationEmail } from "./orderConfirmation";
import { buildAdminNotificationEmail } from "./adminNotification";
import type { OrderDTO } from "@/features/order/types/order";

/**
 * Send order emails:
 *   1. Customer  — payment confirmation with order number (`order.email`)
 *   2. Admin     — full order details (`env.ADMIN_NOTIFICATION_EMAIL`)
 *
 * Failures of one don't block the other. Both are silent no-ops when Resend isn't configured.
 */
export async function sendOrderConfirmationEmail(order: OrderDTO): Promise<void> {
  const resend = getResend();
  if (!resend) {
    // eslint-disable-next-line no-console
    console.warn(`[email] Resend not configured — skipping emails for order ${order.number}`);
    return;
  }

  const customer = buildOrderConfirmationEmail(order);
  const admin = buildAdminNotificationEmail(order);

  const customerPromise = resend.emails
    .send({
      from: resendConfig.from,
      to: order.email,
      replyTo: resendConfig.replyTo,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    })
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`[email] customer email failed for ${order.number}`, err);
    });

  const adminPromise = resend.emails
    .send({
      from: resendConfig.from,
      to: env.ADMIN_NOTIFICATION_EMAIL,
      replyTo: order.email,
      subject: admin.subject,
      html: admin.html,
      text: admin.text,
    })
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`[email] admin email failed for ${order.number}`, err);
    });

  await Promise.allSettled([customerPromise, adminPromise]);
}
