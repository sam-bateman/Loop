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

// --- nutrigx: 12 nutrition domains ---
run(["clawbio.py", "run", "nutrigx", "--input", GENOME, "--output", `${TMP}/nutrigx`]);
const nutrigx = JSON.parse(readFileSync(`${TMP}/nutrigx/result.json`, "utf8"));

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
};

writeFileSync(OUT, JSON.stringify(bundle, null, 2));
console.log(`wrote ${OUT}`);
console.log(`  PRS scored: ${bundle.prs.map((p) => `${p.trait} ${p.percentile}%`).join(", ")}`);
console.log(`  PRS skipped (insufficient SNP overlap): ${skipped.join(", ") || "none"}`);
