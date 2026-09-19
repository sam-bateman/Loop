# Loop — Design Specification

**Version:** 0.1 (draft)
**Status:** For review. Nothing here is built yet.
**Companion doc:** [`METHODOLOGY.md`](METHODOLOGY.md) — the evidence base for every minute this product awards or subtracts.

---

## 0. One sentence

**Loop turns your WHOOP data and your consumer genome into a single live number: the minutes of life you have added or lost today.**

---

## 1. Product thesis

Health apps report *proxies* — a recovery percentage, a strain number, a ring that closes. Proxies require the user to already believe the proxy matters.

Loop reports the thing the proxy is a proxy *for*. One unit, one direction, one scale: **minutes**. A cigarette is −11 minutes. Forty minutes in Zone 2 is +3 hours and 50 minutes. Five hours of sleep is −30 minutes. Everything is denominated the same way, so everything is comparable, and the comparison is the product.

The genome is what makes the number *yours* rather than the population's. Two people eat the same steak; the one carrying a salt-sensitivity variant and an elevated cardiovascular polygenic score pays more for it. Without genetics, this is a well-designed calculator. With it, it is a personal instrument.

### What it is not

Stated plainly, and stated in-product (see §11):

- Not a medical device, not diagnostic, not a prediction about any individual's lifespan.
- The minutes are **population-level statistical estimates** rendered at individual scale. They describe how a cohort with these behaviours differs from a cohort without them. They do not describe what will happen to you.
- Polygenic scores are **relative percentiles within an ancestry group**, not verdicts.

### Positioning against the field

| | WHOOP | InsideTracker | Nutrisense | **Loop** |
|---|---|---|---|---|
| Unit | Strain / Recovery % | Biomarker ranges | Glucose mg/dL | **Minutes of life** |
| Genome | No | Partial (DNA add-on) | No | **Core input** |
| Behaviour → outcome link | Implicit | Implicit | Implicit | **Explicit and quantified** |
| Feels like | A coach | A lab report | A sensor | **An instrument** |

---

## 2. Scope

This is a hackathon build. The spec describes the full product, but flags what ships.

### In scope for v1 (demo)

- Web application, rendered inside a phone frame (see §9.5). Desktop browser is the delivery surface; mobile is the design target.
- WHOOP OAuth + pull of sleep, recovery, workout, cycle, and body-measurement data.
- Genome upload (23andMe / AncestryDNA raw export) → parse → variant extraction → **raw file destroyed** (§8).
- Scoring engine covering sleep, movement, recovery, intake, and the genomic modifier layer.
- Polygenic risk scores for a fixed panel of conditions, array-genotyped variants only (§5.4).
- The Organism — the live centrepiece visualisation (§9.4).
- Manual food logging via a short searchable list. No barcode scanning, no photo recognition.

### Out of scope for v1

- Native iOS/Android. No App Store, no HealthKit, no push notifications.
- Imputation pipeline for genome-wide PRS (§5.4 explains why this matters and what we do instead).
- Account recovery, billing, multi-user, social features, data export.
- Real-time WHOOP webhooks. v1 polls on page load and on a manual refresh.

### Explicitly deferred, not forgotten

Clinician review of the scoring constants; an ancestry-aware PRS calibration set; longitudinal accuracy validation.

---

## 3. The core model: Baseline and Ledger

This is the architectural idea the entire product hangs off. Get it right and everything else follows.

Two tiers, because two kinds of thing affect lifespan and they behave completely differently:

### Tier 1 — Baseline (who you are)

Slow-moving, trait-level, changes over months or never. Sets your **starting life expectancy** and the **multipliers** applied to everything in Tier 2.

| Input | Source | Effect |
|---|---|---|
| Age, sex | Profile | Actuarial base LE (period life table) |
| Polygenic risk scores | Genome | Shifts base LE; scales matching Ledger penalties |
| Single high-effect variants | Genome | Scales specific Ledger factors (salt, caffeine, alcohol) |
| VO₂ max estimate | WHOOP | Shifts base LE |
| Resting heart rate (28d avg) | WHOOP | Shifts base LE |
| BMI | Profile / WHOOP body measurement | Scales penalties (already in METHODOLOGY.md §5) |

Baseline recomputes **daily at most**. It is never part of "today's number."

### Tier 2 — Ledger (what you did)

Discrete, dated events. Each produces a signed minute value. This is the live number.

| Input | Source | Direction |
|---|---|---|
| Sleep duration, efficiency, consistency | WHOOP sleep | ± |
| Zone 2–5 minutes | WHOOP workout `zone_durations` | + |
| Sedentary time | WHOOP cycle | − |
| HRV / recovery trend | WHOOP recovery | ± |
| Food and drink | Manual log → METHODOLOGY.md §2 | ± |
| Smoking, alcohol | Manual log | − |

