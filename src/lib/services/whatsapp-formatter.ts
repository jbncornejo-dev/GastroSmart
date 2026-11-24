import { formatBs, formatQuantity } from "../utils/currency";

export interface WhatsAppOrderItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  unitCostBs: number;
  subtotalBs: number;
}

export function formatWhatsAppOrderMessage(params: {
  supplierName: string;
  restaurantName: string;
  items: WhatsAppOrderItem[];
  estimatedTotalBs: number;
}): string {
  const lines = params.items.map(
    (item) => `• ${item.ingredientName}: ${formatQuantity(item.quantity, item.unit)}`
  );

  return [
    `Hola ${params.supplierName}, te envío el pedido de ${params.restaurantName}:`,
    "",
    ...lines,
    "",
    `Total estimado: ${formatBs(params.estimatedTotalBs)}. Gracias.`,
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("591") ? digits : `591${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
