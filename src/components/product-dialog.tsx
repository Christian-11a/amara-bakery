"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { formatPeso } from "@/lib/order";
import { useOrder } from "@/context/order-context";

export function ProductDialog({ product, children }: { product: Product; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useOrder();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setQuantity(1);
  }

  function handleAdd() {
    addItem(product.id, quantity);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="product-dialog-overlay" />
        <Dialog.Content className="product-dialog-content" aria-describedby={`product-description-${product.id}`}>
          <Dialog.Close asChild>
            <button className="product-dialog-close" type="button" aria-label="Close product details">
              <X aria-hidden="true" size={20} />
            </button>
          </Dialog.Close>
          <div className="product-dialog-image">
            <Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 90vw, 520px" />
          </div>
          <div className="product-dialog-body">
            <Dialog.Title className="product-dialog-title">{product.name}</Dialog.Title>
            <p className="product-card-category">{product.category}</p>
            <p className="product-dialog-description" id={`product-description-${product.id}`}>
              {product.description}
            </p>
            <p className="product-dialog-price">
              <span>{formatPeso(product.price)}</span>
              <span className="product-card-unit">{product.unit}</span>
            </p>
            <div className="product-dialog-quantity">
              <span id={`product-quantity-label-${product.id}`}>Quantity</span>
              <div className="quantity-control" aria-labelledby={`product-quantity-label-${product.id}`}>
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${product.name}`}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus aria-hidden="true" size={16} />
                </button>
                <output aria-live="polite" aria-atomic="true">{quantity}</output>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${product.name}`}
                  onClick={() => setQuantity((current) => Math.min(20, current + 1))}
                  disabled={quantity >= 20}
                >
                  <Plus aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
            <p className="product-dialog-line-total">
              <span>Line total</span>
              <strong>{formatPeso(product.price * quantity)}</strong>
            </p>
            <div className="product-dialog-actions">
              <Dialog.Close asChild>
                <button className="button-secondary" type="button">Keep browsing</button>
              </Dialog.Close>
              <button className="button-primary" type="button" onClick={handleAdd}>
                Add to order · {formatPeso(product.price * quantity)}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
