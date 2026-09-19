# Loop

Converts WHOOP biometrics into minutes of life expectancy, using the microlife unit
from Spiegelhalter (2012) and published mortality meta-analyses.

**Live:** https://loop-longevity.vercel.app

## How it works

WHOOP measures sleep duration and regularity, resting heart rate, HRV and training
load. Loop scores each of those against published all-cause-mortality dose-response
data, relative to the population-average adult, and reports the daily total in minutes
of life expectancy gained or lost.

Every rate is documented and cited in [`METHODOLOGY-WHOOP.md`](METHODOLOGY-WHOOP.md)
before it appears in code. `lib/scoring.ts` is the implementation; the two must not
drift apart.

The food-scoring model this is derived from is in [`METHODOLOGY.md`](METHODOLOGY.md).
Project scope and open decisions are in [`SCOPE.md`](SCOPE.md).

## Stack

- Next.js 16 (App Router) on Vercel
- `iron-session` — WHOOP tokens live in an encrypted cookie, no database
- WHOOP API v2, read-only scopes

## Local development

```bash
npm install
npm run dev
```

Requires `.env.local`:

```
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_SECRET=   # 32+ random bytes
```

`http://localhost:3000/api/auth/callback` is already registered as a redirect URL on
the WHOOP app.

## Constraints

- WHOOP app is on **Sandbox** tier: **10 connected members max.** Build tier (100)
  requires 5 connected first.
- Rate limits: 100 req/min, 10,000 req/day.

## Not medical advice

Population-level epidemiological estimates applied to an individual. See
[`METHODOLOGY-WHOOP.md` §7](METHODOLOGY-WHOOP.md) for the limitations, which are real.