Ledger entries are **immutable once written**. Corrections are reversing entries, not edits. The history has to be trustworthy or the lifetime total is meaningless.

### Why the separation matters

It is the difference between "you have a 78th-percentile cardiovascular PRS" (baseline — nothing to do about it today) and "that was −30 minutes" (ledger — actionable now). Collapsing them into one number would make the product either fatalistic or dishonest. Visually, this maps directly onto the Organism: **core = Baseline, rings = Ledger** (§9.4).

---

## 4. Data sources and contracts

### 4.1 WHOOP

WHOOP Developer Platform, OAuth 2.0 authorization code flow.

**Scopes requested:** `read:profile`, `read:body_measurement`, `read:cycles`, `read:sleep`, `read:recovery`, `read:workout`.

**Objects consumed:**

| Object | Fields used | Feeds |
|---|---|---|
| `sleep` | `total_in_bed_time_milli`, `total_awake_time_milli`, `sleep_efficiency_percentage`, `sleep_consistency_percentage`, `slow_wave_sleep_time_milli`, `rem_sleep_time_milli`, `start`, `end` | Ledger: sleep |
| `recovery` | `hrv_rmssd_milli`, `resting_heart_rate`, `score` | Baseline: RHR · Ledger: recovery trend |
| `workout` | `zone_durations` (zone_zero…zone_five, ms), `strain`, `average_heart_rate`, `kilojoule` | Ledger: movement |
| `cycle` | `strain`, `start`, `end`, `average_heart_rate` | Ledger: sedentary inference |
| `body_measurement` | `height_meter`, `weight_kilogram`, `max_heart_rate` | Baseline: BMI, zone thresholds |

**Sync strategy (v1):** pull last 30 days on first connect, then on-demand refresh. Store raw payloads in a `whoop_raw` table keyed by WHOOP object id, so re-scoring after a constant change never requires a re-fetch.

**Notes:** token refresh is required — access tokens are short-lived. Handle the case of a user with no workouts (strain-only from cycle), and no recovery (no strap worn overnight). Gaps must render as **absent**, never as zero — a day with no data must not read as a day of perfect behaviour.

### 4.2 swabio — genome ingestion

> **Assumption flagged.** `swabio` is not present in this repository or reachable from this workspace. This section specifies the **contract Loop requires**, so the integration is defined regardless of what swabio's current API looks like. If swabio already does more than this, we use more of it; if less, this is the gap list.

**Input:** a 23andMe or AncestryDNA raw data export. Tab-separated, comment-prefixed header, one row per assayed marker:

```
# rsid  chromosome  position  genotype
rs4988235   2   136608646   AA
rs429358    19  44908684    TC
```

~600k–700k rows, 15–25 MB uncompressed. AncestryDNA splits the genotype across two allele columns; the parser must normalise both formats and handle strand orientation.

**Required interface:**

```ts
interface GenomeParser {
  // Streams the file; never holds it fully in memory.
  parse(stream: ReadableStream): AsyncIterable<Marker>;

  detectSource(header: string): 'twentythreeandme' | 'ancestrydna' | 'unknown';
  detectBuild(): 'GRCh37' | 'GRCh38';       // coordinate build — must be known before PRS
  detectChipVersion(): string;               // v3/v4/v5 — determines which rsids exist at all

  // Ancestry inference from genotype PCA. Required for PRS calibration (§5.4).
  inferAncestry(markers: Marker[]): AncestryProbabilities;
}

interface Marker {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;   // 'AA' | 'AG' | '--' (no-call)
}
```

**What we need that a naive parser will not give us:**

1. **Build detection.** PGS Catalog weights are published against a specific genome build. Scoring GRCh38 positions against GRCh37 weights silently produces garbage.
2. **Strand normalisation.** Consumer arrays report on the plus strand; some PGS weight files do not. A/T and C/G variants are ambiguous and must be either resolved by allele-frequency check or dropped.
3. **No-call handling.** `--` genotypes are common. The PRS must impute these to the population mean dosage (2 × effect-allele frequency) rather than treating them as zero.
4. **Ancestry PCA.** Without it, PRS percentiles are meaningless (§5.4, §11).

### 4.3 Food and manual events

v1 uses a curated local list of ~250 common foods and events, each pre-tagged with the fields METHODOLOGY.md §2 needs (`fruitVegServings`, `isProcessedMeat`, `saturatedFatG`, `sodiumMg`, …). No external nutrition API — the demo cannot afford a network dependency on stage, and a curated list scores more consistently than a database of user-submitted entries.

Special non-food events: cigarette, alcoholic drink, and a free-text "other" that scores zero but appears in the ledger.

---

## 5. Scoring engine

A pure TypeScript module. No I/O, no framework imports, fully deterministic, unit-tested against a fixture set. It must be possible to replay a user's entire history through a new version of the engine and diff the results.

```ts
score(events: LedgerEvent[], baseline: Baseline, day: DailyState) → ScoredEvent[]
```

