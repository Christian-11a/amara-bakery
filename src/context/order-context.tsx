"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { productById } from "@/data/products";
import {
  addOrderItem,
  calculateOrderCount,
  calculateOrderTotal,
  parsePersistedOrder,
  removeOrderItem,
  setOrderItemQuantity,
  type OrderLine,
} from "@/lib/order";

const STORAGE_KEY = "amara-bakery-order-v1";
const STORAGE_WARNING = "Your order is available for this visit, but this browser could not save it for later.";

type OrderState = {
  items: OrderLine[];
  completed: boolean;
  notice: string | null;
  hydrated: boolean;
  storageAvailable: boolean;
};

const serverState: OrderState = {
  items: [],
  completed: false,
  notice: null,
  hydrated: false,
  storageAvailable: true,
};

let state = serverState;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function hydrate() {
  if (state.hydrated) return;
  try {
    const saved = parsePersistedOrder(window.localStorage.getItem(STORAGE_KEY));
    state = {
      ...state,
      items: saved.items,
      completed: saved.completed,
      hydrated: true,
    };
    persistState();
  } catch {
    state = {
      ...state,
      hydrated: true,
      storageAvailable: false,
      notice: STORAGE_WARNING,
    };
  }
  notify();
}

function persistState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ version: 1, items: state.items, completed: state.completed }),
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrate();
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return serverState;
}

type OrderAction =
  | { type: "add"; productId: string; quantity: number }
  | { type: "quantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "finish" }
  | { type: "dismiss-notice" };

function reduceOrder(current: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "add": {
      const product = productById.get(action.productId);
      if (!product) return current;
      const result = addOrderItem(current.items, action.productId, action.quantity);
      return {
        ...current,
        items: result.items,
        completed: false,
        notice: result.capped
          ? `You can add up to 20 ${product.name} units.`
          : `${product.name} added to your order.`,
      };
    }
    case "quantity": {
      const result = setOrderItemQuantity(current.items, action.productId, action.quantity);
      if (result.items === current.items) return current;
      const product = productById.get(action.productId);
      return {
        ...current,
        items: result.items,
        completed: false,
        notice: result.capped && product ? `You can add up to 20 ${product.name} units.` : null,
      };
    }
    case "remove": {
      const items = removeOrderItem(current.items, action.productId);
      if (items.length === current.items.length) return current;
      return { ...current, items, completed: false, notice: null };
    }
    case "clear":
      return { ...current, items: [], completed: false, notice: "Your order has been cleared." };
    case "finish":
      if (current.items.length === 0) return current;
      return {
        ...current,
        completed: true,
        notice: "Demo order complete. No payment or real order was submitted.",
      };
    case "dismiss-notice":
      return { ...current, notice: null };
  }
}

function dispatchOrder(action: OrderAction) {
  const nextState = reduceOrder(state, action);
  if (nextState === state) return;
  state = nextState;
  notify();

  const persistsOrder = action.type === "add" || action.type === "quantity" || action.type === "remove" || action.type === "clear" || action.type === "finish";
  if (!state.hydrated || !persistsOrder) return;
  try {
    persistState();
    if (!state.storageAvailable) {
      state = { ...state, storageAvailable: true };
      notify();
    }
  } catch {
    state = { ...state, storageAvailable: false, notice: STORAGE_WARNING };
    notify();
  }
}

export type OrderContextValue = {
  items: OrderLine[];
  count: number;
  total: number;
  hydrated: boolean;
  storageAvailable: boolean;
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearOrder: () => void;
  completed: boolean;
  finishOrder: () => void;
  notice: string | null;
  dismissNotice: () => void;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    const message = snapshot.notice;
    if (!message || message === STORAGE_WARNING || message.startsWith("You can add up to")) return;
    const timer = window.setTimeout(() => dispatchOrder({ type: "dismiss-notice" }), 5000);
    return () => window.clearTimeout(timer);
  }, [snapshot.notice]);
  const value = useMemo<OrderContextValue>(
    () => ({
      items: snapshot.items,
      count: calculateOrderCount(snapshot.items),
      total: calculateOrderTotal(snapshot.items),
      hydrated: snapshot.hydrated,
      storageAvailable: snapshot.storageAvailable,
      addItem: (productId, quantity) => dispatchOrder({ type: "add", productId, quantity }),
      setQuantity: (productId, quantity) => dispatchOrder({ type: "quantity", productId, quantity }),
      removeItem: (productId) => dispatchOrder({ type: "remove", productId }),
      clearOrder: () => dispatchOrder({ type: "clear" }),
      completed: snapshot.completed,
      finishOrder: () => dispatchOrder({ type: "finish" }),
      notice: snapshot.notice,
      dismissNotice: () => dispatchOrder({ type: "dismiss-notice" }),
    }),
    [snapshot],
  );

  return (
    <OrderContext.Provider value={value}>
      {children}
      {snapshot.notice && (
        <div className="order-notice order-toast" role="status" aria-live="polite" aria-atomic="true">
          <p>{snapshot.notice}</p>
          <button
            className="notice-dismiss"
            type="button"
            onClick={() => dispatchOrder({ type: "dismiss-notice" })}
            aria-label="Dismiss notice"
          >
            ×
          </button>
        </div>
      )}
    </OrderContext.Provider>
  );
}

export function useOrder(): OrderContextValue {
  const value = useContext(OrderContext);
  if (!value) throw new Error("useOrder must be used within an OrderProvider");
  return value;
}
