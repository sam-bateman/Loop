# Loop Methodology — WHOOP signals → microlives

Companion to [`METHODOLOGY.md`](METHODOLOGY.md) (the Liv food model). Same unit,
same citation discipline, same conservatism. This document covers the factors Loop
scores from WHOOP data.

---

## 1. The unit and the reference point

**1 microlife = 30 minutes of adult life expectancy** (Spiegelhalter 2012, *BMJ* 345:e8223).

Loop scores each day **relative to the population average adult**, not relative to an
ideal. This is Spiegelhalter's own framing: the average adult spends ~48 microlives/day,
and habits move you off that baseline in either direction. A day can therefore score
positive or negative.

Reference values used:

| Signal | Reference | Source |
|---|---|---|
| Sleep duration | 6.8 h | Sheehan et al. (2019), NHIS — US adult mean |
| Resting heart rate | 60 bpm | NHANES adult mean |
| Sleep consistency | 65% | WHOOP population midpoint |
| HRV | the user's own 30-day baseline | see §2.4 |

---

## 2. Scoring factors

| Factor | Rate | Shape |
|---|---|---|
| Sleep duration — above reference | **+9 min/h** | Linear to 8.5 h, then flat |
| Sleep duration — below reference | **−18 min/h** | Linear; asymmetric (risk rises faster than benefit) |
| Sleep duration — above 9.0 h | **−10 min/h** | Long-sleep arm of the J-curve |
| Sleep consistency | **±25 min** at the extremes | Linear in consistency %, clamped |
| Resting heart rate | **−10 min per 5 bpm** over 60 | Linear above reference |
| Resting heart rate | **+6 min per 5 bpm** under 60 | Tapers; no credit below 45 bpm |
| HRV vs. personal baseline | **±5 min per 10%** deviation | Clamped at ±20 min |
| Cardiovascular activity | **+6 min per 15 min** of moderate+ effort | Tapers; capped at +60 min/day |
| Sedentary day (strain < 6) | **−10 min** | Flat |
| Chronic strain > recovery | **×1.10 penalty multiplier** | Heuristic — see §5 |

### 2.1 Sleep duration — +9 / −18 min per hour

