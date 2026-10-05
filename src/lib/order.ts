import { productById } from "@/data/products";

export const MAX_QUANTITY = 20;

export type OrderLine = {
  productId: string;
  quantity: number;
};

export type SavedOrder = {
  items: OrderLine[];
  completed: boolean;
};

export type AddOrderItemResult = {
  items: OrderLine[];
  capped: boolean;
};

export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)));
}

export function addOrderItem(
  items: OrderLine[],
  productId: string,
  quantity: number,
): AddOrderItemResult {
  if (!productById.has(productId)) return { items, capped: false };

  const requested = clampQuantity(quantity);
  const requestedOverLimit = Number.isFinite(quantity) && quantity > MAX_QUANTITY;
  const existing = items.find((item) => item.productId === productId);
  if (!existing) {
    return {
      items: [...items, { productId, quantity: requested }],
      capped: requestedOverLimit,
    };
  }

  const combined = existing.quantity + requested;
  const nextQuantity = Math.min(MAX_QUANTITY, combined);
  return {
    items: items.map((item) =>
      item.productId === productId ? { ...item, quantity: nextQuantity } : item,
    ),
    capped: requestedOverLimit || combined > MAX_QUANTITY,
  };
}

export function setOrderItemQuantity(
  items: OrderLine[],
  productId: string,
  quantity: number,
): { items: OrderLine[]; capped: boolean } {
  const existing = items.find((item) => item.productId === productId);
  if (!existing) return { items, capped: false };

  const safeQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  const nextQuantity = clampQuantity(safeQuantity);
  return {
    items: items.map((item) =>
      item.productId === productId ? { ...item, quantity: nextQuantity } : item,
    ),
    capped: safeQuantity > MAX_QUANTITY,
  };
}

export function removeOrderItem(items: OrderLine[], productId: string): OrderLine[] {
  return items.filter((item) => item.productId !== productId);
}

export function calculateOrderCount(items: OrderLine[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function calculateOrderTotal(items: OrderLine[]): number {
  return items.reduce((total, item) => {
    const product = productById.get(item.productId);
    return product ? total + product.price * item.quantity : total;
  }, 0);
}

export function normalizeSavedOrder(value: unknown): OrderLine[] {
  if (!Array.isArray(value)) return [];

  const normalized: OrderLine[] = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    const productId = record.productId;
    const quantity = record.quantity;
    if (
      typeof productId !== "string" ||
      !productById.has(productId) ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      continue;
    }

    const existing = normalized.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + quantity);
    } else {
      normalized.push({ productId, quantity: Math.min(MAX_QUANTITY, quantity) });
    }
  }
  return normalized;
}

export function parseSavedOrder(raw: string | null): OrderLine[] {
  if (!raw) return [];
  try {
    return normalizeSavedOrder(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function parsePersistedOrder(raw: string | null): SavedOrder {
  if (!raw) return { items: [], completed: false };
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) {
      return { items: normalizeSavedOrder(value), completed: false };
    }
    if (!value || typeof value !== "object") {
      return { items: [], completed: false };
    }
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || !Array.isArray(record.items)) {
      return { items: [], completed: false };
    }
    const items = normalizeSavedOrder(record.items);
    return {
      items,
      completed: record.completed === true && items.length > 0,
    };
  } catch {
    return { items: [], completed: false };
  }
}

export const formatPeso = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
