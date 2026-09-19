"use client";

import { useCallback, useEffect, useRef } from "react";

const TICK_W = 12;
const SETTLE_MS = 130;

/**
 * Horizontally scrolling measuring-tape picker. The value is whatever tick sits
 * under the fixed centre line, so it snaps and flicks like a physical dial.
 *
 * Snapping is done in JS rather than with CSS scroll-snap: a mouse wheel and a
 * drag both have to drive this, and both mean writing `scrollLeft` directly,
 * which CSS mandatory snapping fights on every frame.
 */
export default function Ruler({
  min,
  max,
  value,
  onChange,
  majorEvery = 5,
  labelEvery = 10,
  label,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  majorEvery?: number;
  labelEvery?: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drag = useRef<{ x: number; left: number; id: number } | null>(null);
  const placed = useRef(false);

  // Latest value, for listeners that outlive a render.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const offsetOf = useCallback((v: number) => (v - min) * TICK_W, [min]);

  // Position on the incoming value once, before the user can scroll.
  useEffect(() => {
    const el = ref.current;
    if (!el || placed.current) return;
    el.scrollLeft = offsetOf(valueRef.current);
    placed.current = true;
  }, [offsetOf]);

  /** After scrolling stops, ease onto the exact tick. */
  const settle = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = ref.current;
      if (!el || drag.current) return;
      const target = offsetOf(valueRef.current);
      if (Math.abs(el.scrollLeft - target) < 1) return;
      el.scrollTo({ left: target, behavior: "smooth" });
    }, SETTLE_MS);
  }, [offsetOf]);

  function handleScroll() {
    const el = ref.current;
    if (!el) return;
    const next = Math.min(max, Math.max(min, min + Math.round(el.scrollLeft / TICK_W)));
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
      navigator.vibrate?.(3);
    }
    settle();
  }

  // A vertical mouse wheel does not scroll a horizontal overflow on its own, so
  // map whichever axis the device gave us onto the tape. Non-passive: we cancel
  // the page scroll the wheel would otherwise cause.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      el!.scrollLeft += delta;
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Click-and-drag to scrub. Touch is left to native momentum scrolling.
  function onPointerDown(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    drag.current = { x: e.clientX, left: el.scrollLeft, id: e.pointerId };
    el.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    const el = ref.current;
    const d = drag.current;
    if (!el || !d || e.pointerId !== d.id) return;
    el.scrollLeft = d.left - (e.clientX - d.x);
  }
  function onPointerUp(e: React.PointerEvent) {
    const el = ref.current;
    const d = drag.current;
    if (!el || !d || e.pointerId !== d.id) return;
    drag.current = null;
    el.releasePointerCapture?.(e.pointerId);
    el.scrollTo({ left: offsetOf(valueRef.current), behavior: "smooth" });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = Math.min(max, Math.max(min, valueRef.current + step * (e.shiftKey ? 10 : 1)));
    ref.current?.scrollTo({ left: offsetOf(next), behavior: "smooth" });
  }

  const ticks = [];
  for (let v = min; v <= max; v++) ticks.push(v);

  return (
    <div className="relative select-none">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onScroll={handleScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="no-scrollbar flex overflow-x-auto overscroll-x-contain py-1 cursor-ew-resize outline-none focus-visible:ring-1 focus-visible:ring-accent/40 rounded-lg"
        style={{ scrollbarWidth: "none", touchAction: "pan-x" }}
      >
        <div className="shrink-0" style={{ width: `calc(50% - ${TICK_W / 2}px)` }} />
        {ticks.map((v) => {
          const major = v % majorEvery === 0;
          const labelled = v % labelEvery === 0;
          return (
            <div
              key={v}
              className="relative shrink-0 h-[74px]"
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