### 5.1 Food layer — inherited

Unchanged from [`METHODOLOGY.md`](METHODOLOGY.md) §2–§5: per-serving rates, daily allowances, diminishing-returns tapers, double-counting guards, and the personalised multipliers. Ported from Swift to TypeScript with behaviour parity enforced by shared fixtures.

### 5.2 Movement — new

**Anchor study:** Wen, C.P. et al. (2011). *The Lancet*, 378:1244–53. 416,175 adults, mean 8.05 years follow-up. 92 min/week (~15 min/day) of moderate exercise → 14% reduction in all-cause mortality and **+3 years of life expectancy**, with a further 4% reduction per additional 15 min/day.

**Derivation, in the style of METHODOLOGY.md §6:**

```
Life expectancy gained          = 3 years × 525,600 min/year = 1,576,800 min
Exercise invested over 50 years = 15 min/day × 365 × 50      =   273,750 min
Return                          = 1,576,800 ÷ 273,750        ≈ 5.8 min of life per min of exercise
```

**Proposed rate: +6 minutes of life per minute of moderate-to-vigorous activity**, at the top of the curve.

**Diminishing returns.** Arem, H. et al. (2015), *JAMA Internal Medicine*, 175:959–67 (661,137 adults) shows the dose-response flattening hard above ~3× the physical activity guidelines, with no harm but no further benefit up to 10×. Weights applied per minute-block within a day:

```
minutes 0–15    ×1.00      → +6.0 min/min
minutes 15–30   ×0.60      → +3.6 min/min
minutes 30–60   ×0.30      → +1.8 min/min
minutes 60–90   ×0.12      → +0.7 min/min
minutes 90+     ×0.04      → +0.2 min/min
```

A 45-minute Zone 2 session therefore scores 15(6.0) + 15(3.6) + 15(1.8) = **+169 minutes**, not +270. This matters: without the taper, the app tells marathon runners they are immortal.

**Mapping from WHOOP.** Moderate-to-vigorous minutes = `zone_durations.zone_two + zone_three + zone_four + zone_five`, summed across workouts, converted from milliseconds. Zone one and zero are excluded — they are not the exposure the studies measured.

> ⚠️ **Needs review.** Wen et al. is a Taiwanese cohort; the effect size may not transfer directly. The +6 figure should be cross-checked against Moore, S.C. et al. (2012), *PLOS Medicine*, before it ships as a headline number.

### 5.3 Sleep — new

Three independent components. They are scored separately because they are independently predictive.

**a) Duration.** Cappuccio, F.P. et al. (2010), *Sleep*, 33(5):585–92 — meta-analysis, 1.38M participants. Short sleep (<7h) RR 1.12; long sleep (>9h) RR 1.30 for all-cause mortality.

Calibrating RR 1.12 against Spiegelhalter's (2012) microlife conversions for comparably-sized exposures gives habitual short sleep ≈ **−1 microlife/day (−30 min)** at roughly a 2-hour deficit below the 7–8h optimum:

```
Proposed: −15 min of life per hour of sleep below 7h, linear to a −90 min/night floor
```

Long sleep is penalised at a **third** the rate (−5 min/hour above 9h) and capped at −30 min. The RR 1.30 is substantially confounded by reverse causation — people sleep long *because* they are ill — and a health app that punishes sick users for resting is a broken product.

**b) Efficiency.** No direct mortality anchor of adequate quality. Scored as a **modifier**, not a standalone factor: efficiency below 85% scales the duration penalty by up to ×1.15. Time in bed is not time asleep, and WHOOP already distinguishes them.

**c) Regularity.** Windred, D.P. et al. (2024), *Sleep*, 47(1):zsad253 — UK Biobank, ~60,000 participants with accelerometry. Sleep Regularity Index in the lowest quintile vs. highest: HR 1.20–1.48 for all-cause mortality, and **regularity outperformed duration as a predictor**.

This is the most interesting finding in the sleep literature for this product and deserves to be a first-class factor:

```
Proposed, on WHOOP's sleep_consistency_percentage:
  ≥85%     +10 min      (high regularity is protective, not merely neutral)
  70–85%     0 min
  55–70%   −12 min
  <55%     −25 min
```

Regularity is scored on a **7-day trailing window**, not per-night — a single irregular night is not irregularity.

### 5.4 The genomic layer — new

The part that makes this product distinct, and the part most likely to be wrong if built carelessly.

#### The array-coverage problem — read this before building

The headline polygenic scores in the literature (e.g. Khera, A.V. et al. (2018), *Nature Genetics*, 50:1219–24, whose coronary artery disease score uses 6.6 million variants) are computed on **imputed** genotypes. A 23andMe raw file contains ~600,000 directly assayed markers. Scoring a 6.6M-variant PRS against a 600k-variant file does not produce a slightly worse score — it produces a number with no relationship to the published validation.

