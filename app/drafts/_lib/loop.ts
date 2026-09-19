/**
 * Shared data + geometry for the landing-page drafts.
 *
 * UI_SPEC.md §12 asks for the centrepiece to be "one React component with a
 * pure (ScoredDay, Baseline) → geometry function, unit-testable without
 * rendering." That function is `organismGeometry` below; the component in
 * _components/Organism.tsx only renders what this returns.
 *
 * Every rate quoted in SAMPLE_RATES comes from METHODOLOGY-WHOOP.md §2 as
 * implemented in lib/scoring.ts — NOT from DESIGN_SPEC.md §1's headline
 * figures, which are the undiscounted study numbers. See app/drafts/page.tsx.
 */

// ─── Formatting ────────────────────────────────────────────────────────────

/** UI_SPEC §5: "always signed and always human-readable. `+2h 14m`, never `134`." */
export function formatMinutes(mins: number): { sign: string; value: string } {
  const sign = mins < 0 ? "−" : "+"; // U+2212 MINUS SIGN, not a hyphen
  const abs = Math.abs(Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return { sign, value: h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m` };
}

export function formatCompact(mins: number): string {
  const { sign, value } = formatMinutes(mins);
  return `${sign}${value}`;
}

// ─── The sample day ────────────────────────────────────────────────────────

export type BandKey = "sleep" | "movement" | "intake" | "recovery";

export type Band = {
  key: BandKey;
  label: string;
  minutes: number;
  /** UI_SPEC §7: an absent layer renders visibly missing, never as a zero. */
  absent?: boolean;
  absentReason?: string;
};

export type LedgerEntry = {
  hour: number;
  time: string;
  what: string;
  detail: string;
  minutes: number;
  band: BandKey;
  cite: string;
  href: string;
  guarded?: boolean;
};

/**
 * One demonstration day, labelled as demonstration data everywhere it renders.
 * DESIGN_SPEC.md §11 forbids phrasing any of this as a prediction about the
 * person reading it.
 *
 * These are NOT hand-picked marketing numbers. Every value below is the output
 * of lib/scoring.ts run over a fixture WHOOP payload — 8h 12m of sleep at 92%
 * consistency, RHR 54, HRV 11% over baseline, 45 minutes at zone 2+, age 34.
 * That is a good day by this engine's standards, and it scores +53 minutes.
 *
 * README.md's whole warning is that Liv's science.html drifted out of sync with
 * Liv's own code. A landing page quoting a number the engine cannot produce is
 * that same drift, on the most public surface there is.
 */
export const SAMPLE_LEDGER: LedgerEntry[] = [
  {
    hour: 7, time: "07:04",
    what: "Sleep duration",
    detail: "8h 12m \u2014 1.4h above the 6.8h population average",
    minutes: 12, band: "sleep",
    cite: "Cappuccio 2010, Sleep \u00b7 16 cohorts, n=1,382,999",
    href: "/methodology",
  },
  {
    hour: 7, time: "07:04",
    what: "Sleep consistency",
    detail: "92% \u2014 regularity predicts mortality more strongly than duration",
    minutes: 18, band: "sleep",
    cite: "Windred 2024, Sleep \u00b7 UK Biobank, n=60,977",
    href: "/methodology",
  },
  {
    hour: 8, time: "08:02",
    what: "Resting heart rate",
    detail: "54 bpm \u2014 6 below the 60 bpm reference",
    minutes: 3, band: "recovery", guarded: true,
    cite: "Zhang 2016, CMAJ \u00b7 46 cohorts, n=1,246,203",
    href: "/methodology",
  },
  {
    hour: 8, time: "08:02",
    what: "Heart rate variability",
    detail: "78 ms \u2014 11% over your 30-day baseline",
    minutes: 5, band: "recovery",
    cite: "Hillebrand 2013, Europace \u00b7 the model\u2019s weakest factor, and flagged as such",
    href: "/methodology",
  },
  {
    hour: 18, time: "18:21",
    what: "Cardiovascular activity",
    detail: "45 min at zone 2+ \u2014 tapered past 30 min, capped at +60",
    minutes: 15, band: "movement",
    cite: "Wen 2011, Lancet \u00b7 n=416,175",
    href: "/methodology",
  },
];

/** The §4 and §5 modifiers the engine actually applied to this day. */
export const SAMPLE_MODIFIERS = [
  {
    label: "Age band 30\u201339",
    value: "\u00d70.92",
    note: "The same day buys less remaining life later in life.",
    cite: "Fadnes 2022, PLOS Medicine",
    tone: "normal" as const,
  },
  {
    label: "RHR bonus halved",
    value: "\u00d70.50",
    note: "Already credited for activity today. A low resting heart rate is largely a consequence of training \u2014 counting both would count the same evidence twice.",
    cite: "METHODOLOGY-WHOOP \u00a74, guard 3",
    tone: "guard" as const,
  },
];

const BAND_LABELS: Record<BandKey, string> = {
  sleep: "Sleep",
  movement: "Movement",
  intake: "Intake",
  recovery: "Recovery",
};

/**
 * Band totals are derived from the ledger, so the legend and the hero number
 * cannot drift. Intake is ABSENT rather than zero: the nutrition tier is not
 * built (SCOPE.md §5, still open), and a band reading 0 would claim the user
 * ate nothing worth scoring.
 */
export const SAMPLE_BANDS: Band[] = (
  ["sleep", "movement", "recovery", "intake"] as const
).map((key) => {
  const minutes = SAMPLE_LEDGER.filter((e) => e.band === key).reduce((a, e) => a + e.minutes, 0);
  return key === "intake"
    ? {
        key,
        label: BAND_LABELS[key],
        minutes: 0,
        absent: true,
        absentReason: "Nutrition tier not connected",
      }
    : { key, label: BAND_LABELS[key], minutes };
});

/** +53m for this fixture. Derived, never written down twice. */
export const SAMPLE_TOTAL = SAMPLE_BANDS.reduce((a, b) => a + b.minutes, 0);

/**
 * summarize() in lib/scoring.ts annualises as perDay × 365 / 1440.
 * At +53 min/day that is +13.4 days of life a year.
 */
export const SAMPLE_ANNUAL_DAYS = (SAMPLE_TOTAL * 365) / 1440;

export const SAMPLE_RHR = 54;

/** Per-hour net minutes, hour 0 → 23. */
export const SAMPLE_HOURS: number[] = Array.from({ length: 24 }, (_, h) =>
  SAMPLE_LEDGER.filter((e) => e.hour === h).reduce((a, e) => a + e.minutes, 0),
);

/**
 * WHOOP reports a handful of readings per day, not an event every hour, so a
 * spec-faithful 24-spine corona is mostly ticks. That is the honest picture of
 * a WHOOP-only product and it is left honest here. See app/drafts/page.tsx,
 * decision 3.
 */
export const SAMPLE_ABSENT_FROM = 24;

// ─── Geometry (UI_SPEC §7) ─────────────────────────────────────────────────

const CENTRE = 220;

/** Layer radii — UI_SPEC §7 master table. */
export const R = {
  core: 54,
  genomeRim: 72,
  /* UI_SPEC §7 puts the bands at r=86. At the spec's own sizes that ring sits
     directly under the hero number: "+53m" at --t-number-lg is ~150 CSS px
     wide inside a 342px render, which is wider than an r=86 circle. §13.2
     flags the number's size as an open question; the collision is the reason.
     Moved to 100, which still reads as the innermost ring of the corona and
     clears a length-scaled number. */
  bands: 100,
  neutral: 148,
  coronaMax: 196,
  coronaMin: 100,
  membrane: 204,
} as const;

const SPINE_MAX_LEN = 48;
const SPINE_CLAMP_MIN = 240;
const BAND_GAP_DEG = 4;

export function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CENTRE + r * Math.cos(rad), CENTRE + r * Math.sin(rad)];
}

export type Spine = {
  hour: number;
  x1: number; y1: number; x2: number; y2: number;
  tone: "credit" | "debit" | "zero" | "absent";
  minutes: number;
  /** Stroke length in user units, for the §8 draw-on animation. */
  len: number;
};

export type BandArc = {
  key: BandKey;
  d: string;
  tone: "credit" | "debit" | "absent";
  minutes: number;
  /** Arc length in user units, for the §8 draw-on animation. */
  len: number;
};

export type OrganismGeometry = {
  spines: Spine[];
  bands: BandArc[];
  coreRadius: number;
  ariaLabel: string;
};

/**
 * Pure. Takes a day's scored output, returns everything the SVG needs.
 *
 * UI_SPEC §7: spine length is sqrt-scaled because a +170-minute workout next
 * to a −18-minute snack would otherwise produce a 10:1 ratio and make every
 * small hour invisible.
 */
export function organismGeometry(
  hours: number[],
  bands: Band[],
  opts: {
    absentFrom?: number;
    baselineDeltaYears?: number;
    /**
     * The magnitude that earns a full-length spine. UI_SPEC §7 assumes 240,
     * which suits per-meal events. A WHOOP-only day never approaches it, so a
     * corona of daily totals needs a scale that matches what the engine emits.
     */
    clampAt?: number;
  } = {},
): OrganismGeometry {
  const absentFrom = opts.absentFrom ?? 24;
  const clampAt = opts.clampAt ?? SPINE_CLAMP_MIN;

  const spines: Spine[] = hours.map((minutes, hour) => {
    const angle = -90 + (hour * 360) / hours.length;
    const absent = hour >= absentFrom;

    if (absent || minutes === 0) {
      // A 2-unit tick on the neutral ring. Absence is not zero (§2 principle 4)
      // — the two are distinguished by opacity at render, not by geometry.
      const [x1, y1] = polar(R.neutral - 1, angle);
      const [x2, y2] = polar(R.neutral + 1, angle);
      return { hour, x1, y1, x2, y2, tone: absent ? "absent" : "zero", minutes: 0, len: 2 };
    }

    const magnitude = Math.min(Math.abs(minutes), clampAt);
    const length = SPINE_MAX_LEN * Math.sqrt(magnitude / clampAt);
    const outward = minutes > 0;
    const [x1, y1] = polar(R.neutral, angle);
    const [x2, y2] = polar(outward ? R.neutral + length : R.neutral - length, angle);
    return { hour, x1, y1, x2, y2, tone: outward ? "credit" : "debit", minutes, len: length };
  });

  // An absent band still occupies the ring — §2 principle 4: absence is not
  // zero, so it must be visible as a gap rather than collapse to no arc at all.
  const presentAbs = bands
    .filter((b) => !b.absent)
    .reduce((a, b) => a + Math.abs(b.minutes), 0);
  const absentCount = bands.filter((b) => b.absent).length;
  const ABSENT_SHARE = 0.28; // of the present total, per absent band
  const weight = (b: Band) => (b.absent ? presentAbs * ABSENT_SHARE : Math.abs(b.minutes));
  const totalWeight = presentAbs * (1 + absentCount * ABSENT_SHARE) || 1;
  const available = 360 - bands.length * BAND_GAP_DEG;
  let cursor = -90 + BAND_GAP_DEG / 2;

  const arcs: BandArc[] = bands.map((b) => {
    const sweep = (weight(b) / totalWeight) * available;
    const start = cursor;
    const end = cursor + sweep;
    cursor = end + BAND_GAP_DEG;
    const [x1, y1] = polar(R.bands, start);
    const [x2, y2] = polar(R.bands, end);
    const largeArc = sweep > 180 ? 1 : 0;
    return {
      key: b.key,
      d: `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R.bands} ${R.bands} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      tone: b.absent ? "absent" : b.minutes >= 0 ? "credit" : "debit",
      minutes: b.minutes,
      len: (sweep * Math.PI * R.bands) / 180,
    };
  });

  // UI_SPEC §7: the core never shrinks on a bad day — it is bound to baseline
  // life expectancy, which a single evening does not move.
  const delta = opts.baselineDeltaYears ?? 0;
  const coreRadius = R.core + Math.max(-10, Math.min(10, delta * 2));

  // §11: the SVG is decorative to AT; this label carries the meaning in words.
  const total = bands.reduce((a, b) => a + b.minutes, 0);
  const ariaLabel =
    `Sample day: ${formatCompact(total)} of life expectancy. ` +
    bands
      .map((b) =>
        b.absent
          ? `${b.label}: no data, ${(b.absentReason ?? "not connected").toLowerCase()}`
          : `${b.label} ${formatCompact(b.minutes)}`,
      )
      .join(", ") + ".";

  return { spines, bands: arcs, coreRadius, ariaLabel };
}

