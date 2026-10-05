"use client";

import Image from "next/image";
import Link from "next/link";
import { BakingStory } from "@/components/baking-story";
import { MotionToggle } from "@/components/motion-toggle";
import { OvenMark } from "@/components/ornaments";
import { ProductDialog } from "@/components/product-dialog";
import { Reveal } from "@/components/reveal";
import { products, type Product } from "@/data/products";
import { formatPeso } from "@/lib/order";

const featuredIds = ["pandesal", "croissant", "chocolate-cake"];
const featuredProducts = featuredIds
  .map((id) => products.find((product) => product.id === id))
  .filter((product): product is Product => Boolean(product));

function FeaturedProduct({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <div className="product-card-image">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 64rem) 27vw, (min-width: 42rem) 30vw, 100vw"
        />
      </div>
      <div className="product-card-body">
        <p className="product-card-category">{product.category}</p>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-price">{formatPeso(product.price)}</p>
        <p className="product-card-unit">{product.unit}</p>
        <p className="product-card-description">{product.description}</p>
        <div className="product-card-action">
          <ProductDialog product={product}>
            <button className="text-link" type="button" aria-label={`View ${product.name}`}>
              View this bake <span aria-hidden="true">↗</span>
            </button>
          </ProductDialog>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <main id="main" className="site-shell">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="eyebrow">Good bread brightens days</p>
          <h1 id="hero-title" className="display">
            <span className="hero-title-line">A little warmth,</span>{" "}
            <span className="hero-title-line">fresh from the oven.</span>
          </h1>
          <p className="hero__lede">
            Familiar breads, buttery pastries, and the kind of small treat that makes an ordinary day feel cared for.
          </p>
          <div className="hero__actions">
            <Link className="button-primary" href="/menu">Explore the menu <span aria-hidden="true">↗</span></Link>
            <a className="text-link" href="#visit">Plan a visit</a>
          </div>
          <MotionToggle className="motion-toggle-inline" enableOnly />
        </div>
        <figure className="hero__visual">
          <Image
            src="/images/hero-v2.png"
            alt="Freshly baked bread and pastries gathered on a linen-covered table"
            fill
            priority
            sizes="100vw"
          />
        </figure>
      </section>

      <section className="section featured-section" aria-labelledby="featured-title">
        <header className="section__head">
          <div className="section__head-copy">
            <p className="featured-label">From our counter</p>
            <h2 id="featured-title" className="section__title">Good things, made fresh.</h2>
            <p className="section__lede">A small selection from the counter, ready to share or keep for yourself.</p>
          </div>
          <Link className="text-link" href="/menu">See the full menu <span aria-hidden="true">↗</span></Link>
        </header>
        <div className="product-grid">
          {featuredProducts.map((product, index) => <Reveal key={product.id} delay={index * 130}><FeaturedProduct product={product} /></Reveal>)}
        </div>
      </section>

      <BakingStory />

      <section id="visit" className="section visit-section" aria-labelledby="visit-title">
        <Reveal className="visit__copy">
          <h2 id="visit-title" className="visit__title">There’s always room for one more.</h2>
          <p className="section__lede">Step in for a warm loaf, stay a little while, or take something lovely home.</p>
          <div className="hero__actions">
            <Link className="button-secondary" href="/menu">Browse the menu</Link>
          </div>
        </Reveal>
        <Reveal className="visit__details" delay={140}>
          <div className="visit__panel-head">
            <p className="visit__fictional-note">Fictional location and sample hours for this demo.</p>
            <OvenMark className="visit__oven" />
          </div>
          <div className="visit__detail">
            <h3 className="visit__label">Fictional location</h3>
            <address className="visit__value">18 Alder Lane<br />Juniper Hill, Manila</address>
          </div>
          <div className="visit__detail">
            <h3 className="visit__label">Sample hours</h3>
            <p className="visit__value">Tuesday–Sunday<br />7:00 am–3:00 pm</p>
          </div>
          <div className="visit__detail">
            <h3 className="visit__label">A little note</h3>
            <p className="visit__value">The counter closes when the day’s bakes are gone.</p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
