import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/utils/sanitize";
import { formatOrderNumber } from "@/lib/utils/format";
import type { CreateOrderRequest } from "@/features/checkout/schemas/checkout";
import type { OrderDTO } from "@/features/order/types/order";

export interface CreateOrderContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  deliveryCost?: number;
}

export class OrderCreationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "EMPTY_CART"
      | "VARIANT_NOT_FOUND"
      | "OUT_OF_STOCK"
      | "PRICE_MISMATCH"
      | "UNKNOWN",
  ) {
    super(message);
    this.name = "OrderCreationError";
  }
}

/**
 * Creates an order in a single transaction.
 *
 * Server-side responsibilities:
 *   1. Re-resolve variants & prices from the DB — never trust client-side prices.
 *   2. Decrement stock atomically (`update` with `decrement`) and verify availability.
 *   3. Build OrderItem snapshots (denormalized for invoice consistency).
 *   4. Compute totals server-side.
 */
export async function createOrder(
  input: CreateOrderRequest,
  ctx: CreateOrderContext = {},
): Promise<OrderDTO> {
  if (input.items.length === 0) {
    throw new OrderCreationError("Корзина пуста", "EMPTY_CART");
  }

  const variantIds = input.items.map((i) => i.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  if (variants.length !== variantIds.length) {
    throw new OrderCreationError("Один из товаров не найден", "VARIANT_NOT_FOUND");
  }

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  for (const item of input.items) {
    const v = variantMap.get(item.variantId);
    if (!v) throw new OrderCreationError("Один из товаров не найден", "VARIANT_NOT_FOUND");
    if (v.stock < item.quantity) {
      throw new OrderCreationError(`Недостаточно товара "${v.product.name}" размер ${v.size}`, "OUT_OF_STOCK");
    }
  }

  const subtotal = input.items.reduce((sum, item) => {
    const v = variantMap.get(item.variantId);
    if (!v) return sum;
    const price = v.priceOverride ?? v.product.basePrice;
    return sum + price * item.quantity;
  }, 0);

  const deliveryCost = ctx.deliveryCost ?? 0;
  const total = subtotal + deliveryCost;

  const result = await prisma.$transaction(async (tx) => {
    // Atomic stock decrement with row-level checks.
    for (const item of input.items) {
      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new OrderCreationError("Недостаточно товара на складе", "OUT_OF_STOCK");
      }
    }

    const order = await tx.order.create({
      data: {
        number: formatOrderNumber(),
        status: "AWAITING_PAYMENT",
        firstName: sanitizeString(input.firstName, 60),
        lastName: sanitizeString(input.lastName, 60),
        email: sanitizeString(input.email, 254).toLowerCase(),
        phone: sanitizeString(input.phone, 20),
        deliveryProvider: input.deliveryProvider,
        city: sanitizeString(input.city, 80),
        address: sanitizeString(input.address, 240),
        pickupPointCode: input.pickupPointCode ? sanitizeString(input.pickupPointCode, 40) : null,
        comment: input.comment ? sanitizeString(input.comment, 500) : null,
        subtotal,
        deliveryCost,
        total,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ? sanitizeString(ctx.userAgent, 240) : null,
        items: {
          create: input.items.map<PrismaTypes.OrderItemCreateWithoutOrderInput>((item) => {
            const v = variantMap.get(item.variantId);
            if (!v) throw new OrderCreationError("Один из товаров не найден", "VARIANT_NOT_FOUND");
            const unitPrice = v.priceOverride ?? v.product.basePrice;
            return {
              variant: { connect: { id: v.id } },
              productName: v.product.name,
              size: v.size,
              color: v.color,
              unitPrice,
              quantity: item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    return order;
  });

  return mapOrderToDTO(result);
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

function mapOrderToDTO(order: OrderWithItems): OrderDTO {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    firstName: order.firstName,
    lastName: order.lastName,
    email: order.email,
    phone: order.phone,
    deliveryProvider: order.deliveryProvider,
    city: order.city,
    address: order.address,
    pickupPointCode: order.pickupPointCode,
    comment: order.comment,
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      size: i.size,
      color: i.color,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
  };
}
