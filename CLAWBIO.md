# ClawBio integration — findings and plan

Status 2026-09-19: **ClawBio verified working end-to-end against a real 23andMe file.**
Nothing wired into Loop yet.

---

## 1. The demo genome question: use a real one

We are **not** building a synthetic genome. ClawBio ships the **Corpasome** — Manuel
Corpas's real 23andMe genotype, CC0 public domain, 576,518 SNPs, byte-identical to a
real 23andMe export. Copied to [`demo-data/corpasome.txt.gz`](demo-data/corpasome.txt.gz).

ClawBio's own argument, which is correct: synthetic data only exercises the happy path.
A real genome carries missing SNPs, heterozygous calls, and combinations that produce
genuinely actionable findings. The Corpasome, for instance, triggers a real warfarin
AVOID alert (VKORC1 TT + CYP2C9 \*1/\*2).

## 2. Setup

The **pip package does not ship the skills' data panels** — `pip install clawbio` gives
you `nutrigx` but not its `snp_panel.json`, and the skill fails at runtime. Use a source
checkout, as ClawBio's README says:

```bash
git clone --depth 1 https://github.com/ClawBio/ClawBio.git   # ~215 MB
uv venv .venv-clawbio --python 3.12
uv pip install --python .venv-clawbio clawbio
```

Run from the checkout, not the installed CLI:

```bash
cd ClawBio && ../whoop/.venv-clawbio/bin/python clawbio.py run nutrigx \
  --input ../whoop/demo-data/corpasome.txt --output /tmp/out
```

## 3. What actually runs, and what it returns

### `nutrigx` — ✅ works, 12.8s

12 nutrition domains scored from 20 of 28 panel SNPs. Per domain: a 0–10 score, a
category (`Low` / `Moderate` / `Elevated` / `Unknown`), and the contributing SNPs with
gene, genotype, weight, and effect direction.

Corpasome results: `omega3` **Elevated** (FADS1 CC + FADS2 AA — reduced long-chain PUFA
synthesis); `vitamin_b6`, `carbohydrate`, `antioxidant` Moderate; `caffeine`, `lactose`,
`alcohol` Low; `vitamin_d` **Unknown** (0 of 3 SNPs present on the chip).

### `prs` (gwas-prs) — ✅ works, needs a panel argument

Six bundled curated panels: T2D (8 loci), atrial fibrillation (12), **CAD (46)**, breast
cancer (77), prostate cancer (147), BMI (97). Can also pull any PGS Catalog score by
`--pgs-id` or `--trait` (network required).

Corpasome on CAD: 24/46 variants matched, raw PRS 1.98, **0.1 percentile (Low)**.

### `pharmgx` — ✅ works (after fixing a ClawBio bug)

Full CPIC drug guidance: 1 avoid (warfarin), 25 use-with-caution, 28 standard dosing
across 13 genes and 59 drugs.

This originally returned "insufficient data" for every drug. ClawBio's build detector
knew only GRCh37 and GRCh38, and the Corpasome is a 23andMe v2-era file on NCBI36/hg18,
so it was treated as corrupt and every gene call discarded. Fixed and submitted upstream
— see `METHODOLOGY-WHOOP.md` §9.4. **A ClawBio checkout carrying that fix is required**
for `npm run genome:precompute` to reproduce this bundle.

### Not usable from 23andMe data

`methylation-clock` needs a 450k/EPIC array. `proteomics-clock` and `organ-aging-studio`
need Olink proteomics. **Neither can run on a consumer genotype file** — they would
require the user to upload a separate assay most people have never had done.

---

## 4. The integration problem, stated honestly

`nutrigx` is a **nutrition** genetics tool. Its domains — folate, omega-3, caffeine,
lactose, alcohol, carbohydrate, fat metabolism — pair naturally with Liv's food scoring.
**Loop's food tier does not exist yet.** Against WHOOP-only signals the honest overlap is
thin, and limited to two links:

| Link | Mechanism | Evidence quality |
|---|---|---|
| CYP1A2 slow metaboliser → sleep | Slow caffeine clearance amplifies sleep disruption | Moderate; effect sizes vary a lot |
| ADH1B / ALDH2 → sleep, HRV | Impaired acetaldehyde clearance worsens sleep and autonomic recovery | Weaker; mostly acute-exposure studies |

Both would need rates we do not currently have any basis for. Inventing them would
violate the discipline in `METHODOLOGY-WHOOP.md`.

**PRS is the one that maps onto what Loop actually scores.** A polygenic risk score for
coronary artery disease is a statement about disease risk, which converts to life
expectancy the same way every other factor in the model does.

### Recommendation

1. **PRS becomes the genomics tier for the current WHOOP-only model.** It is the only
   ClawBio output that speaks the same language as the score.
2. **`nutrigx` ships with the food tier**, where its domains map one-to-one onto
   nutrients `METHODOLOGY.md` already scores (omega-3 → oily fish; alcohol, caffeine).
3. **Drop the clocks from scope** until there is a reason to ask users for an assay.

---

## 5. What PRS needs before it can score

A derivation, written into `METHODOLOGY-WHOOP.md` before any code, converting a PRS
percentile into a life-expectancy modifier. Starting points:

- Khera, A.V. et al. (2018). "Genome-wide polygenic scores for common diseases identify
  individuals with risk equivalent to monogenic mutations." *Nature Genetics*, 50:1219–1224.
  Top 8% of the CAD PRS distribution carry ~3-fold risk.
- Mars, N. et al. (2020). "Polygenic and clinical risk scores and their impact on age at
  onset and prediction of cardiometabolic diseases and common cancers." *Nature Medicine*,
  26:549–557. Gives **disease-free life-years by PRS decile** — the closest thing to a
  direct conversion into Loop's unit.

### Three caveats that must reach the UI

1. **PRS is a fixed modifier, not a daily factor.** Genetics do not change day to day.
   It scales the projection; it cannot move today's number. This is the stock-vs-flow
   problem from `SCOPE.md` §2 in its sharpest form.
2. **Ancestry portability is poor.** These scores are derived overwhelmingly from
   European cohorts and mis-calibrate badly outside that population. ClawBio ships an
   `equity` skill (FST, heterozygosity, population representation) specifically to
   surface this — we should run it and show the result, not bury it.
3. **The bundled panels are illustrative.** ClawBio prints "This is an illustrative
   ClawBio panel, not a PGS Catalog score" and the Corpasome's 0.1 percentile on a
   46-locus CAD panel looks like a crude reference distribution. For anything real, pull
   a validated score from the PGS Catalog by ID.

---

## 6. Architecture

ClawBio is Python, runs 10–15s on a 576k-SNP file, and needs a 215 MB checkout. It
**cannot run in a Vercel serverless function**. Options, cheapest first:

1. **Precompute for the demo.** Run ClawBio locally, commit the JSON output, read it at
   request time. Zero infrastructure — correct for a hackathon demo.
2. A separate Python worker (Fly/Railway/Modal) for real uploads, later.

Genomic data is the most sensitive category there is. Whatever ships, preserve ClawBio's
local-first posture: the genome should not be retained after analysis.
