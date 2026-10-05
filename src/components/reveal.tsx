"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useMotion } from "@/context/motion-context";

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const { motionEnabled } = useMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const belowViewport = rect.top > window.innerHeight;

    if (!motionEnabled) {
      if (!belowViewport) seen.current = true;
      element.dataset.reveal = "visible";
      return;
    }

    if (seen.current || !belowViewport) {
      seen.current = true;
      element.dataset.reveal = "visible";
      return;
    }

    if (!("IntersectionObserver" in window)) {
      seen.current = true;
      element.dataset.reveal = "visible";
      return;
    }

    element.style.setProperty("--reveal-delay", `${delay}ms`);
    element.dataset.reveal = "ready";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      seen.current = true;
      element.dataset.reveal = "visible";
      observer.disconnect();
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, motionEnabled]);

  return <div ref={ref} className={className} data-reveal-wrapper>{children}</div>;
}
