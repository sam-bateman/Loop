/**
 * Loop's microlife scoring engine.
 *
 * Every rate, reference, taper and guard in this file is documented and cited in
 * METHODOLOGY-WHOOP.md. If you change a number here, change it there too — Liv's
 * science.html drifted out of sync with its own code and we are not repeating that.
 *
 * 1 microlife = 30 minutes. Scores are minutes of life expectancy, relative to the
 * population-average adult (not to an ideal), per Spiegelhalter 2012.
 */

import type { Recovery, Sleep, Workout, WhoopData } from "./whoop";

// ---- References (METHODOLOGY-WHOOP.md §1) ----
const REF_SLEEP_H = 6.8;        // Sheehan 2019, NHIS US adult mean
const SLEEP_BENEFIT_CAP_H = 8.5;
const LONG_SLEEP_H = 9.0;
const REF_RHR = 60;             // NHANES adult mean
const RHR_FLOOR = 45;           // no credit below this
const REF_CONSISTENCY = 65;     // WHOOP population midpoint

// ---- Rates (METHODOLOGY-WHOOP.md §2) ----
const SLEEP_SURPLUS_PER_H = 9;      // Cappuccio 2010, positive arm
const SLEEP_DEFICIT_PER_H = -18;    // Cappuccio 2010, RR 1.12
const LONG_SLEEP_PER_H = -10;       // Cappuccio 2010, RR 1.30
const CONSISTENCY_MAX = 25;         // Windred 2024, discounted from ±60
const RHR_PENALTY_PER_5 = -10;      // Zhang 2016, HR 1.09/10bpm
const RHR_BONUS_PER_5 = 6;
const HRV_PER_10PCT = 5;            // Hillebrand 2013
const HRV_CAP = 20;
const ACTIVITY_PER_BLOCK = 6;       // Wen 2011, 15-min blocks
const ACTIVITY_CAP = 60;
const SEDENTARY_PENALTY = -10;      // Ekelund 2016
const SEDENTARY_STRAIN = 6;

// Wen 2011 dose-response taper, per 15-minute block
const ACTIVITY_WEIGHTS = [1.0, 1.0, 0.7, 0.5, 0.3, 0.2];

// Strain-recovery imbalance (METHODOLOGY-WHOOP.md §5) — heuristic, no mortality evidence
const IMBALANCE_MULTIPLIER = 1.1;
const IMBALANCE_STRAIN = 14;
const IMBALANCE_RECOVERY = 40;

export type Factor = {
  label: string;
  minutes: number;
  detail: string;
  /** true when this factor's magnitude was reduced by a §4 double-counting guard */
  guarded?: boolean;
  /** true when the factor rests on weak or absent mortality evidence */
  weak?: boolean;
};

export type DayScore = {
  date: string;
  minutes: number;
  factors: Factor[];
  notes: string[];
  strain: number | null;
  recovery: number | null;
  sleepHours: number | null;
  rhr: number | null;
  hrv: number | null;
};

const round = (n: number) => Math.round(n);

/** Age multiplier — Fadnes 2022, carried over from METHODOLOGY.md §5. */
export function ageMultiplier(age?: number): number {
  if (age === undefined) return 1;
  if (age < 30) return 1.0;
  if (age < 40) return 0.92;
  if (age < 50) return 0.85;
  if (age < 60) return 0.78;
  if (age < 70) return 0.7;
  if (age < 80) return 0.5;
  return 0.3;
}

function sleepDurationFactor(hours: number): Factor {
  if (hours > LONG_SLEEP_H) {
    const over = hours - LONG_SLEEP_H;
    const surplus = (SLEEP_BENEFIT_CAP_H - REF_SLEEP_H) * SLEEP_SURPLUS_PER_H;
    return {
      label: "Sleep duration",
      minutes: surplus + over * LONG_SLEEP_PER_H,
      detail: `${hours.toFixed(1)}h — past the 9h mark, where the J-curve turns back down`,
    };
  }
  if (hours >= REF_SLEEP_H) {
    const credited = Math.min(hours, SLEEP_BENEFIT_CAP_H) - REF_SLEEP_H;
    return {
      label: "Sleep duration",
      minutes: credited * SLEEP_SURPLUS_PER_H,
      detail: `${hours.toFixed(1)}h — ${credited > 0 ? `${credited.toFixed(1)}h above the ${REF_SLEEP_H}h population average` : "at the population average"}`,
    };
  }
  const deficit = REF_SLEEP_H - hours;
  return {
    label: "Sleep duration",
    minutes: deficit * SLEEP_DEFICIT_PER_H,
    detail: `${hours.toFixed(1)}h — ${deficit.toFixed(1)}h below the ${REF_SLEEP_H}h population average`,
  };
}

