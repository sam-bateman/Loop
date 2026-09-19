/**
 * Adapts lib/scoring.ts's output to what the screens render.
 *
 * The engine emits DayScore[] — factors with minutes, details, and the guards
 * and modifiers it applied as free-text notes. The UI needs bands, ledger
 * entries, a corona series and an attribution trace per factor. This file is
 * the only place that translation happens, so the screens never reinterpret a
 * score and lib/scoring.ts stays untouched.
 *
 * ⚠️ The traces here reconstruct the arithmetic by inverting the modifiers the
 * engine reports. That is exact, but it is reconstruction. The better fix is
 * for scoreDays() to emit the trace itself, so the receipt is a record rather
 * than a re-derivation — worth doing before this ships to anyone real.
 */

import type { DayScore, Factor } from "@/lib/scoring";
import type { Band, BandKey, LedgerDay, LedgerEntry, TraceRow } from "./fixtures";
import { DAY_SPINE_CLAMP } from "./fixtures";

/**
 * Every factor lib/scoring.ts can emit, with the band it belongs to and the
 * citation behind its rate. Labels are the engine's own, verbatim — if one is
 * renamed there, it falls through to `unknown` below rather than silently
 * scoring into the wrong band.
 */
const FACTOR_META: Record<
  string,
  { band: BandKey; rate: string; cite: string }
> = {
  "Sleep duration": {
    band: "sleep",
    rate: "+9 min per hour above 6.8h · −18 min per hour below",
    cite: "Cappuccio 2010, Sleep · 16 cohorts, n=1,382,999 · RR 1.12 short, 1.30 long",
  },
  "Sleep consistency": {
    band: "sleep",
    rate: "±25 min at the extremes, linear from a 65% reference",
    cite: "Windred 2024, Sleep · UK Biobank, n=60,977 · HR 1.53",
  },
  "Resting heart rate": {
    band: "recovery",
    rate: "−10 min per 5 bpm over 60 · +6 min per 5 bpm under",
    cite: "Zhang 2016, CMAJ · 46 cohorts, n=1,246,203 · HR 1.09 per 10 bpm",
  },
  "Heart rate variability": {
    band: "recovery",
    rate: "±5 min per 10% from your own baseline, clamped at ±20",
    cite: "Hillebrand 2013, Europace · the model's weakest factor, and flagged as such",
  },
  "Cardiovascular activity": {
    band: "movement",
    rate: "+6 min per 15 min at zone 2+, tapered, capped at +60/day",
    cite: "Wen 2011, Lancet · n=416,175 · discounted to ~7% of the paper's implied rate",
  },
  "Sedentary day": {
    band: "movement",
    rate: "flat −10 min below day strain 6",
    cite: "Ekelund 2016, Lancet · harmonised meta-analysis, >1,000,000 participants",
  },
};

const UNKNOWN = {
  band: "recovery" as BandKey,
  rate: "see the methodology",
  cite: "METHODOLOGY-WHOOP.md",
};

const meta = (label: string) => FACTOR_META[label] ?? UNKNOWN;

