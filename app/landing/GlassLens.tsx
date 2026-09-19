"use client";

import { useEffect, useRef } from "react";
import type { LiquidGlass as LiquidGlassClass } from "liquid-glass-js";

const HEIGHT = 116;

/**
 * A draggable glass lens the reader can pull across the signals table.
 *
 * liquid-glass-js does real optical displacement rather than a blur fake: it
 * clones the element you point it at and runs an SVG displacement map over the
 * clone, so a convex bezel actually magnifies. Cloning is also why `targetId`
 * must name a plain DOM subtree — a WebGL canvas clones as a blank canvas, so
 * the lens is aimed at the table, never at the gradient behind it.
 *
 * The lens is `position: fixed`, which is what makes it draggable anywhere but
 * also means it does not travel with the page. So it is built when the target
 * scrolls into view, kept parked over the target while the reader scrolls, and
 * released to stay wherever they put it the moment they first drag it.
 *
 * The module itself is imported at runtime: it registers a custom element and
 * touches `document` on import, so it cannot be part of the server bundle.
 */
export default function GlassLens({ targetId }: { targetId: string }) {
  const glassRef = useRef<LiquidGlassClass | null>(null);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    let live = true;
    let parked = true;
    let building = false;

    /** Centre of the target, in viewport coordinates, clamped on screen. */
    function restingPlace(width: number) {
      const box = target!.getBoundingClientRect();
      const y = box.top + box.height * 0.42 - HEIGHT / 2;
      return {
        x: Math.round(box.left + (box.width - width) / 2),
        y: Math.round(Math.min(Math.max(y, 16), window.innerHeight - HEIGHT - 16)),
      };
    }

    function reposition() {
      const glass = glassRef.current;
      if (!glass || !parked) return;
      const { x, y } = restingPlace(glass.get("width"));
      glass.moveTo(x, y);
    }

    function build() {
      if (!live || glassRef.current || building || !target) return;
      building = true;

      import("liquid-glass-js").then(({ default: LiquidGlass }) => {
        if (!live || glassRef.current) return;
        const width = Math.round(Math.min(560, target.getBoundingClientRect().width * 0.78));
        const { x, y } = restingPlace(width);

        const glass = new LiquidGlass({
          background: target,
          width,
          height: HEIGHT,
          radius: 32,
          // Enough refraction to read as glass, not so much that the numbers
          // underneath stop being legible — this sits over real content.
          scale: 40,
          depth: 58,
          curvature: 2.2,
          convexity: 1,
          chroma: 0.08,
          blur: 0,
          glow: 0.3,
          edge: 0.5,
          specAngle: 130,
          tint: 0.02,
          tintColor: "#40f830",
          zIndex: 40,
          x,
          y,
        });

        // The first drag is the reader taking ownership of the lens; stop
        // parking it over the table from then on.
        document
          .querySelector(".lqg-glass")
          ?.addEventListener("pointerdown", () => (parked = false), { once: true });

        glassRef.current = glass;
      });
    }

    function teardown() {
      glassRef.current?.destroy();
      glassRef.current = null;
      building = false;
      parked = true;
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? build() : teardown()),
      { threshold: 0.3 }
    );
    observer.observe(target);
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition);

    return () => {
      live = false;
      observer.disconnect();
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
      teardown();
    };
  }, [targetId]);

  return null;
}
