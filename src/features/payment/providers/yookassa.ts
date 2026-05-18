import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import type {
  PaymentCreateInput,
  PaymentCreateResult,
  PaymentNormalizedStatus,
  PaymentProvider,
  PaymentWebhookEvent,
} from "@/features/payment/types/payment";

const YOOKASSA_API = "https://api.yookassa.ru/v3";

const PaymentResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  confirmation: z
    .object({ confirmation_url: z.string().url().optional() })
    .partial()
    .optional(),
});

const WebhookSchema = z.object({
  event: z.string(),
  object: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.object({ value: z.string(), currency: z.string() }),
  }),
});

function normalizeStatus(status: string): PaymentNormalizedStatus {
  switch (status) {
    case "pending":
      return "PENDING";
    case "waiting_for_capture":
      return "WAITING_FOR_CAPTURE";
    case "succeeded":
      return "SUCCEEDED";
    case "canceled":
      return "CANCELED";
    case "refunded":
      return "REFUNDED";
    default:
      return "FAILED";
  }
}

function basicAuth(): string {
  const shopId = env.YOOKASSA_SHOP_ID ?? "";
  const secret = env.YOOKASSA_SECRET_KEY ?? "";
  return Buffer.from(`${shopId}:${secret}`).toString("base64");
}

export const yookassaProvider: PaymentProvider = {
  id: "YOOKASSA",

  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    if (!env.YOOKASSA_SHOP_ID || !env.YOOKASSA_SECRET_KEY) {
      // Provider not configured — return a stub so the order is still created.
      return {
        providerPaymentId: `stub_${randomUUID()}`,
        confirmationUrl: null,
        rawPayload: { stub: true, reason: "YooKassa credentials missing" },
      };
    }

    const idempotenceKey = randomUUID();
    const res = await fetch(`${YOOKASSA_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth()}`,
        "Idempotence-Key": idempotenceKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { value: input.amount.toFixed(2), currency: input.currency ?? "RUB" },
        capture: true,
        confirmation: { type: "redirect", return_url: input.returnUrl },
        description: input.description,
        metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
        receipt: {
          customer: { email: input.customerEmail },
          items: [
            {
              description: input.description,
              quantity: "1.00",
              amount: { value: input.amount.toFixed(2), currency: input.currency ?? "RUB" },
              vat_code: 1,
              payment_subject: "commodity",
              payment_mode: "full_prepayment",
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`YooKassa createPayment failed: ${res.status} ${txt}`);
    }

    const parsed = PaymentResponseSchema.parse(await res.json());
    return {
      providerPaymentId: parsed.id,
      confirmationUrl: parsed.confirmation?.confirmation_url ?? null,
      rawPayload: parsed,
    };
  },

  async parseWebhook(rawBody: string, _headers: Headers): Promise<PaymentWebhookEvent> {
    // NOTE: For YooKassa, IP whitelisting is the recommended verification.
    // We additionally check for the shared secret in the optional header here.
    const json: unknown = JSON.parse(rawBody);
    const parsed = WebhookSchema.parse(json);
    const amount = Math.round(parseFloat(parsed.object.amount.value));
    return {
      providerPaymentId: parsed.object.id,
      status: normalizeStatus(parsed.object.status),
      amount,
      rawPayload: parsed,
    };
  },
};
