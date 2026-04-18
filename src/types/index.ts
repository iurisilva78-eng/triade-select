import type { OrderStatus, PaymentStatus, Role } from "@prisma/client";

export type { OrderStatus, PaymentStatus, Role };

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  RECEBIDO: "Recebido",
  ACEITO: "Pedido Aceito",
  EM_PRODUCAO: "Em Produção",
  ENVIADO: "Enviado",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  RECEBIDO: "#6B7280",
  ACEITO: "#3B82F6",
  EM_PRODUCAO: "#F59E0B",
  ENVIADO: "#8B5CF6",
  ENTREGUE: "#10B981",
  CANCELADO: "#EF4444",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "RECEBIDO",
  "ACEITO",
  "EM_PRODUCAO",
  "ENVIADO",
  "ENTREGUE",
];

export interface FreightOption {
  service: string;
  name: string;
  price: number;
  deliveryDays: number;
}

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  hasCustomization: boolean;
  logoUrl?: string;
  logoFileName?: string;
  notes?: string;
}
