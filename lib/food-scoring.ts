/**
 * Food scoring — ported from Liv's MicrolifeScoring.swift.
 *
 * Every rate, allowance, taper and guard is documented in METHODOLOGY.md. That file is
 * the source of truth; this is its implementation.
 *
 * ONE DELIBERATE DIVERGENCE FROM LIV
 * ----------------------------------
 * Liv applies exercise and sleep as MULTIPLIERS on food penalties (METHODOLOGY.md §5).
 * Loop scores exercise and sleep as factors in their own right (METHODOLOGY-WHOOP.md
 * §2), so applying them here as well would count the same evidence twice — the exact
 * failure METHODOLOGY-WHOOP.md §4 guard 4 exists to prevent.
 *
 * Those two multipliers are therefore disabled. The sex, BMI and age modifiers are kept:
 * none of them are scored anywhere else in Loop.
 */

import { ageMultiplier } from "./scoring";
import { limitsFor, type BodyProfile } from "./nutrition-targets";

export type Nutrition = {
  food_name: string;
  portion: string;
  calories: number;
  saturated_fat_g: number;
  trans_fat_g: number;
  sodium_mg: number;
  added_sugar_g: number;
  fibre_g: number;
  protein_g?: number;
  carbs_g?: number;
  /** Total fat, saturated and trans included. Optional — meals logged before it existed lack it. */
  fat_g?: number;
  /** Total sugars, naturally occurring included. Tracking only; scoring uses added_sugar_g. */
  sugar_g?: number;
  is_processed_meat: boolean;
  is_red_meat: boolean;
  fruit_veg_servings: number;
  is_oily_fish: boolean;
  processing_level?: string;
  /* Product-quality fields, carried over from Liv's Nutrition model. All
     optional: a barcode record can supply them, a meal photo cannot reliably
     reveal a packaged food's ingredients, additives or certification. None of
     them feed the microlife score — they are shown, not scored. */
  ingredients_text?: string;
  additive_codes?: string[];
  is_organic?: boolean;
  data_source?: string;
};

/** The scored model and the tracking model read the same profile. */
export type FoodProfile = BodyProfile;

export type DailyIntake = {
  fruitVegServings: number;
  oilyFishServings: number;
  saturatedFatG: number;
  sodiumMg: number;
  addedSugarG: number;
  fibreG: number;
};

export const EMPTY_INTAKE: DailyIntake = {
  fruitVegServings: 0,
  oilyFishServings: 0,
  saturatedFatG: 0,
  sodiumMg: 0,
  addedSugarG: 0,
  fibreG: 0,
};

export function addToIntake(intake: DailyIntake, n: Nutrition): DailyIntake {
  return {
    fruitVegServings: intake.fruitVegServings + Math.min(n.fruit_veg_servings, 5),
    oilyFishServings: intake.oilyFishServings + (n.is_oily_fish ? 1 : 0),
    saturatedFatG: intake.saturatedFatG + n.saturated_fat_g,
    sodiumMg: intake.sodiumMg + n.sodium_mg,
    addedSugarG: intake.addedSugarG + n.added_sugar_g,
    fibreG: intake.fibreG + n.fibre_g,
  };
}

// --- Allowances (METHODOLOGY.md §4) ---
//
// Sized in lib/nutrition-targets.ts so the numbers Loop *scores* against and the numbers
// it *shows* you are the same numbers. Read the note at the top of that file before
// touching the energy estimate: it is what keeps WHOOP strain out of these budgets.

const allowancesFor = limitsFor;

// --- Budget helpers (METHODOLOGY.md §3) ---

/** The share of `amount` that pushes the day's running total past `allowance`. */
export function overBudget(amount: number, prior: number, allowance: number): number {
  return Math.max(0, prior + amount - allowance) - Math.max(0, Math.max(0, prior) - allowance);
}

const FRUIT_VEG_WEIGHTS = [1.0, 1.0, 0.7, 0.4, 0.25, 0.1, 0.1, 0.1]; // Wang 2021
const OILY_FISH_WEIGHTS = [1.0, 0.3, 0.1];

function weightedServings(total: number, weights: number[]): number {
  let credited = 0;
  for (let i = 0; i < weights.length; i++) {
    const inThis = Math.min(total, i + 1) - i;
    if (inThis <= 0) break;
    credited += inThis * weights[i];
  }
  return credited;
}

function servingBonus(amount: number, prior: number, weights: number[], rate: number): number {
  if (amount <= 0) return 0;
  const start = Math.max(0, prior);
  return rate * (weightedServings(start + amount, weights) - weightedServings(start, weights));
}

function creditedUnits(total: number, target: number): number {
  const tiers: [number, number][] = [
    [target * 0.5, 1.0],
    [target, 0.6],
    [target * 1.5, 0.2],
  ];
  let credited = 0;
  let floor = 0;
  for (const [limit, weight] of tiers) {
    credited += Math.max(0, Math.min(total, limit) - floor) * weight;
    floor = limit;
  }
  return credited;
}

function saturatingBonus(amount: number, prior: number, target: number, rate: number): number {
  if (amount <= 0 || target <= 0) return 0;
  const start = Math.max(0, prior);
  return rate * (creditedUnits(start + amount, target) - creditedUnits(start, target));
}

// --- Scoring ---

export type FoodFactor = { label: string; minutes: number; neutral?: boolean };
export type FoodScore = {
  minutes: number;
  factors: FoodFactor[];
  notes: string[];
};

const fmt = (v: number) => (v === Math.round(v) ? `${v}` : v.toFixed(1));