Doing this properly requires an imputation pipeline (reference panel, phasing, Minimac/Beagle). That is not a hackathon weekend.

**Decision for v1:** use **only PRS built from small, directly-genotyped variant sets**, plus high-effect single variants. Report them honestly as what they are. Ship the imputation pipeline as a v2 item, or integrate an existing imputation service.

#### 5.4.1 Single high-effect variants → Ledger multipliers

These are directly assayed on consumer arrays, individually well-characterised, and map cleanly onto factors the engine already scores. This is the highest-signal, lowest-risk genomics in the product.

| Gene / variant | rsID | Scales | Direction |
|---|---|---|---|
| APOE ε2/ε3/ε4 | rs429358 + rs7412 | Saturated fat penalty; baseline LE | ε4 carriers pay more for saturated fat |
| CYP1A2 | rs762551 | Caffeine effect | Slow metabolisers (C allele) lose the benefit, gain a penalty |
| ALDH2 | rs671 | Alcohol penalty | *2 carriers — substantially increased penalty |
| ADD1 / AGT | rs4961 / rs699 | Sodium penalty | Salt-sensitive genotypes ×1.3 |
| LCT | rs4988235 | Dairy handling | Informational |
| FTO | rs9939609 | Sedentary penalty | Risk allele ×1.15 |
| TCF7L2 | rs7903146 | Added-sugar penalty | Strongest common T2D variant |
| F5 (Factor V Leiden) | rs6025 | Sedentary penalty | Informational + modifier |
| HFE | rs1800562 | Red meat / heme iron | Modifier |
| 9p21 | rs10757278 | Baseline CVD | Baseline shift |

> ⚠️ **rsID availability varies by chip version.** rs429358 in particular is absent from some 23andMe chip versions. Every variant lookup must handle absence gracefully and the UI must say "not assayed on your chip" rather than silently omitting the factor.

#### 5.4.2 Polygenic risk scores

**Weight source:** the PGS Catalog (Lambert, S.A. et al. (2021), *Nature Genetics*) — an open repository of published scores with standardised metadata. Select scores by variant count (target: <10,000 variants, ideally <1,000) and by the availability of ancestry-stratified validation.

**Panel for v1:** coronary artery disease, type 2 diabetes, and one cancer. Three is enough to demonstrate the mechanism; more adds surface area without adding insight.

**Computation:**

```
PRS_raw = Σ (dosage_i × weight_i)     for each variant i in the score

  dosage_i = count of effect alleles (0, 1, 2)
           = 2 × EAF_i  if no-call        ← mean imputation
```

Then convert to a percentile within the user's **inferred ancestry group**, using the reference distribution published with the score.

**Feeding the model:** the PRS percentile shifts baseline life expectancy and scales matching Ledger penalties. It never produces its own ledger entries — a polygenic score is not something you did today.

```
CVD PRS 90th percentile → cardiovascular-linked penalties (sodium,
                          saturated fat, trans fat, sedentary) ×1.25
                        → baseline LE shifted per the score's published
                          hazard ratio, converted via life table
```

#### 5.4.3 The ancestry problem — non-negotiable

Martin, A.R. et al. (2019), *Nature Genetics*, 51:584–91, "Clinical use of current polygenic risk scores may exacerbate health disparities": PRS derived from European-ancestry GWAS lose **substantial** predictive accuracy in other populations — for some traits, most of it. This is not a footnote. A product that shows a confident percentile to a user of African ancestry, computed from a European-derived score, is producing a number that does not mean what the interface says it means.

**Requirements:**

1. Ancestry must be inferred before any PRS is displayed (§4.2).
2. Where an ancestry-matched reference distribution does not exist for a score, the product shows **reduced confidence explicitly** — a widened band and a plain-language note — or withholds the score.
3. The confidence state is a **first-class visual state** in the design system (§9.3), not a tooltip.

---

## 6. Composition order

The order matters and must be fixed, because the multipliers compound.

```
1. Baseline LE        actuarial(age, sex)
2.                    ± PRS shifts
3.                    ± VO₂ max, RHR shifts
                      ──────────────────────────
                      → baseline_life_expectancy

4. Ledger event       raw minutes from §5.1–5.3
5.                    × genomic single-variant modifiers  (§5.4.1)
6.                    × PRS category modifiers            (§5.4.2)
7.                    × profile modifiers                 (METHODOLOGY.md §5)
8.                    × daily taper / allowance           (METHODOLOGY.md §3–4)
                      ──────────────────────────
                      → scored_minutes
```

**Guard:** the product of all multipliers on any single event is clamped to **[0.4, 2.5]**. Without a clamp, a user who is female, high-BMI, salt-sensitive, high-CVD-PRS, sedentary and short-sleeping receives a compounded sodium penalty around 4× — a number the underlying studies cannot support. Every multiplier is estimated independently and they are not independent in reality.

