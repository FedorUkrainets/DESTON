import { z } from "zod";

/**
 * Strict, runtime-validated environment.
 *
 * During `next build` (phase-production-build) we relax the schema so the
 * production image can be built on machines that don't carry the real DB URL
 * or secrets. At runtime (`next start`) the schema is strict — missing
 * required values crash the boot.
 */

const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_BUILD === "1";

const requiredString = (msg: string) =>
  isBuildPhase ? z.string().optional().default("__build_placeholder__") : z.string().min(1, msg);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: requiredString("DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  NEXT_PUBLIC_SITE_URL: z
    .string()
    .default("http://localhost:3000")
    .transform((v) => {
      const trimmed = v.trim();
      if (!trimmed) return "http://localhost:3000";
      // Ensure a protocol is present — `new URL()` throws on bare IPs/domains.
      return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    }),
  NEXT_PUBLIC_SITE_NAME: z.string().default("DESTON"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().default("products"),

  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default("DESTON <onboarding@resend.dev>"),
  RESEND_REPLY_TO: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined)),
  ADMIN_NOTIFICATION_EMAIL: z.string().email().default("anaono542@gmail.com"),

  YOOKASSA_SHOP_ID: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined)),
  YOOKASSA_SECRET_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v : undefined)),
  YOOKASSA_RETURN_URL: z.string().default("http://localhost:3000/checkout/success"),
  YOOKASSA_WEBHOOK_SECRET: z.string().optional(),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. See logs above.");
}

export const env = parsed.data;
export type Env = z.infer<typeof serverSchema>;