/**
 * The membrane (§7 layer ④): a closed path sampled every 5°, radius displaced
 * by noise, amplitude bound to 7-day volatility.
 *
 * The spec suggests simplex noise. A sum of harmonics in θ is used instead:
 * it is exactly periodic, so the curve closes with no seam, it needs no
 * dependency, and it is deterministic per seed — which §12 requires so a
 * user's membrane is stable across sessions.
 */
export function membranePath(amplitude: number, t: number, seed = 0): string {
  const N = 72;
  const pts: [number, number][] = [];
  for (let i = 0; i < N; i++) {
    const deg = (i / N) * 360;
    const th = (deg * Math.PI) / 180;
    const n =
      0.55 * Math.sin(3 * th + t * 1.0 + seed) +
      0.30 * Math.sin(5 * th - t * 0.7 + seed * 1.7) +
      0.15 * Math.sin(8 * th + t * 1.3 + seed * 2.3);
    pts.push(polar(R.membrane + n * amplitude, deg - 90));
  }
  return closedCatmullRom(pts);
}

/** Closed Catmull-Rom → cubic Bézier, per UI_SPEC §7 layer ④. */
function closedCatmullRom(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}

/** A = clamp(stdev(last 7 daily nets) / 90 × 12, 0, 12) — §7 layer ④. */
export function membraneAmplitude(last7: number[]): number {
  if (last7.length < 2) return 0;
  const mean = last7.reduce((a, b) => a + b, 0) / last7.length;
  const variance = last7.reduce((a, b) => a + (b - mean) ** 2, 0) / last7.length;
  return Math.max(0, Math.min(12, (Math.sqrt(variance) / 90) * 12));
}

