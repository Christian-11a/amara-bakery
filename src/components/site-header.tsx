"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useEffect, useRef } from "react";
import { useOrder } from "@/context/order-context";
import { useMotion } from "@/context/motion-context";

function OrderLabel({ mobile = false }: { mobile?: boolean }) {
  const { count, hydrated } = useOrder();
  const { motionEnabled } = useMotion();
  const shownCount = hydrated ? count : 0;
  const countRef = useRef<HTMLSpanElement>(null);
  const previous = useRef({ count, hydrated });

  useEffect(() => {
    const before = previous.current;
    if (
      hydrated &&
      before.hydrated &&
      count > before.count &&
      motionEnabled
    ) {
      const node = countRef.current;
      if (node) {
        node.classList.add("site-header__order-count--added");
      }
    }
    previous.current = { count, hydrated };
  }, [count, hydrated, motionEnabled]);

  return (
    <>
      <ShoppingBag size={18} strokeWidth={1.5} aria-hidden="true" />
      <span>{mobile ? "Order" : "Your order"}</span>
      <span
        key={shownCount}
        ref={countRef}
        className="site-header__order-count"
        aria-hidden="true"
        onAnimationEnd={(event) => event.currentTarget.classList.remove("site-header__order-count--added")}
      >
        {shownCount}
      </span>
      <span className="sr-only">, {shownCount} {shownCount === 1 ? "item" : "items"}</span>
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { count, hydrated } = useOrder();
  const { motionEnabled } = useMotion();
  const pendingStoryFocus = useRef(false);
  const shownCount = hydrated ? count : 0;
  const homeActive = pathname === "/";
  const menuActive = pathname.startsWith("/menu");
  const orderActive = pathname.startsWith("/order");

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href="/" aria-label="Amara Bakery home">
          <span className="brand-wordmark">Amara<span className="brand-subtitle">Bakery</span></span>
        </Link>

        <div className="site-header__desktop">
          <nav className="site-nav" aria-label="Main navigation">
            <Link className={`site-nav__link${homeActive ? " site-nav__link--active" : ""}`} aria-current={homeActive ? "page" : undefined} href="/">Home</Link>
            <Link className={`site-nav__link${menuActive ? " site-nav__link--active" : ""}`} aria-current={menuActive ? "page" : undefined} href="/menu">Menu</Link>
            {homeActive ? (
              <a className="site-nav__link" href="#story">Our story</a>
            ) : (
              <Link className="site-nav__link" href="/#story">Our story</Link>
            )}
          </nav>
          <Link className="site-header__order" href="/order" aria-current={orderActive ? "page" : undefined} aria-label={`Your order, ${shownCount} ${shownCount === 1 ? "item" : "items"}`}>
            <OrderLabel />
          </Link>
        </div>

        <div className="site-header__mobile">
          <Link className="site-header__order" href="/order" aria-current={orderActive ? "page" : undefined} aria-label={`Your order, ${shownCount} ${shownCount === 1 ? "item" : "items"}`}>
            <OrderLabel mobile />
          </Link>
          <Dialog.Root>
            <Dialog.Trigger className="site-menu-trigger" aria-label="Open navigation menu">
              <span className="site-menu-trigger__icon" aria-hidden="true" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="site-header__drawer-overlay" />
              <Dialog.Content className="site-header__drawer" onCloseAutoFocus={(event) => {
                if (!pendingStoryFocus.current) return;
                event.preventDefault();
                pendingStoryFocus.current = false;
                requestAnimationFrame(() => {
                  const story = document.getElementById("story");
                  const heading = story?.querySelector<HTMLElement>("h2");
                  heading?.setAttribute("tabindex", "-1");
                  heading?.focus({ preventScroll: true });
                  story?.scrollIntoView({ behavior: motionEnabled ? "smooth" : "instant", block: "start" });
                });
              }}>
                <div className="site-header__drawer-top">
                  <Dialog.Title className="site-header__drawer-title">Where to?</Dialog.Title>
                  <Dialog.Close className="site-header__drawer-close" aria-label="Close navigation menu">×</Dialog.Close>
                </div>
                <nav className="site-header__drawer-nav" aria-label="Mobile navigation">
                  <Dialog.Close asChild>
                    <Link className="site-header__drawer-link" href="/" aria-current={homeActive ? "page" : undefined}>Home <span aria-hidden="true">↗</span></Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link className="site-header__drawer-link" href="/menu" aria-current={menuActive ? "page" : undefined}>Menu <span aria-hidden="true">↗</span></Link>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    {homeActive ? (
                      <a className="site-header__drawer-link" href="#story" onClick={() => { pendingStoryFocus.current = true; }}>Our story <span aria-hidden="true">↗</span></a>
                    ) : (
                      // Native fragment navigation survives the modal's focus restoration across routes.
                      // eslint-disable-next-line @next/next/no-html-link-for-pages
                      <a className="site-header__drawer-link" href="/#story">Our story <span aria-hidden="true">↗</span></a>
                    )}
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <Link className="site-header__drawer-link" href="/order" aria-current={orderActive ? "page" : undefined}>
                      Your order <span>{shownCount} {shownCount === 1 ? "item" : "items"}</span>
                    </Link>
                  </Dialog.Close>
                </nav>
                <Dialog.Description className="site-header__drawer-note">
                  A little warmth, whenever you need it.
                </Dialog.Description>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
