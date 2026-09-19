/**
 * Calorie and macronutrient tracking — the conventional layer under the microlife score.
 *
 * lib/food-scoring.ts answers "how many minutes of life did that meal buy or cost?".
 * This file answers the ordinary question a food log has to answer too: how much have
 * you eaten today, and how much is left. Every target and ceiling is documented in
 * METHODOLOGY.md §8.
 *
 * TWO ENERGY NUMBERS, DELIBERATELY
 * --------------------------------
 * `estimatedCalories()` — Mifflin-St Jeor × 1.4 — is what sizes the *scored* allowances
 * (saturated fat, sodium, added sugar, fibre). It is Liv's formula, unchanged, because
 * changing it would silently move every microlife score.
 *
 * `trackingCalories()` prefers WHOOP's measured daily energy expenditure when we have
 * it. That is the better number to eat against, but it only drives the display targets
 * for calories, protein, carbs and fat — never the scored allowances. Keeping the two
 * separate is what stops a heavy training week from quietly loosening the sodium budget.
 */

import type { Nutrition } from "./food-scoring";

export type BodyProfile = {
  age?: number;
  sex?: "male" | "female" | "other";
  weightKg?: number;
  heightCm?: number;
};

export const DEFAULT_CALORIES = 2000;

/** Mifflin-St Jeor (1990) resting energy expenditure, or null without the inputs. */
export function basalCalories(p?: BodyProfile): number | null {
  if (!p?.weightKg || !p?.heightCm || !p?.age) return null;
  const s = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + s;
}

/**
 * Energy estimate used to size the SCORED allowances (METHODOLOGY.md §4).
 * Light-activity factor only — WHOOP strain is scored as its own factor, so folding
 * measured burn in here would count the same exercise twice.
 */
export function estimatedCalories(p?: BodyProfile): number {
  const bmr = basalCalories(p);
  return bmr === null ? DEFAULT_CALORIES : bmr * 1.4;
}

export type EnergySource = "whoop" | "estimated" | "default";

/**
 * Energy to eat against. WHOOP's measured total daily expenditure wins when present;
 * a plausibility window keeps a bad cycle from producing a 900 or 7,000 kcal target.
 */
export function trackingCalories(
  p?: BodyProfile,
  burnedKcal?: number | null
): { calories: number; source: EnergySource } {
  if (burnedKcal && burnedKcal >= 1200 && burnedKcal <= 6000) {
    return { calories: burnedKcal, source: "whoop" };
  }
  const bmr = basalCalories(p);
  if (bmr === null) return { calories: DEFAULT_CALORIES, source: "default" };
  return { calories: bmr * 1.4, source: "estimated" };
}

/** WHOOP reports cycle energy in kilojoules. */
export function kjToKcal(kilojoule: number): number {
  return kilojoule / 4.184;
}

// --- Ceilings and targets ---

/** The four nutrients the microlife model budgets. Sized off `estimatedCalories`. */
export type NutrientLimits = {
  saturatedFatG: number;
  addedSugarG: number;
  sodiumMg: number;
  fibreTargetG: number;
};

/** METHODOLOGY.md §4. lib/food-scoring.ts scores against exactly these numbers. */
export function limitsFor(p?: BodyProfile): NutrientLimits {
  const calories = estimatedCalories(p);
  const sugarCeiling = p?.sex === "male" ? 36 : p?.sex === "female" ? 25 : 30;
  return {
    saturatedFatG: (calories * 0.06) / 9, // AHA ideal intake
    addedSugarG: Math.min((calories * 0.05) / 4, sugarCeiling), // WHO 5% of energy + AHA ceilings
    sodiumMg: 2300, // CDRR. Liv adds sweat losses; Loop scores exercise separately.
    fibreTargetG: (calories / 1000) * 14, // IOM adequate intake
  };
}

