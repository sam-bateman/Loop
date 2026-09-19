"use client";

import { useEffect, useRef } from "react";

const TICK_W = 12;

/**
 * Horizontally scrolling measuring-tape picker. The value is whatever tick sits
 * under the fixed centre line, so it snaps and flicks like a physical dial.
 */
export default function Ruler({
  min,
  max,
  value,
  onChange,
  majorEvery = 5,
  labelEvery = 10,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  majorEvery?: number;
  labelEvery?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settled = useRef(false);

  // Position on the incoming value once, before the user can scroll.
  useEffect(() => {
    const el = ref.current;
    if (!el || settled.current) return;
    el.scrollLeft = (value - min) * TICK_W;
    settled.current = true;
  }, [value, min]);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / TICK_W);
    const next = Math.min(max, Math.max(min, min + idx));
    if (next !== value) {
      onChange(next);
      navigator.vibrate?.(3);
    }
  }

  const ticks = [];
  for (let v = min; v <= max; v++) ticks.push(v);

  return (
    <div className="relative select-none">
      <div
        ref={ref}
        onScroll={handleScroll}
        className="no-scrollbar flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain py-1"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="shrink-0" style={{ width: `calc(50% - ${TICK_W / 2}px)` }} />
        {ticks.map((v) => {
          const major = v % majorEvery === 0;
          const labelled = v % labelEvery === 0;
          return (
            <div
              key={v}
              className="relative shrink-0 snap-center h-[74px]"
              style={{ width: TICK_W }}
            >
              <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-px rounded-full ${
                  major ? "h-10 bg-text/45" : "h-5 bg-text/18"
                }`}
              />
              {labelled && (
                <span className="num absolute bottom-1 left-1/2 -translate-x-1/2 text-[11px] text-faint">
                  {v}
                </span>
              )}
            </div>
          );
        })}
        <div className="shrink-0" style={{ width: `calc(50% - ${TICK_W / 2}px)` }} />
      </div>

      {/* Centre line — the read head */}
      <div className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 w-[2px] h-11 rounded-full bg-accent" />
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-2 h-1.5 rounded-b-full bg-accent" />

      {/* Fade the tape out at both ends */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg to-transparent" />
    </div>
  );
}
