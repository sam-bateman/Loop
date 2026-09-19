"use client";

import { useEffect, useState } from "react";

export type MotionBudget = {
  /** Safe to run the background shader — everything except reduced-motion. */
  ambient: boolean;
  /** Safe to run the draggable glass lens — needs a real cursor and room. */
  lens: boolean;
};

const NONE: MotionBudget = { ambient: false, lens: false };

/**
 * The landing runs three WebGL surfaces, none of which carry information — they
 * are atmosphere. So each is gated here rather than shipped unconditionally,
 * and everything starts off: the first paint is headline and CTA only, with the
 * decoration fading in once the browser tells us it can afford it.
 */
export function useMotionBudget(): MotionBudget {
  const [budget, setBudget] = useState<MotionBudget>(NONE);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");

    function evaluate() {
      const ambient = !reduced.matches;
      // A drag-to-magnify lens has nothing to hover on a touch screen, and it
      // clones the DOM it refracts — too expensive to hand a phone.
      setBudget({ ambient, lens: ambient && !coarse.matches && window.innerWidth >= 1024 });
    }

    evaluate();
    reduced.addEventListener("change", evaluate);
    coarse.addEventListener("change", evaluate);
    window.addEventListener("resize", evaluate);
    return () => {
      reduced.removeEventListener("change", evaluate);
      coarse.removeEventListener("change", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  return budget;
}
