# Whoopy-Time — Scope

Longevity insight app: WHOOP biometrics scored through the Liv microlife methodology,
with an optional genomics tier powered by ClawBio.

Status as of 2026-09-19: **pre-build.** Repo contains `README.md` and a copied
`METHODOLOGY.md`. No code, no backend, no app target.

---

## 1. Resource inventory (verified)

### 1.1 Liv methodology — ✅ have it, but it's food-only

| Asset | Location | Notes |
|---|---|---|
| `METHODOLOGY.md` | this repo (copy) | 23 citations, all rates + thresholds |
| `MicrolifeScoring.swift` | `/OS/liv/ios/Liv/Core/Scoring/` | 411 lines — the scoring engine |
| `DailyNutritionSummary.swift` | same dir | 176 lines |
| `MetabolicImpact.swift` | same dir | 221 lines |
| `FoodQuality.swift` | same dir | 173 lines |
| `UserProfile.swift` | `/OS/liv/ios/Liv/Core/Models/` | 109 lines — age/sex/BMI/exercise/sleep |
| Full SwiftUI app | `/OS/liv/ios/Liv/` | Features, Theme, Storage, Widget target |
| Serverless API | `/OS/liv/api/` | 5 JS endpoints (Vercel), Neon + Blob deps |
| `science.html` | `/OS/liv/` | public methodology page (known to be a step behind code) |

**Portable now:** the microlife unit (1 microlife = 30 min), the personalization
multiplier table (§5 — age, sex, BMI, exercise, sleep), the diminishing-returns
machinery (`creditedUnits`, `overBudget`), and the citation discipline.

**Reusable directly:** §5 already contains *exercise* and *sleep* modifiers
(Ekelund 2016; Spiegel 1999; Cappuccio 2010) — but only as multipliers on food
penalties, never as standalone scored factors.

### 1.2 WHOOP API — ✅ credentials live, app configured

App **"Taylor"**, client ID `43b23d24-0e6d-4ff2-834a-9bc4276ad07d`.
Dashboard verified signed-in via BrowserOS neo.

- **Tier:** Sandbox — **10 connected members max.** Build tier = 100; each promotion
  requires half the current cap actually connected.
- **Scopes granted (all six):** `read:recovery`, `read:cycles`, `read:sleep`,
  `read:workout`, `read:profile`, `read:body_measurement`
- **Redirect URL:** `https://pallasai.dev/auth/callback` (single, already registered)
- **Webhooks:** none configured
- **Rate limits:** 100 req/min, 10,000 req/day
- **Credentials:** `WHOOP_CLIENT_ID` + `WHOOP_API_KEY` (the client secret) in
  `~/.claude/keys.env` — both present and correctly shaped
- **Base URL:** `https://api.prod.whoop.com/developer/v2/`
- **Auth:** OAuth2 authorization-code (`/oauth/oauth2/auth` → `/oauth/oauth2/token`)

Available signals: recovery score, HRV, RHR, SpO2, skin temp, sleep stages +
performance %, respiratory rate, day strain, workout strain, avg/max HR,
height/weight/max HR.

### 1.3 ClawBio — ✅ public, installable, but needs genomic input

`github.com/ClawBio/ClawBio` — MIT, public, Python 3.11+, `pip install clawbio`.
97 skills, 5,040 tests, Zenodo DOI. Also ships as a Claude Code plugin and as
plain Agent Skills folders.

Directly relevant skills:

| Skill | What it gives us | Input required |
|---|---|---|
| `methylation-clock` | Epigenetic age (PyAging clocks) | 450k/EPIC array or GEO accession |
| `proteomics-clock` | Organ-specific biological age (Goeminne 2025) | Olink NPX data |
| `organ-aging-studio` | Per-protein contribution breakdown | Olink NPX data |
| `wgs-prs` / `gwas-prs` | Polygenic risk scores | VCF |
| `nutrigx` | Nutrigenomic diet guidance | 23andMe / AncestryDNA / VCF |
| `ancestry-risk-profiler` | Ancestry-adjusted risk | genotype data |
| `pharmgx-reporter` | Pharmacogenomic dosing | genotype data |

⚠️ **Every one of these requires a genome or an assay the user must upload.**
WHOOP provides zero genomic data. ClawBio is therefore a *separate opt-in tier*,
not an integration point — see §3.

### 1.4 Hosting / infra — ⚠️ partial

- `pallasai.dev` resolves, **served by Vercel**, 307s to `www.pallasai.dev`.
  The WHOOP redirect already points at `pallasai.dev/auth/callback` — that route
  does not exist yet.
- Liv's Vercel link (`/OS/liv/.vercel/project.json`) is absent from disk;
  Liv's `package.json` shows the stack: `@neondatabase/serverless` + `@vercel/blob`.
- **No database, no session store, no token store exists for this project.**

---

## 2. The actual gap — this is the build

The Liv methodology scores **food**. WHOOP measures **sleep, recovery, strain,
HRV, RHR, VO2-adjacent signals**. There is currently **no microlife rate table
for any WHOOP signal.** That table is the product's core IP and it does not exist.

What has to be derived, with the same citation rigor as `METHODOLOGY.md` §2:

| Signal | Needs | Candidate evidence base |
|---|---|---|
| Sleep duration | min/hr vs. 7–8h reference | Cappuccio 2010 (already cited); Svensson 2021 JAMA |
| Sleep consistency | min per hr of midpoint variance | Windred 2024 *Sleep* |
| Resting heart rate | min per bpm above/below baseline | Jensen 2013 *Heart*; Zhang 2016 |
| HRV (RMSSD) | min per ms, age-adjusted | Hillebrand 2013 *Europace* |
| Cardio fitness / strain | min per MET-hr, with a J-curve | Lee 2014 *JACC*; Wen 2011 *Lancet* |
| Overtraining / low recovery | penalty for chronic strain > recovery | Contested — needs a conservative rate |
| Respiratory rate, SpO2, skin temp | probably **exclude v1** | Weak mortality evidence |

**Recommendation:** treat this as its own deliverable — `METHODOLOGY-WHOOP.md`,
written before any scoring code, mirroring the existing doc's structure
(rate table → per-factor evidence → diminishing returns → allowances →
personalization → full reference list). Rates should be deliberately conservative,
as §2 already does for saturated fat and added sugar.

Two methodology problems that need an explicit decision:

1. **Double-counting.** §5 already uses exercise and sleep as *multipliers* on food
   penalties. If they also become *scored factors*, the same evidence is counted
   twice. Needs the same guard pattern the food model uses for meat×satfat.
2. **Stock vs. flow.** Food microlives are a per-serving flow. Sleep and RHR are
   states. A night of 5h sleep is a flow event; an RHR of 48 is a standing
   condition. These cannot share one accumulator without a defined conversion.

---

## 3. Proposed architecture

```
┌─ Tier 1 — WHOOP (everyone) ────────────────────────────────┐
│  OAuth → daily pull → microlife scoring → insights feed    │
│  Signals: sleep, recovery, HRV, RHR, strain, workouts      │
└────────────────────────────────────────────────────────────┘
┌─ Tier 2 — Nutrition (optional) ────────────────────────────┐
│  Liv's existing food engine, ported or shared              │
└────────────────────────────────────────────────────────────┘
┌─ Tier 3 — Genomics (opt-in upload) ────────────────────────┐
│  ClawBio, run locally/server-side on user-supplied VCF     │
│  → biological age, PRS, nutrigenomics as score modifiers   │
└────────────────────────────────────────────────────────────┘
```

Tier 3's role: ClawBio outputs (epigenetic age delta, PRS percentiles) become
**personalization multipliers** in the §5 sense — not new scored factors. That
keeps the unit coherent and sidesteps the stock/flow problem.

### Backend shape

| Piece | Proposal | Why |
|---|---|---|
| `/auth/callback` | Vercel route on `pallasai.dev` | Already the registered redirect |
| Token store | Postgres (Neon) — refresh tokens encrypted at rest | Liv already uses Neon |
| Data sync | Cron pull (WHOOP webhooks are unconfigured; add later) | 100/min limit is generous for ≤10 users |
| Scoring | Server-side, so iOS + web share one engine | Avoids a second Swift/TS implementation |
| ClawBio | Separate worker — Python, long-running, never in a serverless fn | Genomics jobs exceed function timeouts |

---

## 4. Hard constraints

1. **10 users.** Sandbox tier. "Full-scale app" is not launchable until WHOOP
   promotes the app — and promotion to Build (100) requires 5 connected members
   first. Plan for a closed beta.
2. **One redirect URL.** `https://pallasai.dev/auth/callback`. Local dev needs
   either a tunnel or a second registered URL.
3. **Health claims.** Microlife outputs are epidemiological estimates, not medical
   advice. Liv's `science.html` + disclaimer pattern should be carried over before
   any public launch.
4. **Genomic data is the most sensitive category there is.** If Tier 3 ships,
   ClawBio's local-first posture should be preserved — ideally genomes never leave
   the user's device or are deleted immediately post-analysis.
5. **`science.html` drift.** Liv's public page already disagrees with Liv's code.
   Whatever we build should have a single source of truth from day one.

---

## 5. Decisions made (2026-09-19, 3-hour hackathon)

- [x] **Platform** — web only, mobile-optimized. No iOS client.
- [x] **Domain** — its own: `loop-longevity.vercel.app` (Vercel project `loop`).
- [x] **Tier 3 timing** — after the WHOOP loop works.
- [x] **Storage** — no database. WHOOP tokens live in an `iron-session` encrypted
      cookie. Correct for a 10-user sandbox; revisit before Build tier.
- [ ] **Nutrition tier** — still open. If it ships, `METHODOLOGY.md` §5's exercise and
      sleep multipliers must be disabled (see `METHODOLOGY-WHOOP.md` §4 guard 4).
- [ ] **ClawBio relationship** — vendored dependency, or upstream contribution?

## 5a. Shipped

- `METHODOLOGY-WHOOP.md` — 7 scored factors, 12 citations, explicit limitations
- `lib/scoring.ts` — the engine, with §4 double-counting guards
- `lib/whoop.ts` — OAuth + v2 client with token refresh
- Landing, dashboard, and public methodology page
- WHOOP redirect URLs now: `pallasai.dev/auth/callback` (untouched),
  `loop-longevity.vercel.app/api/auth/callback`, `localhost:3000/api/auth/callback`

---

## 6. Suggested sequence

1. `METHODOLOGY-WHOOP.md` — the rate table with citations. Everything blocks on this.
2. OAuth loop: `/auth/callback` on `pallasai.dev` + encrypted token store. Prove
   one real WHOOP account syncs end to end.
3. Sync + storage: daily pull of cycles/sleep/recovery/workouts into Neon.
4. Scoring engine implementing §1, server-side, with a test suite mirroring
   ClawBio's red/green discipline.
5. Client — per the platform decision.
6. Tier 3 — ClawBio worker, opt-in genome upload.