Every `ScoredEvent` carries a full **attribution trace** — the raw value and each multiplier applied, named. This drives the explain view (§10.4) and makes the engine debuggable.

---

## 7. System architecture

Chosen for a weekend build with a live demo at the end. Boring where boring is correct; the novelty budget is spent entirely on the visualisation.

```
┌─────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router, TypeScript)                    │
│  ├── / …………………… The Organism (live view)                │
│  ├── /ledger ……… today's entries                        │
│  ├── /genome ……… upload + variant report                │
│  └── /explain/:id  attribution trace                    │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│  Route handlers (server-only)                           │
│  ├── /api/whoop/callback      OAuth exchange            │
│  ├── /api/whoop/sync          pull + normalise          │
│  ├── /api/genome/upload       stream parse → extract    │
│  └── /api/score               engine invocation         │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│  @loop/engine     pure TS, zero deps, 100% unit-tested  │
│  @loop/genome     parser + PRS + ancestry               │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│  Supabase — Postgres + Auth + RLS                       │
│  (no Storage bucket for genomes — see §8)               │
└─────────────────────────────────────────────────────────┘
```

**Stack:** Next.js 15, TypeScript strict, Tailwind for layout only (the Organism is hand-written SVG + CSS), Supabase for auth and Postgres with row-level security on every table.

**Deliberate non-choices:** no state management library (server components + URL state), no charting library (nothing off-the-shelf produces the Organism), no ORM (`postgres.js` and SQL), no genome storage bucket (§8).

---

## 8. Privacy — the genome is the whole risk surface

A WHOOP token leaks your sleep. A genome file leaks your family's medical future, permanently, unrevocably. It must be treated as the most sensitive object in the system, and the architecture should make that visible.

### The core decision: never store the raw file

```
upload → stream parse in memory → extract the ~250 rsids we score
       → compute PRS + ancestry PCA → persist ONLY:
             • the extracted genotype subset (encrypted at rest)
             • PRS percentiles + ancestry probabilities
       → the raw file is never written to disk, never written to a bucket,
         and is out of memory before the response returns
```

The user uploads 600,000 markers and we keep 250. This is both the correct engineering decision and the strongest thing we can say on stage.

### Additional requirements

- **Encryption:** the extracted genotype subset is encrypted with a per-user key before insert. Compromising the database alone must not yield genotypes.
- **RLS on every table.** No service-role key in any client-reachable code path.
- **No genome data in logs, error messages, analytics, or Sentry breadcrumbs.** An exception thrown mid-parse must not carry a `Marker` in its stack context.
- **No third-party sharing. Ever.** Not anonymised, not aggregated, not for research. Genomes are not anonymisable — that is a property of the data, not of our policy.
- **One-tap destruction.** A delete control that removes genotypes, PRS, and ancestry in a single transaction, with no soft-delete and no backup retention of genetic tables.
- **Consent is separate and specific.** A distinct consent step before upload, in plain language, covering what is extracted, what is kept, and what genetic information can imply about relatives who did not consent.

---

## 9. Visual design system — "The Organism"

### 9.1 The problem this design solves

This app tells you how much life you have left to spend. Two failure modes bracket it:

- **Too clinical** → it reads as a mortality report. Users bounce, or worse, spiral.
- **Too playful** → it reads as a novelty. Nobody believes the number, and given it is derived from IARC monographs and *Lancet* meta-analyses, that disbelief is a design failure.

The resolution: **make it feel alive rather than morbid.** The centrepiece is not a countdown or a gauge. It is an organism — something that breathes, holds its shape when you are consistent, and becomes agitated when you are not. It is your body, abstracted, rendered at 60fps.

### 9.2 Principles

1. **Nothing is decoration.** Every visual property — radius, hue, wobble amplitude, pulse rate, opacity — is bound to a data value. If it moves, it means something. This is what separates "unique" from "decorated," and it is the entire reason the design can be both distinctive and credible.
2. **The number is the hero.** The Organism surrounds it, never competes with it.
3. **Uncertainty is visible, not hidden.** Low-confidence values render with a soft edge. A confident number and an uncertain number must never look the same.
4. **Absence ≠ zero.** Missing data renders as a gap in the ring — visibly hollow, never as a neutral segment.
5. **Calm at rest.** Motion is slow and breath-like. Nothing flashes, nothing counts down, nothing is urgent.

### 9.3 Foundations

**Palette.** Near-black base. Four semantic hues, no more.

```css
:root {
  /* Substrate */
  --void:      #07090B;   /* page background                      */
  --membrane:  #0E1216;   /* raised surfaces                      */
  --hairline:  #1C2228;   /* 1px separators                       */

  /* Semantic — the only colours that carry meaning */
  --credit:    #38E1B0;   /* minutes gained — oxygenated, cool    */
  --debit:     #FF5B49;   /* minutes lost — arterial, not alarm   */
  --genome:    #A78BFA;   /* genetic layer — distinct from behaviour */
  --neutral:   #E8A33D;   /* at-threshold, caution                */

  /* Type */
  --bone:      #E8E6E1;   /* primary text — warm off-white        */
  --ash:       #8A9099;   /* secondary                            */
  --dust:      #4A5158;   /* tertiary, disabled                   */
}
```

