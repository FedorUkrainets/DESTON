import type { NextRequest } from "next/server";
import { z } from "zod";
import { getProductBySlug } from "@/features/catalog/api/getProducts";
import { apiError, apiSuccess, handleZodError } from "@/lib/utils/api-response";
import { clientIpFromHeaders, rateLimit } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/i, "invalid slug"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const limit = rateLimit({ key: `product:${clientIpFromHeaders(request.headers)}` });
  if (!limit.allowed) return apiError("Слишком много запросов", "RATE_LIMITED", 429);

  const raw = await params;
  const parsed = ParamsSchema.safeParse(raw);
  if (!parsed.success) return handleZodError(parsed.error);

  try {
    const product = await getProductBySlug(parsed.data.slug);
    if (!product) return apiError("Товар не найден", "NOT_FOUND", 404);
    return apiSuccess(product);
  } catch (err) {
    console.error("[api/products/[slug]] error", err);
    return apiError("Внутренняя ошибка", "INTERNAL", 500);
  }
}
