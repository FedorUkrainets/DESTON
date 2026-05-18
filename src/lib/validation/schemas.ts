import { z } from "zod";

/**
 * Shared Zod primitives used across the app. Re-export feature-specific schemas
 * from their own feature folder to keep imports clean.
 */

export const ProductSizeSchema = z.enum(["S", "M", "L", "XL"]);
export type ProductSizeValue = z.infer<typeof ProductSizeSchema>;

export const ColorSchema = z
  .string()
  .min(1, "Цвет обязателен")
  .max(40, "Слишком длинное название цвета");

/**
 * Russian phone: strictly `8 XXX XXX XX XX` (literal pattern matching the spec).
 * We accept input with optional separators, but validate the digits cleanly.
 */
export const RuPhoneSchema = z
  .string()
  .trim()
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("8");
  }, "Телефон должен быть в формате 8 XXX XXX XX XX");

export const EmailSchema = z.string().trim().toLowerCase().email("Невалидный email").max(254);

export const NameSchema = z
  .string()
  .trim()
  .min(2, "Минимум 2 символа")
  .max(60, "Максимум 60 символов")
  .regex(/^[A-Za-zА-Яа-яЁё\- ]+$/u, "Допустимы только буквы, пробел и дефис");

export const CitySchema = z.string().trim().min(2, "Укажите город").max(80);
export const AddressSchema = z.string().trim().min(3, "Укажите адрес").max(240);
export const CommentSchema = z.string().trim().max(500).optional().default("");
