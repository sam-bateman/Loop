# Liv Methodology & Research Reference

Single reference for every equation, threshold, and citation behind Liv's minutes-of-life score. Source of truth is [`ios/Liv/Core/Scoring/MicrolifeScoring.swift`](ios/Liv/Core/Scoring/MicrolifeScoring.swift); see [`algorithm-updates.md`](algorithm-updates.md) for the change history and [`science.html`](science.html) for the public-facing version (currently a step behind — see note at bottom).

---

## 1. The unit: microlives

Liv's core unit is the **microlife** = 30 minutes of adult life expectancy, from:

> Spiegelhalter, D.J. (2012). "Using speed of ageing and 'microlives' to communicate the effects of lifetime habits and environment." *BMJ*, 345:e8223. DOI: 10.1136/bmj.e8223. [PubMed](https://pubmed.ncbi.nlm.nih.gov/23247978/)

An average adult "spends" ~48 microlives/day (24 hours). Spiegelhalter converted relative-risk ratios from large meta-analyses into microlives gained/lost per exposure — Liv applies the same conversion method per serving instead of per day, using the HENI (Health Economic and social costs of Nutrition and food policies) framework for point estimates:

> Stylianou, K.S. et al. (2021). "Health impacts in 2018 by consumption of macronutrients and their sources, globally, regionally and in 195 countries." *HENI framework.*

---

## 2. Scoring factors (current code)

| Factor | Rate | Notes |
|---|---|---|
| Fruit/veg (per serving, cap 5/scan) | **+7 min** | Tapers within a day — see §3 |
| Oily fish (omega-3) | **+15 min** | Tapers within a day — see §3 |
| Processed meat | **−30 min** | Linear, no allowance |
| Red meat (non-processed) | **−15 min** | Linear, no allowance |
| Saturated fat | **−7 min per 5g** over daily allowance | Only excess past budget is penalized |
| Trans fat | **−12 min per 1g** | No safe threshold — always penalized |
| Sodium | **−6 min per 500mg** over daily allowance | Only excess past budget is penalized |
| Added sugar | **−4.5 min per 10g** over daily allowance | Skipped if fruit/veg present (avoids double count) |
| Fibre | **+6 min per 5g** | Skipped if fruit/veg present; tapers past target — see §3 |

**Double-counting guards:**
- When `isProcessedMeat` or `isRedMeat` is true, saturated fat and sodium penalties are halved (×0.5) — the meat categorical penalty already captures most of that risk.
- When `fruitVegServings > 0`, the sugar penalty and fibre bonus are skipped — the fruit/veg bonus already covers it.

### Per-factor evidence

- **Fruit/veg — +7 min/serving**
  Wang, X. et al. (2014). "Fruit and vegetable consumption and mortality from all causes, cardiovascular disease, and cancer: systematic review and dose-response meta-analysis." *BMJ*, 349:g4490. 16 cohorts, 833,234 participants; HR 0.95 per daily serving, plateauing ~5 servings/day. [PubMed](https://pubmed.ncbi.nlm.nih.gov/25073782/)
  Cross-checked against:
  - Fadnes, L.T. et al. (2022). Life-table modeling of dietary changes on life expectancy. *PLOS Medicine.* (~7.5 min/serving from optimal-vs-typical fruit intake conversion — see §6 for the derivation)
  - Wang et al. (2021), *Circulation* — dose-response meta-analysis of 26 cohorts (HR 0.87 at 5 servings/day); used for the diminishing-returns curve, not the base rate
  - GBD 2019 dietary risk factors (~4–8 min range)
  - Spiegelhalter (2012) — ~0.2 microlives/serving ≈ 6 min

- **Oily fish (omega-3) — +15 min**
  HENI salmon estimate (Stylianou et al. 2021).

- **Processed meat — −30 min**
  IARC/WHO (2015). Reviewed 800+ studies; classified processed meat as **Group 1 carcinogen**; 50g/day → 18% increased colorectal cancer risk. [WHO Q&A](https://www.who.int/news-room/questions-and-answers/item/cancer-carcinogenicity-of-the-consumption-of-red-meat-and-processed-meat)

- **Red meat (non-processed) — −15 min**
  IARC Monograph 114 (2015). Classified unprocessed red meat as **Group 2A, "probably carcinogenic to humans."** [IARC press release](https://www.iarc.who.int/wp-content/uploads/2018/07/pr240_E.pdf)
  GBD mortality scaling used to size the base rate relative to processed meat.

- **Trans fat — −12 min/g**
  de Souza, R.J. et al. (2015). "Intake of saturated and trans unsaturated fatty acids and risk of all cause mortality, cardiovascular disease, and type 2 diabetes: systematic review and meta-analysis of observational studies." *BMJ*, 351:h3978. Trans fat: RR 1.34 all-cause mortality, 28% increase in CHD mortality. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26268692/)
  WHO/GBD CHD risk scaling applied for the per-gram rate.

- **Saturated fat — −7 min/5g over allowance**
  Same de Souza et al. (2015) meta-analysis — found *no* significant standalone all-cause mortality association for saturated fat (RR 0.99), which is why Liv uses a conservative, threshold-based (not linear) penalty tied to AHA's ideal-intake ceiling rather than a strong per-gram rate. GBD mortality scaling calibrates the magnitude.

- **Sodium — −6 min/500mg over allowance**
  Strazzullo, P. et al. (2009). "Salt intake, stroke, and cardiovascular disease: meta-analysis of prospective studies." *BMJ*, 339:b4567. 13 studies, 177,025 participants; RR 1.23 stroke risk. [PubMed](https://pubmed.ncbi.nlm.nih.gov/19934192/)
  Mozaffarian, D. et al. (2014). "Global sodium consumption and death from cardiovascular causes." *NEJM*, 371:624–634. ~1.65M CV deaths/year attributable to excess sodium. [NEJM](https://www.nejm.org/doi/full/10.1056/NEJMoa1304127)
  GBD sodium risk factor used for per-mg scaling.

- **Added sugar — −4.5 min/10g over allowance**
  Huang, Y. et al. (2023). "Total sugar, added sugar, fructose, and sucrose intake and all-cause, cardiovascular, and cancer mortality." *Nutrition.* Each additional daily sugar-sweetened beverage serving → ~8% increase in all-cause mortality (HR 1.08). [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S089990072300062X)
  Rate deliberately conservative relative to this HR.

- **Fibre — +6 min/5g**
  Li, B. et al. (2024). "Dietary fiber intake and all-cause and cause-specific mortality: an updated systematic review and meta-analysis." *Clinical Nutrition*, 43(1):65–77. 64 studies, 3.5M+ participants; HR 0.77 (23% mortality reduction) for high vs. low fiber intake; 10% reduction per 10g/day increment. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38011755/)
  GBD fiber protective factor used to calibrate rate and tapering curve.

---

## 3. Diminishing returns (`DailyIntake`, code §"Budget helpers")

Repeat benefits taper across the day; penalties do **not** — repeat exposure to processed meat or trans fat is treated as roughly linear risk.

**Fruit/veg** — per-serving weights across the day:
```
[1.0, 1.0, 0.7, 0.4, 0.25, 0.1, 0.1, 0.1]
```
i.e. avocados #1–#5 in a day score +7, +7, +5, +3, +2 min — not +7 flat each. Modeled on Wang et al. (2021, *Circulation*): dose-response falls fastest over the first two-to-three servings and flattens past ~5/day.

**Oily fish** — weights `[1.0, 0.3, 0.1]`: omega-3 benefit tops out near two servings *a week*, so a same-day second serving adds little.

**Fibre** — tiered credit against the day's target (`DailyAllowances.fibreTargetG`):
- Full credit (weight 1.0) up to 50% of target
- 60% credit from 50%–100% of target
- 20% credit from 100%–150% of target
- Nothing beyond 150%

Implemented as `MicrolifeScoring.creditedUnits` — a piecewise-linear step function, not a single formula.

---

## 4. Daily allowances (`DailyAllowances.forProfile`)

Penalizable nutrients (saturated fat, sodium, added sugar) cost nothing until the day's *running total* passes an allowance sized to the user's estimated energy needs. Only the portion of a serving that pushes the day **past** the allowance is penalized (`overBudget()`):

```
overBudget(amount, prior, allowance) = max(0, prior + amount − allowance) − max(0, prior − allowance)
```

Energy estimate: Mifflin-St Jeor BMR × an activity factor derived from `exerciseMinutesPerDay`. Falls back to 2,000 kcal/day with no profile.

| Allowance | Formula | Source |
|---|---|---|
| Saturated fat | 6% of daily energy ÷ 9 kcal/g | AHA ideal intake |
| Added sugar | min(5% of daily energy ÷ 4 kcal/g, 36g male / 25g female / 30g default) | WHO conditional recommendation (5% of energy); AHA per-sex ceilings |
| Sodium | 2,300mg + min(12mg × exercise minutes, 1,000mg) | CDRR chronic-disease upper limit; sweat sodium losses ≈ 800–1,000 mg/L, ≈1 L/hour moderate exercise |
| Fibre target | (calories ÷ 1,000) × 14g | IOM adequate intake |
| Fruit/veg target | 5 servings/day (fixed) | Wang et al. (2021, *Circulation*) — mortality benefit plateau |

---

## 5. Personalized modifiers (`MicrolifeScoring.score`)

Applied multiplicatively when a `UserProfile` is present:

| Modifier | Affects | Multiplier | Source |
|---|---|---|---|
| Age 20s | Final score | ×1.0 | Fadnes et al. (2022) |
| Age 40s | Final score | ×0.85 | " |
| Age 60s | Final score | ×0.70 | " |
| Age 70s | Final score | ×0.50 | " |
| Age 80+ | Final score | ×0.30 | " |
| Female | Sodium penalty | ×1.3 | DASH-Sodium sex-stratified analysis |
| High BMI (>27) | Sodium penalty | ×1.3 | PMC10406397 |
| Male | Red meat penalty | ×1.15 | Heme-iron meta-analysis |
| No daily exercise | All penalties | ×1.08 | Ekelund, U. et al. (2016), *Lancet* |
| Exercise 30–59 min/day | All penalties | ×0.92 | " |
| Exercise 60+ min/day | All penalties | ×0.85 | " |
| Sleep <6h | Sugar + sat-fat penalties | ×1.20 | Spiegel et al. (1999); Cappuccio et al. (2010) |
| Sleep 6–7h | Sugar + sat-fat penalties | ×1.08 | " |

Multipliers compound — e.g. female + high BMI = 1.3 × 1.3 = **1.69×** sodium penalty.

- Ekelund, U. et al. (2016). "Physical activity attenuates the association between sitting time and mortality." *The Lancet.*
- Spiegel, K. et al. (1999). "Impact of sleep debt on metabolic and endocrine function." *The Lancet.*
- Cappuccio, F.P. et al. (2010). "Sleep duration and all-cause mortality: a systematic review and meta-analysis." *Sleep.*

---

## 6. Historical calibration note — fruit/veg conversion math

From the 2026-03-21 rate correction (+15 → +7 min/serving), derived from Fadnes et al. (2022):

```
Optimal fruit intake = 400 g/day (~5 servings) vs. typical = 200 g/day (~2.5 servings)
Fruit contribution to life expectancy ≈ 0.5–0.8 years for a 20-year-old
Extra servings over 50 years = 2.5/day × 365 × 50 = 45,625 servings
0.65 years × 525,600 min/year = 341,640 min
341,640 min ÷ 45,625 servings ≈ 7.5 min/serving
```

Rounded to +7 min/serving, cross-validated against Spiegelhalter (2012) (~6 min), GBD 2019 (~4–8 min), and Wang (2021) dose-response curve.

---

## 7. Full reference list

1. Spiegelhalter, D.J. (2012). "Using speed of ageing and 'microlives' to communicate the effects of lifetime habits and environment." *BMJ*, 345:e8223. [PubMed](https://pubmed.ncbi.nlm.nih.gov/23247978/)
2. Stylianou, K.S. et al. (2021). "Health impacts in 2018 by consumption of macronutrients and their sources, globally, regionally, and in 195 countries." (HENI framework)
3. Wang, X. et al. (2014). "Fruit and vegetable consumption and mortality from all causes, cardiovascular disease, and cancer." *BMJ*, 349:g4490. [PubMed](https://pubmed.ncbi.nlm.nih.gov/25073782/)
4. Wang, D.D. et al. (2021). Dose-response meta-analysis of fruit/vegetable intake and mortality (26 cohorts). *Circulation.*
5. Fadnes, L.T. et al. (2022). Life-table modeling of dietary pattern changes and life expectancy. *PLOS Medicine.*
6. GBD 2019 Risk Factors Collaborators. Dietary risk factor estimates. *Global Burden of Disease Study 2019.*
7. International Agency for Research on Cancer / WHO (2015). "IARC Monographs evaluate consumption of red meat and processed meat." Press Release No. 240. [WHO](https://www.who.int/news-room/questions-and-answers/item/cancer-carcinogenicity-of-the-consumption-of-red-meat-and-processed-meat) · [IARC Monograph 114](https://www.iarc.who.int/wp-content/uploads/2018/07/pr240_E.pdf)
8. de Souza, R.J. et al. (2015). "Intake of saturated and trans unsaturated fatty acids and risk of all cause mortality, cardiovascular disease, and type 2 diabetes." *BMJ*, 351:h3978. [PubMed](https://pubmed.ncbi.nlm.nih.gov/26268692/)
9. Strazzullo, P. et al. (2009). "Salt intake, stroke, and cardiovascular disease: meta-analysis of prospective studies." *BMJ*, 339:b4567. [PubMed](https://pubmed.ncbi.nlm.nih.gov/19934192/)
10. Mozaffarian, D. et al. (2014). "Global sodium consumption and death from cardiovascular causes." *NEJM*, 371:624–634. [NEJM](https://www.nejm.org/doi/full/10.1056/NEJMoa1304127)
11. Huang, Y. et al. (2023). "Total sugar, added sugar, fructose, and sucrose intake and all-cause, cardiovascular, and cancer mortality." *Nutrition.* [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S089990072300062X)
12. Li, B. et al. (2024). "Dietary fiber intake and all-cause and cause-specific mortality: an updated systematic review and meta-analysis." *Clinical Nutrition*, 43(1):65–77. [PubMed](https://pubmed.ncbi.nlm.nih.gov/38011755/)
13. Ekelund, U. et al. (2016). "Physical activity attenuates the association between sitting time and mortality: a harmonised meta-analysis." *The Lancet.*
14. Spiegel, K. et al. (1999). "Impact of sleep debt on metabolic and endocrine function." *The Lancet.*
15. Cappuccio, F.P. et al. (2010). "Sleep duration and all-cause mortality: a systematic review and meta-analysis of prospective studies." *Sleep.*
16. AHA (American Heart Association). Ideal saturated fat intake guidance (<6% of energy).
17. WHO. Conditional recommendation on free/added sugar intake (<5% of energy).
18. IOM (Institute of Medicine). Dietary Reference Intakes — fibre adequate intake (14g/1,000 kcal).
19. CDRR (Chronic Disease Risk Reduction) sodium intake upper limit, 2,300mg/day.
20. Mifflin, M.D. et al. (1990). "A new predictive equation for resting energy expenditure in healthy individuals." *American Journal of Clinical Nutrition.* (Mifflin-St Jeor BMR equation, used for daily calorie/allowance estimation)
21. DASH-Sodium trial sex-stratified sodium sensitivity analysis.
22. Heme-iron intake meta-analysis (male red-meat risk modifier).
23. PMC10406397 — BMI and sodium sensitivity.

---

**Sync note:** `science.html` (the public methodology page) currently shows red meat at −12 min and a flat "penalize sodium over 500mg/serving" rule. The code has since moved to −15 min for red meat and the daily-allowance/budget model in §4. If you want, I can update `science.html` to match.
