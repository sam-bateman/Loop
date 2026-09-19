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
