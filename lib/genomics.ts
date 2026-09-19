/**
 * Genomics — turns a ClawBio run into things the user can act on.
 *
 * DESIGN NOTE, and a reversal from the first version of this file.
 *
 * This previously converted polygenic risk scores into a "baseline life expectancy
 * shift" in minutes/day. That was wrong and it has been removed:
 *
 *   1. It was unactionable. You cannot change your genome, so a number attached to it
 *      tells the user nothing to do.
 *   2. It competed with the daily score while meaning something entirely different,
 *      which made both harder to read.
 *   3. It rested on panels ClawBio itself labels "illustrative, not a PGS Catalog
 *      score", with reference distributions too coarse to justify a number stated in
 *      minutes of life.
 *
 * Genetics belongs in Loop as *instructions*, not as a score: which drugs need care,
 * which supplements are worth considering, and which of Loop's own daily factors
 * matter more for this person than for the average one. Disease risk percentiles are
 * still shown, as percentiles, with their caveats — not converted into life expectancy.
 */

import fs from "fs";
import path from "path";

export type Drug = { drug: string; brand: string; class: string; gene: string };

export type ClawbioBundle = {
  source: string;
  citation: string;
  generatedAt: string;
  clawbioVersion: string;
  totalVariants: number | null;
  prs: {
    panelId: string;
    trait: string;
    percentile: number;
    category: string;
    variantsUsed: number;
    variantsTotal: number;
    referencePopulation: string;
    curatedDemoPanel: boolean;
  }[];
  prsSkipped: string[];
  nutrition: {
    summary: { elevated_domains?: string[]; moderate_domains?: string[] };
    recommendations: Record<string, string>;
    domains: Record<
      string,
      {
        score: number | null;
        category: string;
        coverage: string;
        snps: { rsid: string; gene: string; genotype: string; effect: string }[];
      }
    >;
  };
  pharma: {
    summary: { drugs_avoid: number; drugs_caution: number; drugs_standard: number; genes_profiled: number };
    genes: Record<string, { diplotype: string; phenotype: string }>;
    drugs: { avoid: Drug[]; caution: Drug[]; standard: Drug[] };
  };
};

/** A single thing the user can do something about. */
export type Insight = {
  kind: "drug" | "supplement" | "habit";
  headline: string;
  detail: string;
  /** Genes behind it, shown so the claim is checkable rather than oracular. */
  genes: string[];
  severity: "high" | "medium" | "info";
};

export type GenomicsResult = {
  insights: Insight[];
  drugs: { avoid: Drug[]; caution: Drug[] };
  drugCounts: { avoid: number; caution: number; standard: number };
  genes: { gene: string; diplotype: string; phenotype: string }[];
  riskScores: {
    trait: string;
    percentile: number;
    category: string;
    coverage: string;
    referencePopulation: string;
    illustrative: boolean;
  }[];
  riskSkipped: { trait: string; reason: string }[];
  totalVariants: number | null;
  source: string;
  citation: string;
};

const PANEL_NAMES: Record<string, string> = {
  "CLAWBIO-AF-12": "Atrial fibrillation",
  "CLAWBIO-BMI-97": "Body mass index",
};

/** nutrigx domain key -> the heading ClawBio uses in its markdown report. */
const DOMAIN_HEADINGS: Record<string, string> = {
  omega3: "Omega-3 / LC-PUFA",
  vitamin_d: "Vitamin D",
  vitamin_b6: "Vitamin B6",
  vitamin_a: "Vitamin A (Beta-carotene)",
  vitamin_c: "Vitamin C",
  folate: "Folate / B-Vitamins",
  carbohydrate: "Carbohydrate Metabolism",
  fat_metabolism: "Fat Metabolism",
  caffeine: "Caffeine Metabolism",
  alcohol: "Alcohol Metabolism",
  lactose: "Lactose Tolerance",
  antioxidant: "Antioxidant / Detox",
};

const DOMAIN_LABELS: Record<string, string> = {
  omega3: "Omega-3",
  vitamin_d: "Vitamin D",
  vitamin_b6: "Vitamin B6",
  vitamin_a: "Vitamin A",
  vitamin_c: "Vitamin C",
  folate: "Folate / B-vitamins",
  carbohydrate: "Carbohydrate metabolism",
  fat_metabolism: "Fat metabolism",
  caffeine: "Caffeine metabolism",
  alcohol: "Alcohol metabolism",
  lactose: "Lactose tolerance",
  antioxidant: "Antioxidant / detox",
};

const article = (word: string) => ("aeiou".includes(word[0].toLowerCase()) ? "an" : "a");