`--debit` is deliberately an oxygenated arterial red rather than a warning red. The app subtracts minutes constantly; it must not look like an alarm going off all day.

Light mode is a v2 concern. The Organism depends on emission against darkness.

**Typography.**

| Role | Face | Notes |
|---|---|---|
| The number | **Instrument Serif** | Large, editorial, human. The serif is the "unique" decision — every competitor uses a grotesque here. It makes the number feel *written down* rather than computed. |
| Data / numerals | **Geist Mono** | Tabular figures, mandatory. Numbers must not shift horizontally as they tick. |
| UI / body | **Geist** | Tight tracking at small sizes. |

All three are freely licensed. `font-variant-numeric: tabular-nums` is non-negotiable on every changing value.

**Motion.**

- The pulse is the signature. Driven by `requestAnimationFrame` at the user's **live resting heart rate** from WHOOP — a 52 bpm athlete's app breathes visibly slower than a 74 bpm user's. This is the detail people will remember.
- The pulse easing follows a cardiac waveform, not a sine: fast systolic rise (~12% of the cycle), slower diastolic fall, brief rest. A sine wave reads as a pulsing button; this reads as a heartbeat.
- Scale amplitude ±1.5%. Anything larger becomes a distraction within thirty seconds.
- `prefers-reduced-motion: reduce` → the Organism becomes static, all data encoded in geometry and colour alone. **The visualisation must be fully legible without any animation.**

### 9.4 The Organism — component specification

Four concentric layers, outermost to innermost. Hand-authored SVG, ~420×420 viewBox, animated via CSS transforms and rAF-driven attribute updates.

```
        ╭───────────────────────╮
     ╭──╯    ◜◝◜◝◜◝◜◝◜◝◜◝    ╰──╮      ① CORONA — 24 hourly spines
   ╭─╯   ◜                    ◝  ╰─╮
  │    ╭───────────────────╮      │    ② BANDS — 4 factor arcs
  │  ╭─╯                   ╰─╮    │
  │ │        ╭───────╮        │   │
  │ │      ╭─╯       ╰─╮      │   │    ③ CORE — baseline
  │ │     │  +2h 14m   │      │   │
  │ │     │   TODAY    │      │   │
  │ │      ╰─╮       ╭─╯      │   │
  │ │        ╰───────╯        │   │
  │  ╰─╮                   ╭─╯    │
  │    ╰───────────────────╯      │    ④ MEMBRANE — 7-day volatility
   ╰─╮   ◟                    ◞  ╭─╯
     ╰──╮    ◟◞◟◞◟◞◟◞◟◞◟◞    ╭──╯
        ╰───────────────────────╯
```

**① Corona — 24 hourly spines**

One spine per hour of the current day, clockwise from midnight at 12 o'clock.

| Property | Bound to |
|---|---|
| Length outward | Net **credit** minutes in that hour |
| Length inward | Net **debit** minutes in that hour |
| Hue | `--credit` / `--debit` |
| Opacity | Confidence of that hour's scoring |
| Absent | Hours in the future, or with no data, render as a faint `--dust` tick — **visibly hollow** |

Lengths are square-root scaled. A +170 minute workout must not produce a spine ten times longer than a −18 minute snack, or every other hour becomes unreadable.

**② Bands — four factor arcs**

A ring of four arcs: **Sleep · Movement · Intake · Recovery**. Arc sweep = share of today's total absolute magnitude; arc colour = net direction of that factor. Tappable — each opens its ledger slice.

**③ Core — baseline**

The still centre. Holds the number.

- **Diameter** = baseline life expectancy relative to the population median for the user's age and sex. Above median → larger core. This is the only place genetics appears geometrically, and it does not move day to day.
- **Rim** = a thin `--genome` ring, its thickness bound to genomic contribution to the baseline shift.
- **Pulse** = live resting heart rate.
- **Low-confidence PRS** → the rim renders as a soft gradient rather than a defined stroke. An uncertain score is literally blurry. This is principle 3 made physical.

**④ Membrane — 7-day volatility**

The outer boundary. A closed path displaced by simplex noise. **Noise amplitude is bound to the standard deviation of the last 7 daily net scores.**

- Consistent week → a near-perfect, calm circle.
- Erratic week → a visibly agitated, lumpy boundary.

The membrane is the product's most important non-verbal message: **consistency is the goal.** A user can see at a glance whether their week held its shape, with no number and no text.

**Composite states**