export type DailyTargets = NutrientLimits & {
  calories: number;
  energySource: EnergySource;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const PROTEIN_G_PER_KG = 1.6; // Morton et al. (2018) — benefit plateaus near 1.62 g/kg
const FAT_SHARE = 0.3; // IOM AMDR 20–35% of energy
const PROTEIN_SHARE_MAX = 0.35; // IOM AMDR upper bound
const PROTEIN_SHARE_FALLBACK = 0.2; // used when we have no bodyweight

export function dailyTargets(p?: BodyProfile, burnedKcal?: number | null): DailyTargets {
  const { calories, source } = trackingCalories(p, burnedKcal);

  const fromWeight = p?.weightKg ? p.weightKg * PROTEIN_G_PER_KG : null;
  const fallback = (calories * PROTEIN_SHARE_FALLBACK) / 4;
  const proteinG = Math.min(fromWeight ?? fallback, (calories * PROTEIN_SHARE_MAX) / 4);

  const fatG = (calories * FAT_SHARE) / 9;
  const carbsG = Math.max(0, (calories - proteinG * 4 - fatG * 9) / 4);

  return {
    ...limitsFor(p),
    calories,
    energySource: source,
    proteinG,
    carbsG,
    fatG,
  };
}

// --- Running totals ---

export type DailyTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  saturatedFatG: number;
  transFatG: number;
  addedSugarG: number;
  sugarG: number;
  sodiumMg: number;
  fibreG: number;
  fruitVegServings: number;
};

export const EMPTY_TOTALS: DailyTotals = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  saturatedFatG: 0,
  transFatG: 0,
  addedSugarG: 0,
  sugarG: 0,
  sodiumMg: 0,
  fibreG: 0,
  fruitVegServings: 0,
};

const num = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);

export function addToTotals(t: DailyTotals, n: Nutrition): DailyTotals {
  return {
    calories: t.calories + num(n.calories),
    proteinG: t.proteinG + num(n.protein_g),
    carbsG: t.carbsG + num(n.carbs_g),
    // Older logged meals predate fat_g; saturated + trans is the honest floor for those.
    fatG: t.fatG + num(n.fat_g ?? num(n.saturated_fat_g) + num(n.trans_fat_g)),
    saturatedFatG: t.saturatedFatG + num(n.saturated_fat_g),
    transFatG: t.transFatG + num(n.trans_fat_g),
    addedSugarG: t.addedSugarG + num(n.added_sugar_g),
    sugarG: t.sugarG + num(n.sugar_g ?? n.added_sugar_g),
    sodiumMg: t.sodiumMg + num(n.sodium_mg),
    fibreG: t.fibreG + num(n.fibre_g),
    fruitVegServings: t.fruitVegServings + Math.min(num(n.fruit_veg_servings), 5),
  };
}

export function totalsFor(meals: { nutrition: Nutrition }[]): DailyTotals {
  return meals.reduce((acc, m) => addToTotals(acc, m.nutrition), EMPTY_TOTALS);
}

// --- Display ---

/**
 * `target` nutrients are things to reach; `limit` nutrients are ceilings to stay under.
 * The distinction is the whole point — 90% of your protein target is a problem, 90% of
 * your sodium ceiling is not.
 */
export type NutrientProgress = {
  key: string;
  label: string;
  value: number;
  target: number;
  unit: "kcal" | "g" | "mg";
  kind: "target" | "limit";
  /** 0–100, clamped for the bar. `over` carries the part that did not fit. */
  pct: number;
  over: boolean;
  remaining: number;
};

function progress(
  key: string,
  label: string,
  value: number,
  target: number,
  unit: NutrientProgress["unit"],
  kind: NutrientProgress["kind"]
): NutrientProgress {
  const ratio = target > 0 ? value / target : 0;
  return {
    key,
    label,
    value,
    target,
    unit,
    kind,
    pct: Math.min(100, Math.max(0, ratio * 100)),
    over: ratio > 1,
    remaining: target - value,
  };
}

/** Calories, then the three macros. */
export function macroProgress(t: DailyTotals, g: DailyTargets): NutrientProgress[] {
  return [
    progress("calories", "Calories", t.calories, g.calories, "kcal", "target"),
    progress("protein", "Protein", t.proteinG, g.proteinG, "g", "target"),
    progress("carbs", "Carbs", t.carbsG, g.carbsG, "g", "target"),
    progress("fat", "Fat", t.fatG, g.fatG, "g", "target"),
  ];
}

/** The nutrients the microlife model also budgets — same numbers, plain framing. */
export function nutrientProgress(t: DailyTotals, g: DailyTargets): NutrientProgress[] {
  return [
    progress("fibre", "Fibre", t.fibreG, g.fibreTargetG, "g", "target"),
    progress("satfat", "Saturated fat", t.saturatedFatG, g.saturatedFatG, "g", "limit"),
    progress("sugar", "Added sugar", t.addedSugarG, g.addedSugarG, "g", "limit"),
    progress("sodium", "Sodium", t.sodiumMg, g.sodiumMg, "mg", "limit"),
  ];
}
