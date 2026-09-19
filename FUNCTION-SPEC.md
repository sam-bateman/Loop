Longview — website functions spec

Placeholder name "Longview" — swap for the team's final name. Deploying on Vercel.

Core idea: turn what you eat into minutes of life gained or lost, personalized by your WHOOP metrics and (optionally) your genetics. One number, updated live as you log food.

1. Onboarding (first open)
No account, no email/password, no signup.
Single required step: Sync WHOOP (OAuth). After that, onboarding is done.
WHOOP stays connected to the band and auto-updates in the background, so it's never asked for again.
Optional step: Add genetics — "Have a 23andMe / AncestryDNA file? Add it for personalized results." Fully skippable.
Genetics upload is one-time. Processed once, then never shown in the daily flow again — only appears as "linked" in Settings.
App works fully on WHOOP + food alone if genetics is skipped.
2. Data sources
WHOOP (required). OAuth 2.0 sync. Auto-refreshes. Supplies sleep, recovery, HRV, resting HR, strain, workouts, calories, height/weight.
Genetics / ClawBio (optional). One-time file upload (23andMe / Ancestry export). Produces nutrigenomic risk factors used as score multipliers.
Food (user input). Photo or text description per meal. Detects the nutrients the score needs (fruit/veg servings, processed vs red meat, saturated fat, trans fat, sodium, added sugar, fibre).
3. Tabs / screens
Home (dashboard)
Hero: expected age — big WHOOP-style number at the top, the projected life expectancy at current habits.
Today's delta — small number under the hero (e.g. "−32 min today"), how today is moving the projection.
Food entry block — "What did you eat?" with two inputs:
Take / upload a photo
Describe it in text
Instant result — after logging, shows minutes gained/lost for that meal + a one-line reason, then updates the hero.
Recent meals row — last few logged meals, tap any to re-log in one press.
Saved meals — quick-access list of meals the user marked as saved (daily coffee, usual lunch), re-log without re-uploading.
WHOOP and genetics act silently as multipliers here. No data panels on the home screen unless the user taps into a tab.
Food log / history
Full chronological history of logged meals with each meal's score.
Running daily total and per-meal breakdown.
Filter by day / week.
"Save as meal" action on any logged item.
Edit or delete a past entry (recalculates the day).
Trends
Chart of expected age / cumulative minutes over time.
Daily net minutes as a bar chart (green = gained, red = lost).
Weekly summary vs baseline.
Optional: breakdown of what's driving the trend (food vs sleep vs recovery).
Profile
Age, sex, height, weight (pre-filled from WHOOP body measurement where available, editable).
Baseline life expectancy the score builds from.
Goal setting (optional): target age, or "stop losing time."
Read-only view of current personal modifiers in effect (age band, exercise level, sleep pattern, genetics if linked).
Settings
Connections
WHOOP: connected status, last sync time, reconnect, disconnect.
Genetics: linked / not linked, add file, remove file.
Units — imperial / metric.
Notifications — daily summary, meal reminders (off by default).
Data & privacy
Delete genetic data (prominent, since it's sensitive).
Delete all data / reset.
Note that genetics is processed locally / privately.
About — methodology link, data sources, disclaimer that this is a personalized estimate, not medical advice.
4. Scoring engine (background functions)

Based on the microlife methodology. Not a screen — runs behind every meal log.

Per-food scoring — assign minutes to each item: fruit/veg +7/serving, oily fish +15, processed meat −30, red meat −15, trans fat −12/g, saturated fat / sodium / sugar penalized only over a daily budget, fibre +6/5g.
Daily allowances — saturated fat, sodium, and sugar cost nothing until the day's running total passes a budget sized to the user's energy needs. Only the excess is penalized.
Diminishing returns — repeat benefits taper across the day (5th serving of veg is worth less than the 1st); penalties stay roughly linear.
WHOOP multipliers — sleep and exercise from WHOOP scale penalties (short sleep raises sugar/fat penalties; more active minutes lower all penalties). Recovery / HRV as additional signals.
Genetics multipliers — if linked, variant-based multipliers on specific penalties (e.g. sodium sensitivity ×1.4).
Age / sex modifiers — final score scaled by age band and sex.
Output — net minutes per meal → net minutes per day → feeds the expected-age projection on Home.
5. Tech notes for Vercel
Frontend — Next.js on Vercel fits well (React, fast deploy).
WHOOP OAuth needs a server — the client secret and token exchange must run server-side. Use Vercel serverless / API routes for: the OAuth callback, token refresh, and proxying WHOOP API calls. Never expose the secret in client code.
Register the app on WHOOP's developer dashboard, set the Vercel URL as the redirect URI, request scopes: read:sleep, read:recovery, read:cycles, read:workout, read:body_measurement, read:profile, offline.
Genetics / ClawBio — ClawBio is Python and local-first, which doesn't run natively on Vercel's edge. For the hackathon, either run genome processing as a separate service and call it, or simulate the genetic multipliers and label them as simulated. Decide early.
Food detection — photo/text → nutrients needs a vision or nutrition API (or a labeled simulation for the demo). This is the piece to prototype first, since the whole score depends on it.
State — meals, saved meals, and history need storage. A lightweight DB (Vercel Postgres / KV) keyed to the WHOOP user ID works without building your own auth.
6. Build priority for the hackathon
WHOOP sync working end to end (OAuth on Vercel).
Food entry → nutrients → score (even with a simulated detector).
Home hero (expected age) + today delta updating live.
Saved meals + history.
Genetics as an optional multiplier layer.
Trends + polish.