| State | Rendering |
|---|---|
| No WHOOP connected | Corona all hollow; core present at population median; copy invites connection |
| No genome | Core rim absent entirely, not greyed — the genome layer is visibly *missing*, not broken |
| Net-negative day | Spines point predominantly inward; core unchanged. The organism does not shrink or wither — **the app must never visually punish the user's body** |
| First 24h | Membrane perfectly circular (no variance data), corona filling in live |

### 9.5 Delivery surface — the phone frame

The web app renders inside a fixed **390 × 844** device frame, centred on a `--void` field.

This is a design decision, not a limitation. The frame:
- Forces one-column, thumb-reachable composition — the layout the product will eventually ship in.
- Projects legibly in a demo room, where a full-width desktop layout would strand the Organism in whitespace.
- Signals "this is a mobile product" without the cost of building one.

Beside the frame on wide viewports: a quiet panel carrying the current attribution trace. On stage, that panel is what makes the number credible — every judge's first question is "where does that come from," and the answer is already on screen.

Below 480px viewport width, the frame dissolves and the app renders full-bleed.

---

## 10. Screens

### 10.1 Today — `/`
The Organism, the number, and a compressed ledger strip. Nothing else. The number reads as `+2h 14m`, never as `134` — hours-and-minutes keeps it human at scale.

### 10.2 Ledger — `/ledger`
Reverse-chronological, timestamped, signed. Running balance in the right column. Every row taps through to its explain view. Typographically this is the most conventional screen in the app, deliberately: it is the receipt, and receipts should look like receipts.

### 10.3 Genome — `/genome`
Pre-upload: the consent step and a plain-language account of what is extracted and what is discarded.
Post-upload: PRS percentiles with **explicit confidence bands**, the single-variant table (§5.4.1) with per-variant "not assayed on your chip" states, and inferred ancestry with its portability caveat stated in the interface — not in a footnote.

### 10.4 Explain — `/explain/:id`
The attribution trace for a single event, rendered as a vertical waterfall:

```
Processed meat, 1 serving              −30 min
  × salt-sensitive genotype (rs4961)   ×1.30
  × CVD PRS, 88th percentile           ×1.25
  × no exercise today                  ×1.08
  × compounding clamp applied          ×2.50 → clamped
  ─────────────────────────────────────────────
                                       −75 min
```

Every multiplier links to its source in `METHODOLOGY.md`. This screen is the product's integrity, and it is the answer to "is this made up?" — the honest answer being "no, and here is the chain."

---

## 11. Safety, ethics, and regulatory posture

### Positioning
Wellness and educational. **Not** a medical device, no diagnostic claims, no treatment recommendations, no disease-risk statements phrased as individual predictions. The language throughout is population-comparative: "people with this pattern," never "you will."

The FDA has acted against direct-to-consumer genetic health risk reporting before. Anything phrased as a personal disease-risk prediction moves the product toward device territory. Everything genomic is framed as **relative position within a reference population**, which is what a PRS actually is.

### The mortality-framing risk — a real product concern

A number that counts down your life is genuinely harmful to some people. Users with health anxiety, OCD, or eating disorders are a foreseeable part of any health app's audience.

**Design responses, all in v1:**

- **No lifetime countdown.** The product shows minutes *gained and lost*, never "time remaining." The distinction is the difference between a feedback instrument and a death clock.
- **The organism never withers.** A bad day changes the rings, never the core. The user's body is not rendered as degrading.
- **Gentle mode** — a settings toggle that shows only positive deltas and consistency, suppressing all negative values. Discoverable, not buried.
- **No streaks, no guilt mechanics, no notifications about a negative day.** Nothing in this product should create anxiety about opening it.
- Honest framing at first run: these are population averages, not a prediction about you.

### Genetic ethics
Consent covers implications for biological relatives who did not consent. No sharing under any framing (§8). Ancestry-portability limits stated in the interface, at the point of display.

---

## 12. Hackathon plan

### Build order

The dependency chain is: engine → data → visualisation. But the **visualisation is the demo**, so it starts early and in parallel against fixture data.

| Phase | Work | Gate |
|---|---|---|
| 1 | `@loop/engine` scaffolding + food layer ported from METHODOLOGY.md + fixture tests | Engine scores a known day correctly |
| 2 | WHOOP OAuth + sync + sleep/movement factors (§5.2–5.3) | Real WHOOP data produces a real number |
| 3 | **The Organism against fixture data** (parallel with 2) | It breathes |
| 4 | Genome parse + single-variant modifiers (§5.4.1) | An rsID changes a score |
| 5 | PRS on a fixed panel + ancestry inference (§5.4.2) | Core rim renders |
| 6 | Explain view, ledger, gentle mode | Every number traces to a source |
| 7 | Demo rehearsal with seeded data | Runs twice without a network call |

**Cut list, in order, if time runs short:** PRS panel shrinks to one condition → ancestry inference becomes a declared field → explain view becomes a static panel → manual food logging becomes a fixed set of demo buttons.

