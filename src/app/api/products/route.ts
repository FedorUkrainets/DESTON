import type { NextRequest } from "next/server";
import { getProductSummaries } from "@/features/catalog/api/getProducts";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { clientIpFromHeaders, rateLimit } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  const limit = rateLimit({ key: `products:${clientIpFromHeaders(request.headers)}` });
  if (!limit.allowed) return apiError("Слишком много запросов", "RATE_LIMITED", 429);

  try {
    const products = await getProductSummaries();
    return apiSuccess(products);
  } catch (err) {
    console.error("[api/products] error", err);
    return apiError("Внутренняя ошибка", "INTERNAL", 500);
  }
}