Cappuccio, F.P. et al. (2010). "Sleep duration and all-cause mortality: a systematic
review and meta-analysis of prospective studies." *Sleep*, 33(5):585–592.
16 cohorts, 1,382,999 participants. Short sleep (<7h): RR **1.12**. Long sleep (>9h):
RR **1.30**. [PubMed](https://pubmed.ncbi.nlm.nih.gov/20469800/)

Cross-checked against Svensson, T. et al. (2021). "Association of sleep duration with
all- and major-cause mortality among adults in Japan, China, Singapore, and Korea."
*JAMA Network Open*, 4(9):e2122837 — 322,721 participants, same J-curve shape.

**Conversion.** Spiegelhalter's own table assigns roughly **−1 microlife/day** to chronic
exposures sitting near HR 1.10–1.15 (e.g. 2h of sedentary television; 5 kg of excess
weight). Short sleep at RR 1.12 lands in that band, so chronic <6h sleep is scored at
**−30 min/night** — reached by the −18 min/h rate at ~5.1h. The positive arm is set at
half the magnitude (+9 min/h) because the evidence for *long* sleep being protective is
absent — the curve is J-shaped, not monotonic, so extra hours past 8.5h earn nothing and
past 9.0h cost 10 min/h.

### 2.2 Sleep consistency — ±25 min

Windred, D.P. et al. (2024). "Sleep regularity is a stronger predictor of mortality risk
than sleep duration." *Sleep*, 47(1):zsad253. UK Biobank, n=60,977, 7-day accelerometry.
Most-irregular vs. most-regular quintile: all-cause mortality HR **1.53**.
[PubMed](https://pubmed.ncbi.nlm.nih.gov/37903116/)

HR 1.53 across the full quintile spread would justify roughly ±60 min/day. Loop uses
**±25 min** — deliberately conservative, because WHOOP's "sleep consistency %" is a
proprietary 4-day metric, not the validated Sleep Regularity Index used in the paper,
and the mapping between them is unvalidated.

### 2.3 Resting heart rate — −10 min per 5 bpm over 60

Zhang, D. et al. (2016). "Resting heart rate and all-cause and cardiovascular mortality
in the general population: a meta-analysis." *CMAJ*, 188(3):E53–E63. 46 cohorts,
1,246,203 participants. All-cause mortality HR **1.09 per 10 bpm** increase.
[PubMed](https://pubmed.ncbi.nlm.nih.gov/26598376/)

Cross-checked against Jensen, M.T. et al. (2013). "Elevated resting heart rate,
physical fitness and all-cause mortality." *Heart*, 99(12):882–887 (Copenhagen Male
Study) — HR 1.16 per 10 bpm, fitness-adjusted.

HR 1.09 per 10 bpm ≈ 0.9 microlives ≈ 27 min/day. Loop uses **−10 min per 5 bpm**
(= −20 min per 10 bpm), below the Zhang point estimate.

The benefit arm is smaller (+6 min per 5 bpm) and stops at 45 bpm: below that, low RHR
stops indicating fitness and starts indicating bradycardia, and the mortality curve is
not linear there.

### 2.4 HRV — ±5 min per 10% from personal baseline

Hillebrand, S. et al. (2013). "Heart rate variability and first cardiovascular event in
populations without known cardiovascular disease: meta-analysis and dose-response
meta-regression." *Europace*, 15(5):742–749. Low HRV → HR **1.35** for cardiovascular
events; ~32% risk reduction per SD increase in HRV.
[PubMed](https://pubmed.ncbi.nlm.nih.gov/23370966/)

⚠️ **Weakest factor in the model.** Absolute RMSSD varies 3–4× between healthy
individuals of the same age, so absolute thresholds are meaningless. Loop scores
*deviation from the user's own rolling 30-day baseline*, which is not what the
meta-analysis measured. Rate is clamped at ±20 min and halved when RHR is already
scoring negative (§4) — both signals are autonomic and largely redundant.

### 2.5 Cardiovascular activity — +6 min per 15 min of effort

Wen, C.P. et al. (2011). "Minimum amount of physical activity for reduced mortality and
extended life expectancy: a prospective cohort study." *The Lancet*, 378(9798):1244–1253.
416,175 participants, 8-year follow-up. 15 min/day of moderate exercise → **14% lower
all-cause mortality and ~3 years longer life expectancy**; each additional 15 min/day
reduced mortality a further 4%, with benefit plateauing past ~100 min/day.
[PubMed](https://pubmed.ncbi.nlm.nih.gov/21846575/)

Cross-checked against Lee, D. et al. (2014). "Leisure-time running reduces all-cause and
cardiovascular mortality risk." *JACC*, 64(5):472–481 — 5–10 min/day of running,
~3 years gained.

**Why the rate is so much lower than the paper implies.** Wen's 3 years over ~50 years of
adherence arithmetically works out to ~86 min of life gained per day of 15-min exercise.
Loop uses **+6 min**, roughly 7% of that, for three reasons:
1. The 3-year figure is a *population life-table* contrast between habitually active and
   habitually inactive people, not the marginal value of one workout.
2. It carries the full confounding load of observational activity research — the
   habitually active differ systematically from the inactive.
3. Liv's model already discounts hard where confounding is heavy (§2, saturated fat).

Tapering follows Wen's own dose-response: weights `[1.0, 1.0, 0.7, 0.5, 0.3, 0.2]` per
15-minute block, hard-capped at +60 min/day.

### 2.6 Sedentary day — −10 min

Ekelund, U. et al. (2016). "Does physical activity attenuate, or even eliminate, the
detrimental association of sitting time with mortality?" *The Lancet*, 388(10051):1302–1310.
Harmonised meta-analysis, >1 million participants. Already cited in `METHODOLOGY.md` §5.

A WHOOP day strain below 6 corresponds to minimal cardiovascular load. Flat −10 min.

---

## 3. Diminishing returns

Mirrors `METHODOLOGY.md` §3: **benefits taper, penalties stay linear.**

- **Activity** tapers per the weights in §2.5 and caps at +60 min/day.
- **Sleep duration** benefit stops entirely at 8.5h and reverses past 9.0h.
- **RHR benefit** tapers below 50 bpm and stops at 45 bpm.
- **HRV** is clamped at ±20 min in both directions.
- Sleep deficit, elevated RHR, and the sedentary penalty do **not** taper.

---

## 4. Double-counting guards

Direct analogues of the meat × saturated-fat guard in `METHODOLOGY.md` §2.

1. **HRV × RHR** — when RHR scores negative, the HRV penalty is halved (×0.5).
   Both measure autonomic tone; the meta-analyses overlap in their cohorts.
2. **Consistency × duration** — when sleep duration scores negative, the consistency
   penalty is halved (×0.5). Windred's regularity index partly encodes duration.
3. **Activity × RHR** — the RHR *bonus* is halved on days that already score an activity
   bonus. Low RHR is largely a consequence of training; Jensen's estimate is explicitly
   fitness-adjusted and ours is not.
4. **Liv food model overlap** — `METHODOLOGY.md` §5 uses exercise and sleep as
   *multipliers on food penalties*. When Loop's nutrition tier ships, those multipliers
   must be disabled, or exercise and sleep get counted twice. Tracked in `SCOPE.md`.

---

## 5. Personalized modifiers

Age multiplier carried over unchanged from `METHODOLOGY.md` §5 (Fadnes et al. 2022) —
the same day's behaviour buys less remaining life at 70 than at 25:

| Age | Multiplier |
|---|---|
| 20s | ×1.00 |
| 30s | ×0.92 |
| 40s | ×0.85 |
| 50s | ×0.78 |
| 60s | ×0.70 |
| 70s | ×0.50 |
| 80+ | ×0.30 |

**Strain-recovery imbalance — ×1.10 on all penalties.** Applied when the 7-day mean day
strain exceeds 14 while the 7-day mean recovery is below 40%.

⚠️ **This modifier has no mortality evidence behind it.** There is no cohort study
linking WHOOP recovery scores to lifespan. It is included as a conservative heuristic
consistent with the overtraining literature, is flagged as such in the UI, and should be
the first thing removed if the model is ever validated.

---

## 6. What Loop deliberately does not score

| Signal | Why not |
|---|---|
| SpO2 | No general-population mortality dose-response in non-clinical ranges |
| Skin temperature | Illness-detection signal, not a longevity signal |
| Respiratory rate | Same — acute deviation, not chronic risk |
| Recovery score (directly) | Proprietary composite; scoring it would double-count HRV + RHR + sleep |
| Blood pressure | Strong evidence, but WHOOP does not measure it |

---

## 7. Known limitations

1. **Stock vs. flow.** Food microlives are per-serving flows. RHR is a standing state.
   Loop scores a *day*, so states are converted to a per-day rate — but a single day's
   RHR reading is a weak estimate of a chronic state. Scores smooth over 7 days.
2. **Observational evidence only.** Every rate here comes from cohort studies. None of
   these associations are established as causal.
3. **Additivity is assumed.** The factors are summed. The underlying meta-analyses
   overlap in cohorts, so the true joint effect is almost certainly smaller than the
   sum. §4's guards are partial mitigation, not a fix.
4. **Not medical advice.** These are population-level epidemiological estimates applied
   to an individual, which is a category error the user should understand.

---

## 8. Reference list

1. Spiegelhalter, D.J. (2012). *BMJ*, 345:e8223. [PubMed](https://pubmed.ncbi.nlm.nih.gov/23247978/)
2. Cappuccio, F.P. et al. (2010). *Sleep*, 33(5):585–592. [PubMed](https://pubmed.ncbi.nlm.nih.gov/20469800/)
3. Svensson, T. et al. (2021). *JAMA Network Open*, 4(9):e2122837.
4. Windred, D.P. et al. (2024). *Sleep*, 47(1):zsad253. [PubMed](https://pubmed.ncbi.nlm.nih.gov/37903116/)
5. Zhang, D. et al. (2016). *CMAJ*, 188(3):E53–E63. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26598376/)
6. Jensen, M.T. et al. (2013). *Heart*, 99(12):882–887.
7. Hillebrand, S. et al. (2013). *Europace*, 15(5):742–749. [PubMed](https://pubmed.ncbi.nlm.nih.gov/23370966/)
8. Wen, C.P. et al. (2011). *The Lancet*, 378(9798):1244–1253. [PubMed](https://pubmed.ncbi.nlm.nih.gov/21846575/)
9. Lee, D. et al. (2014). *JACC*, 64(5):472–481.
10. Ekelund, U. et al. (2016). *The Lancet*, 388(10051):1302–1310.
11. Fadnes, L.T. et al. (2022). *PLOS Medicine* — life-table modeling.
12. Sheehan, C.M. et al. (2019). *Sleep*, 42(2):zsy221 — NHIS sleep duration trends.

---

## 9. Genomics tier (ClawBio) — guidance, not a score

**Loop does not score your genome.** An earlier version of this section converted
polygenic risk scores into a "baseline life expectancy shift" in minutes per day. That
was removed, deliberately, for three reasons:

1. **It was unactionable.** You cannot change your genome. A number attached to it gives
   the user nothing to do, which is the opposite of what the rest of this document is
   for.
2. **It collided with the daily score.** Two numbers in the same unit, on the same
   screen, meaning entirely different things, made both harder to read.
3. **The inputs could not support it.** ClawBio labels its bundled panels "illustrative,
   not a PGS Catalog score." Their reference distributions are coarse enough that the
   demo genome lands at the 0.1st percentile on a 46-locus CAD panel — a resolution 46
   variants cannot legitimately provide. Converting that into minutes of life would have
   claimed a precision that does not exist.

### 9.1 What the genome is used for instead

Three kinds of output, ranked by how well established the evidence is:

| Output | Source | Evidence |
|---|---|---|
| **Medication guidance** | ClawBio `pharmgx` → [CPIC guidelines](https://cpicpgx.org/) | **Strongest.** Pharmacogenomics is used clinically; CPIC guidance is peer-reviewed and actively maintained |
| **Nutrition and supplements** | ClawBio `nutrigx` | Moderate. Associations with blood biomarkers, not measured deficiencies |
| **Habit weighting** | CYP1A2 caffeine, ADH1B/ALDH2 alcohol | Weak, and shown as context — it is *not* applied as a multiplier to the §2 factors |

ClawBio's own recommendation text is shown verbatim rather than paraphrased. It is
carefully hedged — the omega-3 entry, for instance, points out that a blood test is a
better guide to need than a genotype — and rewriting someone else's medical guidance is
how that nuance gets lost.

### 9.2 Why habit weighting is displayed but not scored

A slow CYP1A2 metaboliser really does clear caffeine more slowly, and that plausibly
costs them sleep — which §2.1 scores directly. It is tempting to scale the sleep penalty
accordingly. Loop does not, because there is no published rate for it: no study gives
minutes of life lost per unit of caffeine per CYP1A2 genotype. Inventing one would
violate the discipline the rest of this document runs on. The user is told the
connection exists and left to act on it.

### 9.3 Disease risk scores

Still computed and displayed, as **percentiles with their coverage and reference
population attached**, and explicitly not converted into any life-expectancy figure.

Two limitations are surfaced in the interface rather than buried:

- **Panels below 50% SNP overlap are refused.** A 23andMe chip does not carry every
  variant in a score. On the demo genome this drops atrial fibrillation (5/12) and BMI
  (42/97). Loop reports the refusal instead of scoring a partial panel.
- **Ancestry portability is poor.** These scores are derived overwhelmingly from
  European-ancestry cohorts and lose much of their accuracy elsewhere. Every score shows
  its reference population.

### 9.4 A ClawBio bug worth reporting upstream

Running `pharmgx` against the raw 576k-SNP 23andMe file finds 23 of 32 pharmacogenomic
SNPs but leaves **all 13 genes with unmapped diplotypes**, so every drug returns
"insufficient data". The same genotype via ClawBio's pre-extracted subset (`--demo`)
maps cleanly and returns 1 avoid / 24 caution / 17 standard. The demo bundle uses the
latter. The raw-file path needs fixing before real user uploads can work.

### 9.5 References

24. Khera, A.V. et al. (2018). "Genome-wide polygenic scores for common diseases identify individuals with risk equivalent to monogenic mutations." *Nature Genetics*, 50:1219–1224. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30104762/)
25. Inouye, M. et al. (2018). "Genomic risk prediction of coronary artery disease in 480,000 adults." *JACC*, 72(16):1883–1893. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30309464/)
26. Mars, N. et al. (2020). "Polygenic and clinical risk scores and their impact on age at onset and prediction of cardiometabolic diseases and common cancers." *Nature Medicine*, 26:549–557. [PubMed](https://pubmed.ncbi.nlm.nih.gov/32273609/)
27. Martin, A.R. et al. (2019). "Clinical use of current polygenic risk scores may exacerbate health disparities." *Nature Genetics*, 51:584–591. [PubMed](https://pubmed.ncbi.nlm.nih.gov/30926966/)
28. GBD 2019 Diseases and Injuries Collaborators. *The Lancet*, 396:1204–1222.
29. Corpas, M. (2013). "Crowdsourcing the Corpasome." *Source Code for Biology and Medicine*, 8, 13.
