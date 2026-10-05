import { describe, expect, it } from "vitest";
import {
  addOrderItem,
  calculateOrderCount,
  calculateOrderTotal,
  parsePersistedOrder,
  normalizeSavedOrder,
  parseSavedOrder,
} from "@/lib/order";

describe("order helpers", () => {
  it("calculates selling unit count and total in pesos", () => {
    const items = [
      { productId: "pandesal", quantity: 2 },
      { productId: "croissant", quantity: 3 },
    ];

    expect(calculateOrderCount(items)).toBe(5);
    expect(calculateOrderTotal(items)).toBe(375);
  });

  it("increments matching products and caps a line at twenty", () => {
    const starting = [{ productId: "pandesal", quantity: 18 }];
    const result = addOrderItem(starting, "pandesal", 5);

    expect(result.items).toEqual([{ productId: "pandesal", quantity: 20 }]);
    expect(result.capped).toBe(true);
    const newLine = addOrderItem([], "croissant", 24);
    expect(newLine.items).toEqual([{ productId: "croissant", quantity: 20 }]);
    expect(newLine.capped).toBe(true);
  });

  it("recovers malformed and invalid saved order data", () => {
    expect(parseSavedOrder("{bad json")).toEqual([]);
    expect(
      normalizeSavedOrder([
        { productId: "pandesal", quantity: 2 },
        { productId: "pandesal", quantity: 30 },
        { productId: "not-a-product", quantity: 1 },
        { productId: "croissant", quantity: 0 },
        { productId: "vanilla-cake", quantity: 1.5 },
      ]),
    ).toEqual([{ productId: "pandesal", quantity: 20 }]);
    expect(parseSavedOrder("[]")).toEqual([]);
  });

  it("reads legacy arrays and only restores completion for valid nonempty v1 orders", () => {
    expect(parsePersistedOrder(JSON.stringify([{ productId: "pandesal", quantity: 1 }]))).toEqual({
      items: [{ productId: "pandesal", quantity: 1 }],
      completed: false,
    });
    expect(parsePersistedOrder(JSON.stringify({
      version: 1,
      items: [{ productId: "croissant", quantity: 2 }],
      completed: true,
    }))).toEqual({
      items: [{ productId: "croissant", quantity: 2 }],
      completed: true,
    });
    expect(parsePersistedOrder(JSON.stringify({
      version: 1,
      items: [],
      completed: true,
    })).completed).toBe(false);
    expect(parsePersistedOrder(JSON.stringify({
      version: 1,
      items: [{ productId: "croissant", quantity: 1 }],
      completed: "true",
    })).completed).toBe(false);
  });
});
