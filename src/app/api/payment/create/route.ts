import type { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess, handleZodError } from "@/lib/utils/api-response";
import { clientIpFromHeaders, rateLimit } from "@/lib/utils/rate-limit";
import { yookassaProvider } from "@/features/payment/providers/yookassa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  orderId: z.string().cuid(),
});

/**
 * Manually create a (re-)payment for an existing order — for operator retries.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const limit = rateLimit({ key: `pay:${clientIpFromHeaders(request.headers)}`, max: 20 });
  if (!limit.allowed) return apiError("Слишком много запросов", "RATE_LIMITED", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Невалидный JSON", "INVALID_JSON", 400);
  }

  try {
    const { orderId } = BodySchema.parse(body);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return apiError("Заказ не найден", "NOT_FOUND", 404);
    if (order.status !== "AWAITING_PAYMENT") {
      return apiError("Оплата для этого заказа невозможна", "INVALID_STATE", 409);
    }

    const payment = await yookassaProvider.createPayment({
      orderId: order.id,
      orderNumber: order.number,
      amount: order.total,
      currency: "RUB",
      description: `DESTON заказ ${order.number}`,
      returnUrl: env.YOOKASSA_RETURN_URL,
      customerEmail: order.email,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "YOOKASSA",
        providerPaymentId: payment.providerPaymentId,
        status: "PENDING",
        amount: order.total,
        confirmationUrl: payment.confirmationUrl,
        rawPayload: payment.rawPayload as object,
      },
    });

    return apiSuccess({ confirmationUrl: payment.confirmationUrl }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return handleZodError(err);
    console.error("[api/payment/create] error", err);
    return apiError("Внутренняя ошибка", "INTERNAL", 500);
  }
}