export const factorId = (date: string, label: string) =>
  `${date}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The engine reports its modifiers as notes; these pull the numbers back out. */
function ageMultiplierFrom(notes: string[]): number | null {
  const m = notes.find((n) => n.startsWith("Scaled ×"))?.match(/×([\d.]+)/);
  return m ? Number(m[1]) : null;
}
function imbalanceFrom(notes: string[]): string | null {
  return notes.find((n) => n.startsWith("Penalties ×")) ?? null;
}

const BAND_LABELS: Record<BandKey, string> = {
  sleep: "Sleep",
  movement: "Movement",
  intake: "Intake",
  recovery: "Recovery",
};

function timeOf(date: string, label: string): string {
  // WHOOP reports a day's factors as daily aggregates, not timestamped events.
  // Rather than invent a clock time, each factor carries the reading it comes
  // from: sleep and autonomic values land on waking, activity on the day.
  if (label.startsWith("Sleep")) return "sleep";
  if (label === "Cardiovascular activity" || label === "Sedentary day") return "day";
  return "wake";
}

export function toLedgerEntry(day: DayScore, f: Factor): LedgerEntry {
  const m = meta(f.label);
  return {
    hour: 0,
    time: timeOf(day.date, f.label),
    what: f.label,
    detail: f.detail,
    minutes: f.minutes,
    band: m.band,
    cite: m.cite,
    href: "/methodology",
    guarded: f.guarded,
  };
}

export function bandsFor(day: DayScore): Band[] {
  const keys: BandKey[] = ["sleep", "movement", "recovery"];
  const scored: Band[] = keys.map((key) => ({
    key,
    label: BAND_LABELS[key],
    minutes: day.factors
      .filter((f) => meta(f.label).band === key)
      .reduce((a, f) => a + f.minutes, 0),
  }));

  // Intake is absent, not zero — the nutrition tier is not built (SCOPE.md §5),
  // and a band reading 0 would claim the user ate nothing worth scoring.
  return [
    ...scored,
    {
      key: "intake",
      label: BAND_LABELS.intake,
      minutes: 0,
      absent: true,
      absentReason: "Nutrition tier not connected",
    },
  ];
}

/**
 * The §9.8 waterfall for one factor: the rate it was scored at, then each
 * modifier the engine reported for that day, then the net.
 */
export function traceFor(day: DayScore, f: Factor): TraceRow[] {
  const m = meta(f.label);
  const ageMult = ageMultiplierFrom(day.notes);
  const imbalance = imbalanceFrom(day.notes);
  const imbalanceApplies = Boolean(imbalance) && f.minutes < 0;

  // Invert the modifiers the engine applied in place to recover the pre-modifier
  // value. Exact, but a reconstruction — see the file header.
  let base = f.minutes;
  if (ageMult) base /= ageMult;
  if (imbalanceApplies) base /= 1.1;
  if (f.guarded) base *= 2;

  const rows: TraceRow[] = [
    // The rate, not the reading: the reading is already the screen's heading,
    // and repeating it reads as an arithmetic step that did not happen.
    { label: m.rate, value: Math.round(base), kind: "base", cite: m.cite },
  ];

  if (f.guarded) {
    rows.push({
      label: "Halved — the same evidence is already counted elsewhere today",
      value: "×0.50",
      kind: "guard",
      cite: "METHODOLOGY-WHOOP §4 · autonomic and training signals overlap",
    });
  }
  if (f.weak) {
    rows.push({
      label: "Flagged as weak evidence",
      value: "see §5",
      kind: "clamp",
      cite: "No cohort study links this signal to lifespan",
    });
  }
  if (imbalanceApplies) {
    rows.push({
      label: "Penalties raised — 7-day strain is running ahead of recovery",
      value: "×1.10",
      kind: "clamp",
      cite: "METHODOLOGY-WHOOP §5 · heuristic only, no mortality evidence",
    });
  }
  if (ageMult && ageMult !== 1) {
    rows.push({
      label: "Age band",
      value: `×${ageMult}`,
      kind: "mult",
      cite: "Fadnes 2022, PLOS Medicine · the same day buys less remaining life later in life",
    });
  }

  return rows;
}

export type LoopView = {
  today: DayScore | null;
  /** The engine's own output, kept so /explain can rebuild a factor's trace. */
  rawDays: DayScore[];
  bands: Band[];
  total: number;
  ledger: LedgerDay[];
  /** One net per day, newest last, for the corona. */
  coronaDays: number[];
  /** The last 7 nets, for the membrane's volatility amplitude. */
  last7: number[];
  rhr: number;
  annualDays: number;
};

const dayLabel = (date: string, i: number) => {
  if (i === 0) return "Today";
  if (i === 1) return "Yesterday";
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
};

/** Newest first, as lib/scoring.ts returns them. */
export function toView(days: DayScore[]): LoopView {
  const scored = days.filter((d) => d.factors.length > 0);
  const today = days[0] ?? null;

  const ledger: LedgerDay[] = days.map((d, i) => ({
    date: d.date,
    label: dayLabel(d.date, i),
    minutes: d.minutes,
    entries: d.factors.map((f) => toLedgerEntry(d, f)),
  }));

  // The corona reads clockwise from oldest to newest, so the most recent day
  // sits at the top of the ring.
  const coronaDays = days.slice(0, 24).map((d) => d.minutes).reverse();
  const last7 = scored.slice(0, 7).map((d) => d.minutes);
  const perDay = scored.length
    ? scored.reduce((a, d) => a + d.minutes, 0) / scored.length
    : 0;

  return {
    today,
    rawDays: days,
    bands: today ? bandsFor(today) : [],
    total: today?.minutes ?? 0,
    ledger,
    coronaDays,
    last7,
    rhr: today?.rhr ?? 60,
    annualDays: (perDay * 365) / 1440,
  };
}

export { DAY_SPINE_CLAMP };


/**
 * The trace for a ledger entry with no DayScore behind it — demonstration data.
 * Uses the same FACTOR_META as the live path so the two never disagree about a
 * rate or a citation, and inverts the one modifier the entry does record.
 */
export function traceForEntry(entry: LedgerEntry): TraceRow[] {
  const m = meta(entry.what);
  const base = entry.guarded ? entry.minutes * 2 : entry.minutes;

  const rows: TraceRow[] = [
    { label: m.rate, value: Math.round(base), kind: "base", cite: m.cite },
  ];
  if (entry.guarded) {
    rows.push({
      label: "Halved — the same evidence is already counted elsewhere today",
      value: "×0.50",
      kind: "guard",
      cite: "METHODOLOGY-WHOOP §4 · autonomic and training signals overlap",
    });
  }
  return rows;
}
