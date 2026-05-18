import { Resend } from "resend";
import { env } from "@/lib/env";

let cached: Resend | null = null;

/**
 * Lazy Resend client. Returns `null` if Resend is not configured —
 * the caller decides whether to throw or skip sending (useful in dev).
 */
export function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (cached) return cached;
  cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export const resendConfig = {
  from: env.RESEND_FROM_EMAIL,
  replyTo: env.RESEND_REPLY_TO,
} as const;
