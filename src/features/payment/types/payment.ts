export interface PaymentCreateInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: "RUB";
  description: string;
  returnUrl: string;
  customerEmail: string;
}

export interface PaymentCreateResult {
  providerPaymentId: string;
  confirmationUrl: string | null;
  rawPayload: unknown;
}

export type PaymentNormalizedStatus =
  | "PENDING"
  | "WAITING_FOR_CAPTURE"
  | "SUCCEEDED"
  | "CANCELED"
  | "REFUNDED"
  | "FAILED";

export interface PaymentWebhookEvent {
  providerPaymentId: string;
  status: PaymentNormalizedStatus;
  amount: number;
  rawPayload: unknown;
}

export interface PaymentProvider {
  readonly id: "YOOKASSA";
  createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult>;
  parseWebhook(rawBody: string, headers: Headers): Promise<PaymentWebhookEvent>;
}