/**
 * The last seven daily nets, on the same scale the engine actually produces.
 * Amplitude = stdev/90 × 12 ≈ 3.3 here, so the membrane reads as a calm,
 * near-circular boundary — §7's "consistent week" state.
 */
export const SAMPLE_LAST_7 = [53, 41, -12, 66, 58, 22, 53];

/**
 * Illustrative only — what the same day would look like with the nutrition
 * tier connected, so the two ring densities can be compared side by side on
 * the drafts index. Intake values follow METHODOLOGY.md §2's per-serving rates;
 * nothing here is produced by lib/scoring.ts, which is WHOOP-only today.
 */
export const ILLUSTRATIVE_FULL_BANDS: Band[] = [
  { key: "sleep", label: "Sleep", minutes: 30 },
  { key: "movement", label: "Movement", minutes: 15 },
  { key: "recovery", label: "Recovery", minutes: 8 },
  { key: "intake", label: "Intake", minutes: -15 },
];

export const ILLUSTRATIVE_FULL_HOURS: number[] = Array.from({ length: 24 }, (_, h) =>
  ({ 7: 30, 8: 14, 9: -4, 12: -34, 13: 8, 18: 15, 19: 12, 21: -3 } as Record<number, number>)[h] ?? 0,
);


/**
 * The corona, re-cut as one spine per day rather than one per hour.
 *
 * UI_SPEC §7 draws 24 hourly spines, which assumes roughly hourly events — the
 * shape of a food-logging product. WHOOP emits a handful of readings a day, so
 * an hourly corona on real data is three spines and twenty-one ticks (compare
 * the two rings on /drafts). Twenty-four days of daily nets fills the same ring
 * with data the shipped engine genuinely produces, and it lines up with the
 * membrane, which is already a multi-day measure.
 *
 * Values are on lib/scoring.ts's real scale: a strong day is around +53, a bad
 * one around −30.
 */
export const SAMPLE_24_DAYS = [
  18, 41, -8, 53, 36, -22, 47, 12, 58, 29, -14, 44,
  51, 7, -30, 39, 62, 24, -6, 48, 33, 16, -19, 53,
];

/** Daily nets rarely exceed 90 minutes, so that is a full-length spine. */
export const DAY_SPINE_CLAMP = 90;
