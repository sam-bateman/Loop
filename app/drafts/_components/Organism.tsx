"use client";

import { useEffect, useRef, useState } from "react";
import {
  R,
  organismGeometry,
  membranePath,
  membraneAmplitude,
  type Band,
} from "../_lib/loop";

/**
 * The centrepiece — UI_SPEC.md §7.
 *
 * Four concentric layers, hand-authored SVG, no charting library. The hero
 * number is NOT an SVG <text>: callers position it over the optical centre as
 * HTML so it gets real tabular-nums, proper font loading, and selectable text.
 */
export default function Organism({
  hours,
  bands,
  size = 342,
  rhr = 54,
  last7,
  genomeRim = "absent",
  absentFrom = 24,
  baselineDeltaYears = 0,
  clampAt,
  className = "",
}: {
  hours: number[];
  bands: Band[];
  size?: number;
  rhr?: number;
  last7?: number[];
  /** "absent" renders no rim at all — §7 requires the layer to be visibly
   *  missing rather than greyed. "soft" is the low-confidence PRS state. */
  genomeRim?: "absent" | "defined" | "soft";
  absentFrom?: number;
  baselineDeltaYears?: number;
  /** Magnitude that earns a full-length spine — 240 for events, 90 for days. */
  clampAt?: number;
  className?: string;
}) {
  const geo = organismGeometry(hours, bands, { absentFrom, baselineDeltaYears, clampAt });
  const amplitude = last7 ? membraneAmplitude(last7) : 0;
  const uid = useRef(`org-${Math.random().toString(36).slice(2, 8)}`).current;

  // §7 layer ④ — the noise seed advances at 0.06 units/second, "slow enough
  // that the movement is felt rather than watched".
  const [t, setT] = useState(0);
  useEffect(() => {
    if (amplitude === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const started = performance.now();
    const tick = (now: number) => {
      setT(((now - started) / 1000) * 0.06);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [amplitude]);

  // §7 layer ④ — the stroke shifts toward --neutral as amplitude approaches max.
  const agitation = Math.min(1, amplitude / 12);

  return (
    <svg
      viewBox="0 0 440 440"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={geo.ariaLabel}
      style={{ ["--rhr" as string]: rhr, overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`${uid}-core`}>
          <stop offset="0%" stopColor="var(--bone)" stopOpacity="0.06" />
          <stop offset="70%" stopColor="var(--bone)" stopOpacity="0.02" />
          <stop offset="100%" stopColor="var(--bone)" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* ④ Membrane — 7-day volatility. Calm circle = consistent week. */}
      {last7 && (
        <path
          d={membranePath(amplitude, t)}
          fill="none"
          strokeWidth={1.5}
          stroke={agitation > 0.6 ? "var(--neutral)" : "var(--hairline)"}
          strokeOpacity={0.35 + agitation * 0.45}
        />
      )}

      {/* ① Corona — the zero line, then 24 hourly spines clockwise from midnight */}
      <circle
        cx={220}
        cy={220}
        r={R.neutral}
        fill="none"
        stroke="var(--dust)"
        strokeWidth={0.75}
        strokeOpacity={0.4}
      />

      <g strokeLinecap="round">
        {geo.spines.map((s) => {
          const isTick = s.tone === "zero" || s.tone === "absent";
          return (
            <line
              key={s.hour}
              className={
                "spine" +
                (s.tone === "credit" ? " glow-credit" : s.tone === "debit" ? " glow-debit" : "")
              }
              x1={s.x1}
              y1={s.y1}
              x2={s.x2}
              y2={s.y2}
              stroke={
                s.tone === "credit"
                  ? "var(--credit)"
                  : s.tone === "debit"
                    ? "var(--debit)"
                    : "var(--dust)"
              }
              strokeWidth={isTick ? 2 : 3}
              /* §7: absent renders visibly hollow at 40% — never a neutral
                 segment, because a gap in the data must not read as a day of
                 perfect behaviour. */
              strokeOpacity={s.tone === "absent" ? 0.4 : 1}
              /* Dash length is set here in USER UNITS, not via pathLength:
                 Chrome does not apply pathLength normalisation to a CSS-declared
                 stroke-dasharray, so `stroke-dasharray: 1` in the stylesheet
                 renders a 1px dotted hairline instead of a solid stroke. */
              style={{
                strokeDasharray: s.len,
                strokeDashoffset: s.len,
                animationDelay: `${s.hour * 18}ms`,
              }}
            />
          );
        })}
      </g>

      {/* ② Bands — four factor arcs. The only layer with no glow: bands are
          structure, not emission, and glow here would muddy the spines. */}
      <g fill="none" strokeLinecap="butt">
        {geo.bands.map((b) =>
          /* §9.9 — an absent band is a hairline outline at 40%, never a grey
             filled block. A band reading zero would claim the user did nothing
             worth scoring; this says the data is missing. */
          b.tone === "absent" ? (
            <path
              key={b.key}
              className="band"
              d={b.d}
              stroke="var(--dust)"
              strokeWidth={1}
              strokeOpacity={0.4}
              style={{ strokeDasharray: b.len, strokeDashoffset: b.len }}
            />
          ) : (
            <path
              key={b.key}
              className="band"
              d={b.d}
              stroke={b.tone === "credit" ? "var(--credit)" : "var(--debit)"}
              strokeWidth={9}
              strokeOpacity={0.55}
              style={{ strokeDasharray: b.len, strokeDashoffset: b.len }}
            />
          ),
        )}
      </g>

      {/* ③ Core — the still centre. Bound to baseline, never to today, so a
          bad evening never renders the user's body as degrading. */}
      <g className="organism-core">
        <circle cx={220} cy={220} r={geo.coreRadius} fill={`url(#${uid}-core)`} />
        <circle
          cx={220}
          cy={220}
          r={geo.coreRadius}
          fill="none"
          stroke="var(--bone)"
          strokeOpacity={0.12}
          strokeWidth={1}
        />
        {genomeRim !== "absent" && (
          <circle
            cx={220}
            cy={220}
            r={R.genomeRim}
            fill="none"
            stroke="var(--genome)"
            strokeWidth={genomeRim === "soft" ? 4 : 2.5}
            strokeOpacity={genomeRim === "soft" ? 0.5 : 0.85}
            filter={genomeRim === "soft" ? `url(#${uid}-blur)` : undefined}
          />
        )}
      </g>
    </svg>
  );
}