function consistencyFactor(pct: number): Factor {
  const raw = ((pct - REF_CONSISTENCY) / 35) * CONSISTENCY_MAX;
  const minutes = Math.max(-CONSISTENCY_MAX, Math.min(CONSISTENCY_MAX, raw));
  return {
    label: "Sleep consistency",
    minutes,
    detail: `${Math.round(pct)}% — regularity predicts mortality more strongly than duration`,
  };
}

function rhrFactor(rhr: number, hasActivityBonus: boolean): Factor {
  if (rhr > REF_RHR) {
    return {
      label: "Resting heart rate",
      minutes: ((rhr - REF_RHR) / 5) * RHR_PENALTY_PER_5,
      detail: `${Math.round(rhr)} bpm — ${Math.round(rhr - REF_RHR)} above the ${REF_RHR} bpm reference`,
    };
  }
  const credited = REF_RHR - Math.max(rhr, RHR_FLOOR);
  // §4 guard 3: low RHR is largely a consequence of training, already credited below
  const guard = hasActivityBonus ? 0.5 : 1;
  return {
    label: "Resting heart rate",
    minutes: (credited / 5) * RHR_BONUS_PER_5 * guard,
    detail: `${Math.round(rhr)} bpm — ${Math.round(credited)} below the ${REF_RHR} bpm reference`,
    guarded: hasActivityBonus,
  };
}

function hrvFactor(hrv: number, baseline: number, rhrNegative: boolean): Factor {
  const deltaPct = ((hrv - baseline) / baseline) * 100;
  const raw = (deltaPct / 10) * HRV_PER_10PCT;
  // §4 guard 1: HRV and RHR are both autonomic and largely redundant
  const guard = rhrNegative && raw < 0 ? 0.5 : 1;
  const minutes = Math.max(-HRV_CAP, Math.min(HRV_CAP, raw)) * guard;
  return {
    label: "Heart rate variability",
    minutes,
    detail: `${Math.round(hrv)} ms — ${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(0)}% vs your 30-day baseline`,
    guarded: guard < 1,
    weak: true,
  };
}

/** Minutes at zone 2 and above, from WHOOP workout zone durations. */
function moderateMinutes(workouts: Workout[]): number {
  let ms = 0;
  for (const w of workouts) {
    const z = w.score?.zone_durations;
    if (!z) continue;
    ms += z.zone_two_milli + z.zone_three_milli + z.zone_four_milli + z.zone_five_milli;
  }
  return ms / 60_000;
}

