import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse {
  const body: ApiSuccess<T> = { ok: true, data };
  return NextResponse.json(body, init);
}

export function apiError(
  message: string,
  code: string,
  status = 400,
  details?: Record<string, string[]>,
): NextResponse {
  const body: ApiError = { ok: false, error: { code, message, details } };
  return NextResponse.json(body, { status });
}

export function handleZodError(err: ZodError): NextResponse {
  return apiError("Невалидные данные", "VALIDATION_ERROR", 422, err.flatten().fieldErrors as Record<string, string[]>);
}