export function scoreFood(
  n: Nutrition,
  profile?: FoodProfile,
  prior: DailyIntake = EMPTY_INTAKE
): FoodScore {
  let minutes = 0;
  const factors: FoodFactor[] = [];
  const notes: string[] = [];
  const a = allowancesFor(profile);

  const bmi =
    profile?.weightKg && profile?.heightCm
      ? profile.weightKg / Math.pow(profile.heightCm / 100, 2)
      : null;

  // Kept: neither sex nor BMI is scored elsewhere in Loop.
  const sodiumModifier = (profile?.sex === "female" ? 1.3 : 1) * (bmi && bmi > 27 ? 1.3 : 1);
  const redMeatModifier = profile?.sex === "male" ? 1.15 : 1;

  const fv = Math.min(n.fruit_veg_servings, 5);
  const isMeat = n.is_processed_meat || n.is_red_meat;

  // Fruit/veg: +7 min per serving, tapering across the day
  if (fv > 0) {
    const bonus = servingBonus(fv, prior.fruitVegServings, FRUIT_VEG_WEIGHTS, 7);
    minutes += bonus;
    factors.push({ label: `Fruit/veg (${fv} serving${fv > 1 ? "s" : ""})`, minutes: bonus });
    if (bonus < fv * 7 * 0.95) {
      notes.push(
        "Most of the fruit/veg benefit lands in the first few servings of a day, so this one counts for less."
      );
    }
  }

  // Oily fish: +15 min, little for a repeat the same day
  if (n.is_oily_fish) {
    const bonus = servingBonus(1, prior.oilyFishServings, OILY_FISH_WEIGHTS, 15);
    minutes += bonus;
    factors.push({ label: "Oily fish (omega-3)", minutes: bonus });
    if (bonus < 15 * 0.95) notes.push("Second oily fish today — the omega-3 benefit is largely already banked.");
  }

  // Processed meat: -30, linear, no allowance (IARC Group 1)
  if (n.is_processed_meat) {
    minutes += -30;
    factors.push({ label: "Processed meat", minutes: -30 });
  }

  // Red meat: -15 (only when not already processed)
  if (n.is_red_meat && !n.is_processed_meat) {
    const penalty = -15 * redMeatModifier;
    minutes += penalty;
    factors.push({ label: "Red meat", minutes: penalty });
  }

  // Saturated fat: only grams past the day's allowance
  if (n.saturated_fat_g > 0) {
    const excess = overBudget(n.saturated_fat_g, prior.saturatedFatG, a.saturatedFatG);
    if (excess > 0) {
      const raw = excess * -1.4; // -7 min per 5 g
      const penalty = isMeat ? raw * 0.5 : raw; // §2 guard: meat penalty already covers it
      minutes += penalty;
      factors.push({
        label: `Saturated fat ${fmt(n.saturated_fat_g)}g (${fmt(excess)}g over)`,
        minutes: penalty,
      });
    } else {
      factors.push({
        label: `Saturated fat ${fmt(n.saturated_fat_g)}g — within today's allowance`,
        minutes: 0,
        neutral: true,
      });
    }
  }

  // Trans fat: -12/g, no safe threshold
  if (n.trans_fat_g > 0) {
    const penalty = n.trans_fat_g * -12;
    minutes += penalty;
    factors.push({ label: `Trans fat ${fmt(n.trans_fat_g)}g`, minutes: penalty });
  }

  // Sodium: only milligrams past the allowance
  if (n.sodium_mg > 0) {
    const excess = overBudget(n.sodium_mg, prior.sodiumMg, a.sodiumMg);
    if (excess > 0) {
      const raw = excess * -0.012; // -6 min per 500 mg
      const penalty = (isMeat ? raw * 0.5 : raw) * sodiumModifier;
      minutes += penalty;
      factors.push({
        label: `Sodium ${Math.round(n.sodium_mg)}mg (${Math.round(excess)}mg over)`,
        minutes: penalty,
      });
    } else {
      factors.push({
        label: `Sodium ${Math.round(n.sodium_mg)}mg — within today's allowance`,
        minutes: 0,
        neutral: true,
      });
    }
  }

  // Added sugar: skipped when fruit/veg scored, to avoid double counting
  if (n.added_sugar_g > 0 && fv === 0) {
    const excess = overBudget(n.added_sugar_g, prior.addedSugarG, a.addedSugarG);
    if (excess > 0) {
      const penalty = excess * -0.45; // -4.5 min per 10 g
      minutes += penalty;
      factors.push({
        label: `Added sugar ${fmt(n.added_sugar_g)}g (${fmt(excess)}g over)`,
        minutes: penalty,
      });
    } else {
      factors.push({
        label: `Added sugar ${fmt(n.added_sugar_g)}g — within today's allowance`,
        minutes: 0,
        neutral: true,
      });
    }
  }

  // Fibre: +6 per 5 g, tapering past target. Skipped when fruit/veg scored.
  if (n.fibre_g > 0 && fv === 0) {
    const bonus = saturatingBonus(n.fibre_g, prior.fibreG, a.fibreTargetG, 1.2);
    if (bonus >= 0.5) {
      minutes += bonus;
      factors.push({ label: `Fibre ${fmt(n.fibre_g)}g`, minutes: bonus });
    }
  }

  // Age multiplier — shared with the WHOOP model so Loop has one age curve, not two.
  const mult = ageMultiplier(profile?.age);
  if (mult !== 1) {
    minutes *= mult;
    for (const f of factors) f.minutes *= mult;
    notes.push(`Scaled ×${mult} for age — the same meal buys less remaining life later in life.`);
  }

  return {
    minutes: Math.round(minutes),
    factors: factors.map((f) => ({ ...f, minutes: Math.round(f.minutes) })),
    notes,
  };
}