function activityFactor(minutes: number): Factor {
  const blocks = minutes / 15;
  let credited = 0;
  for (let i = 0; i < ACTIVITY_WEIGHTS.length; i++) {
    const take = Math.max(0, Math.min(1, blocks - i));
    if (take === 0) break;
    credited += take * ACTIVITY_WEIGHTS[i];
  }
  const total = Math.min(credited * ACTIVITY_PER_BLOCK, ACTIVITY_CAP);
  return {
    label: "Cardiovascular activity",
    minutes: total,
    detail: `${Math.round(minutes)} min at zone 2+ — tapered past 30 min, capped at +${ACTIVITY_CAP}`,
  };
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export type ScoreOptions = { age?: number };

export function scoreDays(data: WhoopData, opts: ScoreOptions = {}): DayScore[] {
  const { cycles, recoveries, sleeps, workouts } = data;

  const recoveryByCycle = new Map<number, Recovery>();
  for (const r of recoveries) recoveryByCycle.set(r.cycle_id, r);

  // 30-day personal HRV baseline (METHODOLOGY-WHOOP.md §2.4)
  const hrvs = recoveries
    .map((r) => r.score?.hrv_rmssd_milli)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const hrvBaseline = hrvs.length ? hrvs.reduce((a, b) => a + b, 0) / hrvs.length : null;

  // 7-day means for the strain-recovery imbalance modifier (§5)
  const recent = cycles.slice(0, 7);
  const strains = recent.map((c) => c.score?.strain).filter((v): v is number => v != null);
  const recScores = recent
    .map((c) => recoveryByCycle.get(c.id)?.score?.recovery_score)
    .filter((v): v is number => v != null);
  const meanStrain = strains.length ? strains.reduce((a, b) => a + b, 0) / strains.length : 0;
  const meanRecovery = recScores.length ? recScores.reduce((a, b) => a + b, 0) / recScores.length : 100;
  const imbalanced = meanStrain > IMBALANCE_STRAIN && meanRecovery < IMBALANCE_RECOVERY;

  const sleepByDay = new Map<string, Sleep>();
  for (const s of sleeps) {
    if (s.nap) continue;
    const k = dayKey(s.end);
    // keep the longest non-nap sleep ending that day
    const prev = sleepByDay.get(k);
    const dur = (x: Sleep) =>
      (x.score?.stage_summary.total_in_bed_time_milli ?? 0) -
      (x.score?.stage_summary.total_awake_time_milli ?? 0);
    if (!prev || dur(s) > dur(prev)) sleepByDay.set(k, s);
  }

  const workoutsByDay = new Map<string, Workout[]>();
  for (const w of workouts) {
    const k = dayKey(w.start);
    workoutsByDay.set(k, [...(workoutsByDay.get(k) ?? []), w]);
  }

  const ageMult = ageMultiplier(opts.age);
  const out: DayScore[] = [];

  for (const cycle of cycles) {
    const key = dayKey(cycle.start);
    const rec = recoveryByCycle.get(cycle.id);
    const sleep = sleepByDay.get(key);
    const dayWorkouts = workoutsByDay.get(key) ?? [];

    const factors: Factor[] = [];
    const notes: string[] = [];

    // --- Activity first: its result guards the RHR bonus (§4 guard 3) ---
    const modMin = moderateMinutes(dayWorkouts);
    const strain = cycle.score?.strain ?? null;
    let hasActivityBonus = false;
    if (modMin > 0) {
      const f = activityFactor(modMin);
      hasActivityBonus = f.minutes > 0;
      factors.push(f);
    } else if (strain != null && strain < SEDENTARY_STRAIN) {
      factors.push({
        label: "Sedentary day",
        minutes: SEDENTARY_PENALTY,
        detail: `Day strain ${strain.toFixed(1)} — minimal cardiovascular load`,
      });
    }

    // --- Sleep ---
    let sleepHours: number | null = null;
    let sleepNegative = false;
    if (sleep?.score) {
      const ss = sleep.score.stage_summary;
      sleepHours = (ss.total_in_bed_time_milli - ss.total_awake_time_milli) / 3_600_000;
      const f = sleepDurationFactor(sleepHours);
      sleepNegative = f.minutes < 0;
      factors.push(f);

      const cons = sleep.score.sleep_consistency_percentage;
      if (cons != null) {
        const cf = consistencyFactor(cons);
        // §4 guard 2: regularity partly encodes duration
        if (sleepNegative && cf.minutes < 0) {
          cf.minutes *= 0.5;
          cf.guarded = true;
        }
        factors.push(cf);
      }
    }

    // --- Autonomic ---
    let rhr: number | null = null;
    let hrv: number | null = null;
    let rhrNegative = false;
    if (rec?.score) {
      rhr = rec.score.resting_heart_rate;
      hrv = rec.score.hrv_rmssd_milli;
      if (rhr > 0) {
        const f = rhrFactor(rhr, hasActivityBonus);
        rhrNegative = f.minutes < 0;
        factors.push(f);
      }
      if (hrv > 0 && hrvBaseline) factors.push(hrvFactor(hrv, hrvBaseline, rhrNegative));
    }

    // --- Modifiers (§5) ---
    if (imbalanced) {
      for (const f of factors) if (f.minutes < 0) f.minutes *= IMBALANCE_MULTIPLIER;
      notes.push(
        `Penalties ×${IMBALANCE_MULTIPLIER} — your 7-day strain (${meanStrain.toFixed(1)}) is running ahead of your recovery (${Math.round(meanRecovery)}%). Heuristic only; no mortality evidence.`
      );
    }
    if (ageMult !== 1) {
      for (const f of factors) f.minutes *= ageMult;
      notes.push(`Scaled ×${ageMult} for age — the same day buys less remaining life later in life.`);
    }
    if (factors.some((f) => f.guarded)) {
      notes.push("Some factors were reduced to avoid counting the same evidence twice.");
    }

    const minutes = factors.reduce((a, f) => a + f.minutes, 0);

    out.push({
      date: key,
      minutes: round(minutes),
      factors: factors.map((f) => ({ ...f, minutes: round(f.minutes) })),
      notes,
      strain,
      recovery: rec?.score?.recovery_score ?? null,
      sleepHours,
      rhr,
      hrv,
    });
  }

  return out;
}

export function summarize(days: DayScore[]) {
  const scored = days.filter((d) => d.factors.length > 0);
  const total = scored.reduce((a, d) => a + d.minutes, 0);
  const perDay = scored.length ? total / scored.length : 0;
  // Annualized: per-day rate × 365, expressed in days of life
  const annualDays = (perDay * 365) / 1440;
  return {
    total,
    perDay,
    annualDays,
    microlives: total / 30,
    daysScored: scored.length,
  };
}
