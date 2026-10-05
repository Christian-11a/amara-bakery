"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useMotion } from "@/context/motion-context";
import { MotionToggle } from "@/components/motion-toggle";
import { Reveal } from "@/components/reveal";
import "./baking-story.css";

const stages = [
  {
    id: "flour",
    title: "Flour",
    copy: "A quiet beginning: a little flour, a bowl, and room to make something warm.",
    image: "/images/baking-flour.png",
    alt: "Fine flour scattered across a wooden bakery work surface.",
  },
  {
    id: "dough",
    title: "Dough",
    copy: "Water and hands bring everything together, fold by fold, until it feels just right.",
    image: "/images/baking-dough.png",
    alt: "Soft bread dough being folded by hand on a flour-dusted counter.",
  },
  {
    id: "oven",
    title: "Oven",
    copy: "A little patience, a little heat, and the edges turn golden as the room fills with warmth.",
    image: "/images/baking-oven.png",
    alt: "Golden rolls baking inside a warmly lit oven.",
  },
  {
    id: "shared-table",
    title: "Shared table",
    copy: "Then the first piece is broken open, with a place left at the table for someone else.",
    image: "/images/story.png",
    alt: "A tray of golden rolls set on a quiet bakery worktable.",
  },
] as const;

export function BakingStory() {
  const storyRef = useRef<HTMLElement>(null);
  const { motionEnabled } = useMotion();

  useEffect(() => {
    const story = storyRef.current;
    if (!story || !motionEnabled) return;

    const desktop = window.matchMedia("(min-width: 900px)");
    let cancelled = false;
    let started = false;
    let revert: (() => void) | undefined;
    async function enhance() {
      if (!story || !desktop.matches || started) return;
      started = true;
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(min-width: 900px)", () => {
        const stageList = story.querySelector<HTMLOListElement>("[data-story-list]");
        const stageElements = Array.from(story.querySelectorAll<HTMLElement>("[data-story-stage]"));
        const imageFigures = Array.from(story.querySelectorAll<HTMLElement>("[data-story-image]"));
        const progressPath = story.querySelector<SVGPathElement>("[data-story-progress]");
        if (!stageList || !progressPath || stageElements.length !== imageFigures.length || stageElements.length === 0) {
          return;
        }

        story.dataset.enhanced = "true";

        const markCurrent = (index: number) => {
          stageElements.forEach((element, stageIndex) => {
            if (stageIndex === index) {
              element.setAttribute("aria-current", "step");
              element.dataset.active = "true";
            } else {
              element.removeAttribute("aria-current");
              delete element.dataset.active;
            }
          });
          imageFigures.forEach((element, imageIndex) => {
            if (imageIndex === index) {
              element.setAttribute("aria-current", "step");
              element.removeAttribute("aria-hidden");
            } else {
              element.removeAttribute("aria-current");
              element.setAttribute("aria-hidden", "true");
            }
          });
        };

        const showStage = (index: number, animate = true) => {
          markCurrent(index);
          imageFigures.forEach((element, imageIndex) => {
            gsap.to(element, {
              autoAlpha: imageIndex === index ? 1 : 0,
              duration: animate ? 0.42 : 0,
              ease: "power1.out",
              overwrite: "auto",
            });
          });
        };

        showStage(0, false);
        gsap.set(progressPath, { strokeDasharray: 1, strokeDashoffset: 1 });

        stageElements.forEach((stage, index) => {
          ScrollTrigger.create({
            trigger: stage,
            start: "top center",
            end: "bottom center",
            onEnter: () => showStage(index),
            onEnterBack: () => showStage(index),
          });
        });

        const staticFigures = Array.from(story.querySelectorAll<HTMLElement>("[data-story-static-image]"));
        staticFigures.forEach((figure) => figure.setAttribute("aria-hidden", "true"));
        const visualGallery = story.querySelector<HTMLElement>("[data-story-visual]");
        visualGallery?.removeAttribute("aria-hidden");

        ScrollTrigger.create({
          trigger: stageList,
          start: "top center",
          end: "bottom center",
          onUpdate: (trigger) => {
            gsap.set(progressPath, { strokeDashoffset: 1 - trigger.progress });
          },
        });

        return () => {
          delete story.dataset.enhanced;
          stageElements.forEach((element) => {
            element.removeAttribute("aria-current");
            delete element.dataset.active;
          });
          imageFigures.forEach((element) => {
            element.removeAttribute("aria-current");
            element.setAttribute("aria-hidden", "true");
          });
          staticFigures.forEach((figure) => figure.removeAttribute("aria-hidden"));
          visualGallery?.setAttribute("aria-hidden", "true");
        };
      });

      revert = () => media.revert();
    }
    const onViewportChange = () => {
      if (desktop.matches) void enhance().catch(() => { started = false; });
    };
    desktop.addEventListener("change", onViewportChange);
    onViewportChange();
    return () => {
      cancelled = true;
      desktop.removeEventListener("change", onViewportChange);
      revert?.();
    };
  }, [motionEnabled]);

  return (
    <section
      ref={storyRef}
      id="story"
      className="baking-story"
      aria-labelledby="story-title"
    >
      <header className="baking-story__intro">
        <h2 id="story-title" className="baking-story__title">
          Made with time, then passed around.
        </h2>
        <p className="baking-story__lede">
          From a dusting of flour to the last crumb shared, good baking has a rhythm all its own.
        </p>
        <MotionToggle className="button-secondary baking-story__motion-toggle" enableOnly />
      </header>

      <div className="baking-story__layout">
        <div
          className="baking-story__visual"
          data-story-visual
          role="group"
          aria-label="Four moments in a bake"
          aria-hidden="true"
        >
          {stages.map((stage) => (
            <figure
              key={stage.id}
              className="baking-story__frame"
              data-story-image
              data-stage={stage.id}
              aria-label={stage.title}
            >
              <Image
                src={stage.image}
                alt={stage.alt}
                fill
                sizes="(min-width: 900px) 43vw, (min-width: 600px) 45vw, 100vw"
              />
            </figure>
          ))}
        </div>

        <div className="baking-story__stage-track">
          <svg
            className="baking-story__progress"
            viewBox="0 0 20 1000"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M10 0V1000"
              pathLength="1"
              data-story-progress
            />
          </svg>
          <ol className="baking-story__stages" data-story-list aria-label="How a bake comes together">
            {stages.map((stage, index) => (
              <li
                key={stage.id}
                className="baking-story__stage"
                data-story-stage
                data-stage={stage.id}
              >
                <span className="baking-story__marker" aria-hidden="true" />
                <Reveal className="baking-story__stage-reveal" delay={index * 70}>
                  <figure className="baking-story__inline-frame" data-story-static-image data-stage={stage.id}>
                    <Image
                      src={stage.image}
                      alt={stage.alt}
                      fill
                      sizes="(min-width: 900px) 36vw, (min-width: 600px) 44vw, 100vw"
                    />
                  </figure>
                </Reveal>
                <Reveal className="baking-story__stage-reveal" delay={index * 70 + 70}>
                  <div className="baking-story__stage-copy">
                    <p className="baking-story__step" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h3>{stage.title}</h3>
                    <p>{stage.copy}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