**Never cut:** the Organism, the explain trace, and the genome-destruction behaviour in §8. Those three are the demo.

### Demo script — 3 minutes

1. **The hook (20s).** Open on the Organism, already breathing. "This is my last 24 hours. Plus two hours and fourteen minutes of life. And it's pulsing at 54 beats per minute, because that's my resting heart rate right now."
2. **The mechanism (40s).** Tap the Movement band → the Zone 2 session → the explain trace. "Every minute of exercise buys about six minutes of life. That's from a *Lancet* cohort of 416,000 people. Nothing here is invented — it all traces back to the methodology doc."
3. **The genome (60s).** Upload a raw 23andMe file live. Watch the core rim appear. "That file had 600,000 markers. We kept 250 and destroyed the rest before the upload finished — we never write a genome to disk." Then show the same processed-meat entry scoring differently than it did before the upload.
4. **The membrane (30s).** "This outer edge is my last seven days. Smooth means consistent. Consistency is the thing that actually moves the number."
5. **The honesty (30s).** The ancestry-confidence state. "This score is less certain for me, and the app says so, because polygenic scores don't transfer across ancestries. Most consumer genetics products don't tell you that."

Point 5 is the differentiator. Every hackathon has a health app; almost none of them show their own limitations on stage.

**Demo hygiene:** seeded local data, zero live network calls in the critical path, a second browser profile pre-authed as a fallback, and the genome file already on the demo machine's desktop.

---

## 13. Open questions

1. **swabio's actual surface.** Not reachable from this workspace. §4.2 is a contract, not an integration — needs reconciling against the real thing before phase 4.
2. **The +6 min/min exercise rate.** Derived here from a single cohort. Needs a second anchor before it becomes a headline number.
3. **Baseline life-table source.** Which period life table — SSA, ONS, WHO? Affects every baseline number and needs to be fixed before §6 step 1 is implemented.
4. **PRS → life-expectancy conversion.** Converting a published hazard ratio to a life-expectancy shift requires a life-table calculation that is not yet specified.
5. **Double-counting between tiers.** VO₂ max (baseline) and Zone 2 minutes (ledger) measure overlapping things. Needs a guard analogous to METHODOLOGY.md's meat/sodium halving.
6. **The clamp bounds.** [0.4, 2.5] in §6 is a judgement call, not a derived figure.
7. **Clinical review.** Nothing in §5.2–5.4 has been reviewed by anyone with an epidemiology background. It should be before this is public, hackathon or not.

---

## 14. References

Inherits all 23 references from [`METHODOLOGY.md`](METHODOLOGY.md) §7. Additional sources introduced by this spec:

24. Wen, C.P. et al. (2011). "Minimum amount of physical activity for reduced mortality and extended life expectancy: a prospective cohort study." *The Lancet*, 378(9798):1244–53.
25. Arem, H. et al. (2015). "Leisure time physical activity and mortality: a detailed pooled analysis of the dose-response relationship." *JAMA Internal Medicine*, 175(6):959–67.
26. Moore, S.C. et al. (2012). "Leisure time physical activity of moderate to vigorous intensity and mortality: a large pooled cohort analysis." *PLOS Medicine*, 9(11):e1001335.
27. Windred, D.P. et al. (2024). "Sleep regularity is a stronger predictor of mortality risk than sleep duration: A prospective cohort study." *Sleep*, 47(1):zsad253.
28. Mandsager, K. et al. (2018). "Association of cardiorespiratory fitness with long-term mortality among adults undergoing exercise treadmill testing." *JAMA Network Open*, 1(6):e183605.
29. Zhang, D. et al. (2016). "Resting heart rate and all-cause and cardiovascular mortality in the general population: a meta-analysis." *CMAJ*, 188(3):E53–E63.
30. Khera, A.V. et al. (2018). "Genome-wide polygenic scores for common diseases identify individuals with risk equivalent to monogenic mutations." *Nature Genetics*, 50:1219–24.
31. Martin, A.R. et al. (2019). "Clinical use of current polygenic risk scores may exacerbate health disparities." *Nature Genetics*, 51:584–91.
32. Lambert, S.A. et al. (2021). "The Polygenic Score Catalog as an open database for reproducibility and systematic evaluation." *Nature Genetics*, 53:420–25.
33. Shaw, M., Mitchell, R. & Dorling, D. (2000). "Time for a smoke? One cigarette reduces your life by 11 minutes." *BMJ*, 320:53.
34. Jackson, S.E. et al. (2024). UCL estimate revising the per-cigarette cost upward to ~20 minutes (~17 min for men, ~22 min for women). *To be confirmed against the published paper before use in-product.*

---

*All scoring constants introduced in §5 are proposals derived from the cited literature. They have not been clinically reviewed. Flagged items marked ⚠️ are the ones most likely to change.*
