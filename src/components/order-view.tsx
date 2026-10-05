"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, RotateCcw, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { productById } from "@/data/products";
import { MAX_QUANTITY, formatPeso, type OrderLine } from "@/lib/order";
import { useOrder } from "@/context/order-context";

export function OrderView() {
  const {
    items,
    count,
    total,
    hydrated,
    storageAvailable,
    setQuantity,
    removeItem,
    addItem,
    clearOrder,
    completed,
    finishOrder,
  } = useOrder();
  const [undoItem, setUndoItem] = useState<OrderLine | null>(null);
  const orderedProducts = items.flatMap((item) => {
    const product = productById.get(item.productId);
    return product ? [{ ...item, product }] : [];
  });

  function handleRemove(item: OrderLine) {
    removeItem(item.productId);
    setUndoItem(item);
  }

  function handleUndo() {
    if (!undoItem) return;
    addItem(undoItem.productId, undoItem.quantity);
    setUndoItem(null);
  }

  return (
    <main id="main" className="order-page" aria-busy={!hydrated}>
      <header className="order-header">
        <h1>Your order</h1>
        <p>Take a moment to make it yours.</p>
      </header>

      {hydrated && undoItem && (
        <div className="order-notice order-undo-notice" role="status" aria-live="polite">
          <p>Item removed from your order.</p>
          <button className="undo-button" type="button" onClick={handleUndo}>
            <RotateCcw aria-hidden="true" size={15} /> Undo
          </button>
        </div>
      )}

      {!hydrated ? (
        <div className="order-loading" role="status">Loading your saved order…</div>
      ) : orderedProducts.length === 0 ? (
        <section className="order-empty">
          <ShoppingBag aria-hidden="true" size={32} />
          <h2>Your order is empty</h2>
          <p>There are fresh favorites waiting in the bakery case.</p>
          <Link className="button-primary" href="/menu">Browse the menu</Link>
        </section>
      ) : (
        <div className="order-layout">
          <section className="order-list" aria-label="Items in your order">
            {orderedProducts.map(({ product, quantity }) => (
              <article className="order-item" key={product.id}>
                <div className="order-item-image">
                  <Image src={product.image} alt="" fill sizes="112px" />
                </div>
                <div className="order-item-details">
                  <p className="product-card-category">{product.category}</p>
                  <h2>{product.name}</h2>
                  <p className="order-item-unit">{product.unit} · {formatPeso(product.price)} each</p>
                  <div className="order-item-controls">
                    <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${product.name}`}
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(product.id, quantity - 1)}
                      >
                        <Minus aria-hidden="true" size={15} />
                      </button>
                      <output aria-live="polite" aria-atomic="true">{quantity}</output>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${product.name}`}
                        disabled={quantity >= MAX_QUANTITY}
                        onClick={() => setQuantity(product.id, quantity + 1)}
                      >
                        <Plus aria-hidden="true" size={15} />
                      </button>
                    </div>
                    <button
                      className="order-remove-button"
                      type="button"
                      aria-label={`Remove ${product.name} from your order`}
                      onClick={() => handleRemove({ productId: product.id, quantity })}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
                <p className="order-item-line-total">{formatPeso(product.price * quantity)}</p>
              </article>
            ))}
          </section>

          <aside className="order-summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <dl>
              <div>
                <dt>{count} {count === 1 ? "unit" : "units"}</dt>
                <dd>{formatPeso(total)}</dd>
              </div>
              <div className="order-summary-total">
                <dt>Total</dt>
                <dd>{formatPeso(total)}</dd>
              </div>
            </dl>
            {completed ? (
              <div className="order-complete" role="status" aria-live="polite">
                <Check aria-hidden="true" size={20} />
                <div>
                  <h3>Order complete</h3>
                  <p>This demo order is complete. No payment or real order was submitted.</p>
                </div>
                <button className="button-secondary" type="button" onClick={clearOrder}>
                  Start a new order
                </button>
              </div>
            ) : (
              <button className="button-primary order-complete-button" type="button" onClick={finishOrder}>
                Complete demo order
              </button>
            )}
            {!storageAvailable && <p className="order-storage-note">Your order will stay available while this page is open.</p>}
            <p className="order-demo-note">
              This is a demo checkout. Prices are in Philippine pesos; there is no payment or real submission.
            </p>
            <Link className="text-link" href="/menu">Continue browsing</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
