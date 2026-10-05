"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { products, type ProductCategory } from "@/data/products";
import { formatPeso } from "@/lib/order";
import { useOrder } from "@/context/order-context";
import { ProductDialog } from "@/components/product-dialog";

const categories = ["All", "Bread", "Pastries", "Cakes"] as const;
type CategoryFilter = (typeof categories)[number];

export function MenuCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const { hydrated, storageAvailable } = useOrder();
  const visibleProducts = useMemo(
    () =>
      selectedCategory === "All"
        ? products
        : products.filter((product) => product.category === (selectedCategory as ProductCategory)),
    [selectedCategory],
  );

  return (
    <main id="main" className="menu-page">
      <header className="menu-header">
        <h1>Good things, baked daily.</h1>
        <p>Browse the bakery case and choose a little something for your table.</p>
      </header>

      <div className="menu-toolbar">
        <div className="category-filters" role="group" aria-label="Filter products by category">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-filter${selectedCategory === category ? " is-active" : ""}`}
              type="button"
              aria-pressed={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="menu-result-count" aria-live="polite">
          {visibleProducts.length} {visibleProducts.length === 1 ? "treat" : "treats"}
        </p>
      </div>

      <section className="product-grid" aria-label={`${selectedCategory} bakery products`}>
        {visibleProducts.map((product, index) => (
          <ProductDialog key={`${selectedCategory}-${product.id}`} product={product}>
            <button className="product-card menu-product-enter" style={{ "--card-delay": `${Math.min(index, 5) * 45}ms` } as CSSProperties} type="button" aria-label={`View ${product.name} details`}>
              <div className="product-card-image">
                <Image src={product.image} alt="" fill priority={index === 0} sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
              </div>
              <div className="product-card-body">
                <p className="product-card-category">{product.category}</p>
                <h2 className="product-card-name">{product.name}</h2>
                <span className="product-card-price">{formatPeso(product.price)}</span>
                <span className="product-card-unit">{product.unit}</span>
                <p className="product-card-description">{product.description}</p>
                <span className="product-card-action">Choose this treat <span aria-hidden="true">↗</span></span>
              </div>
            </button>
          </ProductDialog>
        ))}
      </section>
      <p className="menu-demo-note">
        {!hydrated
          ? "Getting your saved order ready…"
          : storageAvailable
            ? "Your order is saved in this browser for your next visit."
            : "Your order stays available while this page is open."}
      </p>
    </main>
  );
}
