import type { NextRequest } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleZodError } from "@/lib/utils/api-response";
import { clientIpFromHeaders, rateLimit } from "@/lib/utils/rate-limit";
import { sanitizeString } from "@/lib/utils/sanitize";
import { CreateOrderRequestSchema } from "@/features/checkout/schemas/checkout";
import { createOrder, OrderCreationError } from "@/features/order/api/createOrder";
import { yookassaProvider } from "@/features/payment/providers/yookassa";
import { sendOrderConfirmationEmail } from "@/lib/email/sendOrderEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const ip = clientIpFromHeaders(request.headers);
  const limit = rateLimit({ key: `orders:${ip}`, max: 10 });
  if (!limit.allowed) return apiError("Слишком много запросов", "RATE_LIMITED", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Невалидный JSON", "INVALID_JSON", 400);
  }

  try {
    const input = CreateOrderRequestSchema.parse(body);
    const userAgent = sanitizeString(request.headers.get("user-agent") ?? "", 240);

    const order = await createOrder(input, { ipAddress: ip, userAgent });

    let confirmationUrl: string | null = null;
    try {
      const payment = await yookassaProvider.createPayment({
        orderId: order.id,
        orderNumber: order.number,
        amount: order.total,
        currency: "RUB",
        description: `DESTON заказ ${order.number}`,
        returnUrl: env.YOOKASSA_RETURN_URL,
        customerEmail: order.email,
      });
      confirmationUrl = payment.confirmationUrl;

      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: "YOOKASSA",
          providerPaymentId: payment.providerPaymentId,
          status: "PENDING",
          amount: order.total,
          confirmationUrl,
          rawPayload: payment.rawPayload as object,
        },
      });
    } catch (err) {
      console.error("[orders] payment creation failed", err);
      // We don't roll back the order — operator can retry payment manually.
    }

    // Send the confirmation email outside the critical path.
    sendOrderConfirmationEmail(order).catch((err: unknown) => {
      console.error("[orders] email send failed", err);
    });

    return apiSuccess(
      {
        orderId: order.id,
        orderNumber: order.number,
        total: order.total,
        confirmationUrl,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    if (err instanceof OrderCreationError) {
      const status = err.code === "OUT_OF_STOCK" || err.code === "VARIANT_NOT_FOUND" ? 409 : 400;
      return apiError(err.message, err.code, status);
    }
    console.error("[api/orders] error", err);
    return apiError("Внутренняя ошибка", "INTERNAL", 500);
  }
}
