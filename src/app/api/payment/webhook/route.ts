import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { yookassaProvider } from "@/features/payment/providers/yookassa";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_MAP: Record<
  | "PENDING"
  | "WAITING_FOR_CAPTURE"
  | "SUCCEEDED"
  | "CANCELED"
  | "REFUNDED"
  | "FAILED",
  "PENDING" | "WAITING_FOR_CAPTURE" | "SUCCEEDED" | "CANCELED" | "REFUNDED" | "FAILED"
> = {
  PENDING: "PENDING",
  WAITING_FOR_CAPTURE: "WAITING_FOR_CAPTURE",
  SUCCEEDED: "SUCCEEDED",
  CANCELED: "CANCELED",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
};

export async function POST(request: NextRequest): Promise<Response> {
  // Optional shared-secret header check (in addition to YooKassa IP whitelist).
  if (env.YOOKASSA_WEBHOOK_SECRET) {
    const provided = request.headers.get("x-yookassa-secret");
    if (provided !== env.YOOKASSA_WEBHOOK_SECRET) {
      return apiError("Forbidden", "FORBIDDEN", 403);
    }
  }

  const rawBody = await request.text();

  try {
    const event = await yookassaProvider.parseWebhook(rawBody, request.headers);
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId: event.providerPaymentId },
      include: { order: { include: { items: true } } },
    });
    if (!payment) return apiError("Платёж не найден", "NOT_FOUND", 404);

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: STATUS_MAP[event.status], rawPayload: event.rawPayload as object },
    });

    if (event.status === "SUCCEEDED" && payment.order.status !== "PAID") {
      const updated = await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
        include: { items: true },
      });

      sendOrderConfirmationEmail({
        id: updated.id,
        number: updated.number,
        status: updated.status,
        firstName: updated.firstName,
        lastName: updated.lastName,
        email: updated.email,
        phone: updated.phone,
        deliveryProvider: updated.deliveryProvider,
        city: updated.city,
        address: updated.address,
        pickupPointCode: updated.pickupPointCode,
        comment: updated.comment,
        subtotal: updated.subtotal,
        deliveryCost: updated.deliveryCost,
        total: updated.total,
        createdAt: updated.createdAt,
        items: updated.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          size: i.size,
          color: i.color,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      }).catch((err: unknown) => {
        console.error("[webhook] email send failed", err);
      });
    }

    if (event.status === "CANCELED" || event.status === "FAILED") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED" },
      });
    }

    return apiSuccess({ ok: true });
  } catch (err) {
    console.error("[api/payment/webhook] error", err);
    return apiError("Невалидный webhook", "INVALID_WEBHOOK", 400);
  }
}
