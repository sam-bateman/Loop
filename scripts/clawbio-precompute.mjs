/**
 * Bundles ClawBio's output into a single JSON that Loop can read at request time.
 *
 * ClawBio is Python, needs a 215 MB checkout, and takes 10-15s on a 576k-SNP file —
 * none of which fits in a Vercel function. For the demo we precompute here and commit
 * the result. Real user uploads need a separate Python worker; see CLAWBIO.md §6.
 *
 *   npm run genome:precompute
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { execFileSync } from "child_process";
import { resolve } from "path";

const CLAWBIO = process.env.CLAWBIO_DIR ?? resolve("../ClawBio");
const PYTHON = resolve(".venv-clawbio/bin/python");
const GENOME = resolve("demo-data/corpasome.txt");
const TMP = resolve("demo-data/.clawbio-tmp");
const OUT = resolve("demo-data/clawbio/corpasome.json");

const PANELS = ["CLAWBIO-T2D-8", "CLAWBIO-CAD-46", "CLAWBIO-AF-12", "CLAWBIO-BMI-97"];

if (!existsSync(GENOME)) {
  console.error("Missing demo-data/corpasome.txt — run `npm run genome:unpack` first.");
  process.exit(1);
}
if (!existsSync(CLAWBIO)) {
  console.error(`Missing ClawBio checkout at ${CLAWBIO}. See CLAWBIO.md §2.`);
  process.exit(1);
}

const run = (args) =>
  execFileSync(PYTHON, args, { cwd: CLAWBIO, stdio: ["ignore", "pipe", "pipe"] }).toString();

// --- nutrigx: 12 nutrition domains, each with a written recommendation ---
run(["clawbio.py", "run", "nutrigx", "--input", GENOME, "--output", `${TMP}/nutrigx`]);
const nutrigx = JSON.parse(readFileSync(`${TMP}/nutrigx/result.json`, "utf8"));

// The per-domain recommendation text only exists in the markdown report, not the JSON.
// Pull it out so the UI can show ClawBio's own wording rather than ours — theirs is
// carefully hedged and we should not paraphrase medical guidance.
const nutrigxMd = readFileSync(`${TMP}/nutrigx/nutrigx_report.md`, "utf8");
const recommendations = {};
for (const block of nutrigxMd.split(/^### /m).slice(1)) {
  const title = block.split("\n")[0].trim();
  const m = block.match(/\*\*Recommendation\*\*\s*\n+>\s*([\s\S]*?)(?:\n\n|\n---)/);
  if (m) recommendations[title] = m[1].replace(/\n>\s?/g, " ").trim();
}

// --- pharmgx: drug dosing from CPIC guidelines ---
// Runs against the full 23andMe file. This previously had to use ClawBio's
// pre-extracted subset (--demo): the build detector did not recognise NCBI36, so a
// pre-2011 chip was treated as corrupt and every gene call discarded. Fixed in
// Owen-x-tech/ClawBio fix/ncbi36-build-detection; requires a checkout carrying it.
run(["clawbio.py", "run", "pharmgx", "--input", GENOME, "--output", `${TMP}/pharmgx`]);
const pharmgx = JSON.parse(readFileSync(`${TMP}/pharmgx/result.json`, "utf8"));

// --- PRS: one call per panel. Panels below the SNP-overlap threshold produce no
// result file; that is a real outcome for a 23andMe chip and we record it. ---
const prs = [];
const skipped = [];
for (const panel of PANELS) {
  const dir = `${TMP}/prs-${panel}`;
  try {
    run(["skills/gwas-prs/gwas_prs.py", "--input", GENOME, "--panel-id", panel, "--output", dir]);
    prs.push(...JSON.parse(readFileSync(`${dir}/prs_results.json`, "utf8")));
  } catch {
    skipped.push(panel);
  }
  if (!existsSync(`${dir}/prs_results.json`) && !skipped.includes(panel)) skipped.push(panel);
}

const bundle = {
  source: "Corpasome — Manuel Corpas 23andMe genotype, CC0 public domain",
  citation: "Corpas, M. (2013). Source Code for Biology and Medicine, 8, 13. doi:10.1186/1751-0473-8-13",
  generatedAt: new Date().toISOString(),
  clawbioVersion: run(["clawbio.py", "--version"]).trim(),
  totalVariants: nutrigx.summary?.total_variants_loaded ?? null,
  prs: prs.map((p) => ({
    panelId: p.score_id,
    trait: p.trait,
    percentile: p.percentile,
    category: p.risk_category,
    zScore: p.z_score,
    variantsUsed: p.variants_used,
    variantsTotal: p.variants_total,
    overlapFraction: p.overlap_fraction,
    referencePopulation: p.reference_population,
    curatedDemoPanel: p.curated_demo_panel === true,
  })),
  prsSkipped: skipped,
  nutrition: {
    summary: nutrigx.summary,
    recommendations,
    domains: Object.fromEntries(
      Object.entries(nutrigx.data.risk_scores).map(([k, v]) => [
        k,
        {
          score: v.score,
          category: v.category,
          coverage: v.coverage,
          snps: v.contributing_snps.map((s) => ({
            rsid: s.rsid,
            gene: s.gene,
            genotype: s.genotype,
            effect: s.effect_direction,
          })),
        },
      ])
    ),
  },
  pharma: {
    summary: pharmgx.summary,
    genes: pharmgx.data.gene_profiles,
    drugs: {
      avoid: pharmgx.data.drug_recommendations.avoid,
      caution: pharmgx.data.drug_recommendations.caution,
      standard: pharmgx.data.drug_recommendations.standard,
    },
  },
};

writeFileSync(OUT, JSON.stringify(bundle, null, 2));
console.log(`wrote ${OUT}`);
console.log(`  PRS scored: ${bundle.prs.map((p) => `${p.trait} ${p.percentile}%`).join(", ")}`);
console.log(`  PRS skipped (insufficient SNP overlap): ${skipped.join(", ") || "none"}`);
console.log(`  Drugs: ${bundle.pharma.summary.drugs_avoid} avoid, ${bundle.pharma.summary.drugs_caution} caution, ${bundle.pharma.summary.drugs_standard} standard`);
console.log(`  Nutrition recommendations: ${Object.keys(recommendations).length}`);
