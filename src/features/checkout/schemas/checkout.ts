import { z } from "zod";
import { ProductSizeSchema } from "@/lib/validation/schemas";
import {
  AddressSchema,
  CitySchema,
  CommentSchema,
  EmailSchema,
  NameSchema,
  RuPhoneSchema,
} from "@/lib/validation/schemas";

export const DeliveryProviderSchema = z.enum([
  "CDEK",
  "POCHTA",
  "BOXBERRY",
  "YANDEX",
  "PICKUP",
]);
export type DeliveryProviderValue = z.infer<typeof DeliveryProviderSchema>;

export const DELIVERY_OPTIONS: readonly { value: DeliveryProviderValue; label: string }[] = [
  { value: "CDEK", label: "СДЭК — пункт выдачи" },
  { value: "POCHTA", label: "Почта России" },
  { value: "BOXBERRY", label: "Boxberry" },
  { value: "YANDEX", label: "Яндекс Доставка" },
  { value: "PICKUP", label: "Самовывоз" },
];

export const CartLineItemInputSchema = z.object({
  variantId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
  /** Snapshot for client-side display only. Server re-resolves from DB. */
  size: ProductSizeSchema,
  color: z.string().min(1).max(40),
});
export type CartLineItemInput = z.infer<typeof CartLineItemInputSchema>;

export const CheckoutFormSchema = z.object({
  firstName: NameSchema,
  lastName: NameSchema,
  email: EmailSchema,
  phone: RuPhoneSchema,
  city: CitySchema,
  address: AddressSchema,
  pickupPointCode: z.string().trim().max(40).optional().default(""),
  deliveryProvider: DeliveryProviderSchema,
  comment: CommentSchema,
  consent: z
    .boolean()
    .refine((v) => v === true, "Необходимо согласие с условиями оферты и обработкой данных"),
});
export type CheckoutFormValues = z.infer<typeof CheckoutFormSchema>;

export const CreateOrderRequestSchema = CheckoutFormSchema.extend({
  items: z.array(CartLineItemInputSchema).min(1, "Корзина пуста").max(50),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