function buildInsights(b: ClawbioBundle): Insight[] {
  const out: Insight[] = [];

  // --- Drugs. The highest-value output here: CPIC guidance is clinically established,
  // unlike everything else on this page. ---
  for (const d of b.pharma.drugs.avoid) {
    out.push({
      kind: "drug",
      headline: `${d.drug} — avoid or use an alternative`,
      detail: `Your ${d.gene.replace("+", " and ")} genotype changes how you handle ${d.drug.toLowerCase()} (${d.brand}, a ${d.class.toLowerCase()}). If it is ever prescribed, tell the prescriber before you take it.`,
      genes: d.gene.split("+"),
      severity: "high",
    });
  }

  const cautionByGene = new Map<string, Drug[]>();
  for (const d of b.pharma.drugs.caution) {
    cautionByGene.set(d.gene, [...(cautionByGene.get(d.gene) ?? []), d]);
  }
  for (const [gene, drugs] of cautionByGene) {
    const phenotype = b.pharma.genes[gene]?.phenotype;
    out.push({
      kind: "drug",
      headline: `${drugs.length} drug${drugs.length === 1 ? "" : "s"} need dose care — ${gene}`,
      detail: `You are ${phenotype ? `${article(phenotype)} ${phenotype.toLowerCase()}` : "atypical"} for ${gene}, which affects ${drugs
        .slice(0, 3)
        .map((d) => d.drug.toLowerCase())
        .join(", ")}${drugs.length > 3 ? ` and ${drugs.length - 3} more` : ""}. Standard doses may be too strong or too weak.`,
      genes: [gene],
      severity: "medium",
    });
  }

  // --- Supplements, using ClawBio's own wording. It is carefully hedged and
  // paraphrasing someone else's medical guidance is how nuance gets lost. ---
  for (const [key, domain] of Object.entries(b.nutrition.domains)) {
    if (domain.category !== "Elevated" && domain.category !== "Moderate") continue;
    const text = b.nutrition.recommendations[DOMAIN_HEADINGS[key] ?? ""];
    // ClawBio emits a placeholder for domains it has nothing useful to say about.
    // A card reading "No specific recommendation available" is worse than no card.
    if (!text || /^no specific recommendation/i.test(text)) continue;
    out.push({
      kind: "supplement",
      headline: `${DOMAIN_LABELS[key] ?? key} — ${domain.category.toLowerCase()} genetic risk`,
      detail: text,
      genes: [...new Set(domain.snps.map((s) => s.gene))],
      severity: domain.category === "Elevated" ? "medium" : "info",
    });
  }

  // --- Habits: the only place genetics touches what Loop scores daily. ---
  const caffeine = b.nutrition.domains.caffeine;
  if (caffeine?.category === "Elevated" || caffeine?.category === "Moderate") {
    out.push({
      kind: "habit",
      headline: "Caffeine clears slowly for you — it will cost you sleep",
      detail:
        "Slow CYP1A2 metabolism means caffeine stays active longer, so an afternoon coffee is more likely to shorten or fragment your sleep. Loop scores sleep duration and consistency directly, so this shows up in your daily number.",
      genes: [...new Set(caffeine.snps.map((s) => s.gene))],
      severity: "medium",
    });
  }
  const alcohol = b.nutrition.domains.alcohol;
  if (alcohol?.category === "Elevated" || alcohol?.category === "Moderate") {
    out.push({
      kind: "habit",
      headline: "Alcohol clears slowly for you — expect a bigger recovery hit",
      detail:
        "Impaired acetaldehyde clearance means alcohol depresses HRV and fragments sleep more than average. Both feed Loop's daily score.",
      genes: [...new Set(alcohol.snps.map((s) => s.gene))],
      severity: "medium",
    });
  }

  const order = { high: 0, medium: 1, info: 2 };
  return out.sort((a, b2) => order[a.severity] - order[b2.severity]);
}

export function interpret(b: ClawbioBundle): GenomicsResult {
  return {
    insights: buildInsights(b),
    drugs: { avoid: b.pharma.drugs.avoid, caution: b.pharma.drugs.caution },
    drugCounts: {
      avoid: b.pharma.summary.drugs_avoid,
      caution: b.pharma.summary.drugs_caution,
      standard: b.pharma.summary.drugs_standard,
    },
    genes: Object.entries(b.pharma.genes)
      .map(([gene, v]) => ({ gene, ...v }))
      .filter((g) => !g.phenotype.toLowerCase().includes("indeterminate")),
    riskScores: b.prs.map((p) => ({
      trait: p.trait,
      percentile: p.percentile,
      category: p.category,
      coverage: `${p.variantsUsed}/${p.variantsTotal} variants`,
      referencePopulation: p.referencePopulation,
      illustrative: p.curatedDemoPanel,
    })),
    riskSkipped: b.prsSkipped.map((id) => ({
      trait: PANEL_NAMES[id] ?? id,
      reason: "a 23andMe chip doesn't carry enough of this panel to score it",
    })),
    totalVariants: b.totalVariants,
    source: b.source,
    citation: b.citation,
  };
}

/** Loads the precomputed demo bundle. Real uploads need a Python worker — CLAWBIO.md §6. */
export function loadDemoGenome(): GenomicsResult | null {
  try {
    const file = path.join(process.cwd(), "demo-data/clawbio/corpasome.json");
    return interpret(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch {
    return null;
  }
}
