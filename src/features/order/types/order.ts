import type { DeliveryProvider, OrderStatus, ProductSize } from "@prisma/client";

export interface OrderItemDTO {
  id: string;
  productName: string;
  size: ProductSize;
  color: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderDTO {
  id: string;
  number: string;
  status: OrderStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryProvider: DeliveryProvider;
  city: string;
  address: string;
  pickupPointCode: string | null;
  comment: string | null;
  subtotal: number;
  deliveryCost: number;
  total: number;
  createdAt: Date;
  items: OrderItemDTO[];
}
