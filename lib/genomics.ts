/**
 * Genomics tier — converts ClawBio polygenic risk scores into a baseline shift in
 * life expectancy.
 *
 * Every constant here is derived in METHODOLOGY-WHOOP.md §9. Read that before changing
 * a number.
 *
 * The output is deliberately NOT part of the daily score. Genetics is the starting line;
 * §2's factors are the part the user can actually move. Loop keeps them separate.
 */

import fs from "fs";
import path from "path";

// --- §9.1 step 1: per-SD log hazard ratios ---
const BETA: Record<string, number> = {
  "Coronary artery disease": Math.log(1.6), // Inouye 2018
  "Type 2 diabetes": Math.log(1.5), // Khera 2018
};

// --- §9.1 step 2: share of all-cause mortality (GBD 2019, high-income) ---
const MORTALITY_SHARE: Record<string, number> = {
  "Coronary artery disease": 0.16,
  "Type 2 diabetes": 0.03,
};

const Z_CLAMP = 2.0; // §9.1 — the bundled panels' reference distributions are crude
const HR_ANCHOR = 0.12; // §2.1 — HR 1.12 ≈ one microlife/day
const MICROLIFE_MIN = 30;
const CONSERVATISM = 0.5; // §9.1 step 3

export type PrsScore = {
  panelId: string;
  trait: string;
  percentile: number;
  category: string;
  zScore: number;
  variantsUsed: number;
  variantsTotal: number;
  overlapFraction: number;
  referencePopulation: string;
  curatedDemoPanel: boolean;
};

export type NutritionDomain = {
  score: number | null;
  category: string;
  coverage: string;
  snps: { rsid: string; gene: string; genotype: string; effect: string }[];
};

export type ClawbioBundle = {
  source: string;
  citation: string;
  generatedAt: string;
  clawbioVersion: string;
  totalVariants: number | null;
  prs: PrsScore[];
  prsSkipped: string[];
  nutrition: {
    summary: { elevated_domains?: string[]; moderate_domains?: string[] };
    domains: Record<string, NutritionDomain>;
  };
};

export type ScoredTrait = {
  trait: string;
  percentile: number;
  category: string;
  minutesPerDay: number;
  /** Relative risk for the disease itself, before mortality weighting */
  diseaseRR: number;
  referencePopulation: string;
  coverage: string;
  illustrative: boolean;
  /** true when the raw z fell outside ±2 and was clamped */
  clamped: boolean;
};

export type GenomicsResult = {
  traits: ScoredTrait[];
  /** Unscored — shown as context only. See METHODOLOGY-WHOOP.md §9.3. */
  unscored: { trait: string; reason: string }[];
  nutrition: { name: string; category: string; coverage: string; genes: string[] }[];
  baselineMinutesPerDay: number;
  baselineYears: number;
  referencePopulations: string[];
  source: string;
  citation: string;
};

function scoreTrait(p: PrsScore): ScoredTrait | null {
  const beta = BETA[p.trait];
  const share = MORTALITY_SHARE[p.trait];
  if (beta === undefined || share === undefined) return null;

  const rawZ = p.zScore;
  const z = Math.max(-Z_CLAMP, Math.min(Z_CLAMP, rawZ));
  const diseaseRR = Math.exp(beta * z);
  const allCauseHR = 1 + share * (diseaseRR - 1);
  const minutesPerDay =
    -((allCauseHR - 1) / HR_ANCHOR) * MICROLIFE_MIN * CONSERVATISM;

  return {
    trait: p.trait,
    percentile: p.percentile,
    category: p.category,
    minutesPerDay,
    diseaseRR,
    referencePopulation: p.referencePopulation,
    coverage: `${p.variantsUsed}/${p.variantsTotal} variants`,
    illustrative: p.curatedDemoPanel,
    clamped: Math.abs(rawZ) > Z_CLAMP,
  };
}

const PANEL_NAMES: Record<string, string> = {
  "CLAWBIO-AF-12": "Atrial fibrillation",
  "CLAWBIO-BMI-97": "Body mass index",
  "CLAWBIO-T2D-8": "Type 2 diabetes",
  "CLAWBIO-CAD-46": "Coronary artery disease",
};

export function interpret(bundle: ClawbioBundle): GenomicsResult {
  const traits = bundle.prs
    .map(scoreTrait)
    .filter((t): t is ScoredTrait => t !== null);

  const unscored = [
    ...bundle.prsSkipped.map((id) => ({
      trait: PANEL_NAMES[id] ?? id,
      reason: "Below 50% SNP overlap — a 23andMe chip doesn't carry enough of this panel",
    })),
    ...bundle.prs
      .filter((p) => BETA[p.trait] === undefined)
      .map((p) => ({
        trait: p.trait,
        reason: "No published per-SD hazard ratio wired up yet",
      })),
  ];

  const nutrition = Object.entries(bundle.nutrition.domains)
    .filter(([, d]) => d.category !== "Unknown" && d.category !== "Low")
    .map(([name, d]) => ({
      name: name.replace(/_/g, " "),
      category: d.category,
      coverage: d.coverage,
      genes: [...new Set(d.snps.map((s) => s.gene))],
    }))
    .sort((a, b) => (a.category === "Elevated" ? -1 : b.category === "Elevated" ? 1 : 0));

  const baselineMinutesPerDay = traits.reduce((a, t) => a + t.minutesPerDay, 0);

  return {
    traits,
    unscored,
    nutrition,
    baselineMinutesPerDay,
    // Minutes/day, held over a 50-year horizon, expressed in years of life
    baselineYears: (baselineMinutesPerDay * 50) / 1440,
    referencePopulations: [...new Set(bundle.prs.map((p) => p.referencePopulation))],
    source: bundle.source,
    citation: bundle.citation,
  };
}

/** Loads the precomputed demo bundle. Real uploads need a Python worker — CLAWBIO.md §6. */
export function loadDemoGenome(): GenomicsResult | null {
  try {
    const file = path.join(process.cwd(), "demo-data/clawbio/corpasome.json");
    const bundle: ClawbioBundle = JSON.parse(fs.readFileSync(file, "utf8"));
    return interpret(bundle);
  } catch {
    return null;
  }
}
