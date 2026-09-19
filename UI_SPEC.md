# Loop — UI Specification

**Version:** 0.1 (draft)
**Scope:** Visual design only — colour, type, geometry, motion, and component appearance.
**Not in scope:** flows, navigation, information architecture, interaction behaviour. Those live in [`DESIGN_SPEC.md`](DESIGN_SPEC.md).
**Companion docs:** [`DESIGN_SPEC.md`](DESIGN_SPEC.md) (product + architecture) · [`METHODOLOGY.md`](METHODOLOGY.md) (evidence base)

---

## 1. What it looks like

A near-black field. In the centre, a luminous ring structure that breathes at your resting heart rate. Over it, one number in a serif — plus or minus, hours and minutes. Everything else is hairlines, monospaced figures, and a lot of empty space.

The reference points are laboratory instruments and observatory displays, not fitness apps. Emission against darkness, not ink on paper.

---

## 2. Visual principles

1. **Nothing is decoration.** Every visual property — radius, hue, opacity, wobble amplitude, pulse rate — is bound to a data value. If it moves, it means something. This is the whole reason the design can be distinctive *and* credible.
2. **The number is the hero.** The ring surrounds it, never competes with it. Nothing else on the screen is larger or brighter.
3. **Uncertainty is visible.** A low-confidence value renders with a soft edge. A confident number and an uncertain number must never look identical.
4. **Absence is not zero.** Missing data renders as a visible gap — hollow, unfilled. Never a neutral-coloured segment.
5. **Calm at rest.** Motion is slow and breath-like. Nothing flashes. Nothing counts down. Nothing is urgent.
6. **Redundant encoding.** Meaning is never carried by hue alone. Direction is always *also* in geometry (outward/inward) and in a sign glyph.

---

## 3. Tokens

The complete token set. Copy this into `app/globals.css` as the single source of truth — no hard-coded colour or size values anywhere else in the codebase.

```css
:root {
  /* ─── Substrate ─────────────────────────────────────────── */
  --void:        #07090B;   /* page background                        */
  --membrane:    #0E1216;   /* raised surfaces, cards                 */
  --hairline:    #1C2228;   /* 1px separators, inactive strokes       */
  --scrim:       rgba(7,9,11,.72);

  /* ─── Semantic — the only hues that carry meaning ────────── */
  --credit:      #38E1B0;   /* minutes gained — oxygenated, cool      */
  --debit:       #FF5B49;   /* minutes lost — arterial, not alarm     */
  --genome:      #A78BFA;   /* genetic layer — distinct from behaviour*/
  --neutral:     #E8A33D;   /* at-threshold, caution                  */

  /* Dimmed variants for fills and inactive states */
  --credit-dim:  rgba(56,225,176,.16);
  --debit-dim:   rgba(255,91,73,.16);
  --genome-dim:  rgba(167,139,250,.16);

  /* ─── Type ──────────────────────────────────────────────── */
  --bone:        #E8E6E1;   /* primary text — warm off-white          */
  --ash:         #8A9099;   /* secondary text                         */
  --dust:        #4A5158;   /* NON-TEXT ONLY — ticks, rules, disabled */

  /* ─── Emission ──────────────────────────────────────────── */
  --glow-credit: 0 0 24px rgba(56,225,176,.30);
  --glow-debit:  0 0 24px rgba(255,91,73,.26);
  --glow-genome: 0 0 20px rgba(167,139,250,.28);
  --glow-core:   0 0 64px rgba(232,230,225,.10);

  /* ─── Type faces ────────────────────────────────────────── */
  --font-display: 'Instrument Serif', ui-serif, Georgia, serif;
  --font-ui:      'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono:    'Geist Mono', ui-monospace, 'SF Mono', monospace;

  /* ─── Type scale ────────────────────────────────────────── */
  --t-number:    44px;  /* the hero number, mobile frame              */
  --t-number-lg: 56px;  /* the hero number, ≥1024px                   */
  --t-display:   28px;  /* screen titles                              */
  --t-metric:    20px;  /* ledger values, PRS percentiles             */
  --t-body:      15px;
  --t-label:     11px;  /* uppercase, tracked                         */
  --t-micro:     10px;

  /* ─── Space — 4px base ──────────────────────────────────── */
  --s1: 4px;   --s2: 8px;   --s3: 12px;  --s4: 16px;
  --s5: 24px;  --s6: 32px;  --s7: 48px;  --s8: 64px;

  /* ─── Radii ─────────────────────────────────────────────── */
  --r-chip: 6px;  --r-card: 10px;  --r-pill: 999px;  --r-frame: 44px;

  /* ─── Motion ────────────────────────────────────────────── */
  --rhr: 60;                              /* set live from WHOOP     */
  --beat: calc(60s / var(--rhr));         /* one cardiac cycle       */
  --ease-out:  cubic-bezier(.16,1,.3,1);
  --ease-soft: cubic-bezier(.4,0,.2,1);
  --d-fast: 180ms;  --d-base: 320ms;  --d-slow: 520ms;
}
```

**Light mode is out of scope.** The design depends on emission against darkness; a light variant is a different design, not a recolour. `color-scheme: dark` is declared and no `prefers-color-scheme` branch exists.

---

## 4. Colour in use

### The four hues, and nothing else

| Token | Used for | Never used for |
|---|---|---|
| `--credit` | Outward spines, positive values, positive band arcs | Success toasts, generic "good" |
| `--debit` | Inward spines, negative values, negative band arcs | Errors, warnings, destructive actions |
| `--genome` | The core rim, PRS values, variant rows | Anything behavioural |
| `--neutral` | At-threshold values, low-confidence markers | General accent |

Destructive actions (delete genome) use `--bone` on `--membrane` with a `--debit` hairline border — not a filled red button. A filled red button in this palette reads as "you lost minutes," which is the wrong message on a confirmation.

### Why `--debit` is not a warning red

`#FF5B49` is an oxygenated arterial red, deliberately warmer and less saturated than a system error red. The app subtracts minutes continuously; a true alarm red would make the interface feel like a fault condition all day.

### Contrast

Measured against `--void` `#07090B`.

| Token | Ratio | Verdict |
|---|---|---|
| `--bone` #E8E6E1 | ~16.8:1 | ✅ Any size |
| `--credit` #38E1B0 | ~11.4:1 | ✅ Any size |
| `--genome` #A78BFA | ~7.4:1 | ✅ Any size |
| `--ash` #8A9099 | ~6.9:1 | ✅ Any size |
| `--neutral` #E8A33D | ~8.9:1 | ✅ Any size |
| `--debit` #FF5B49 | ~5.6:1 | ⚠️ **≥16px or bold only** |
| `--dust` #4A5158 | ~2.4:1 | ❌ **Never text.** Ticks, rules, disabled strokes only |

Two hard rules from this table:
- `--debit` must not be used below 16px. Small negative values render in `--bone` with a `−` glyph, not in red.
- `--dust` is a stroke colour. If it appears in a `color` property, that is a bug.

---

## 5. Typography

### The faces

| Role | Face | Why |
|---|---|---|
| The number | **Instrument Serif** | Every competitor uses a grotesque here. A serif makes the number feel *written down* rather than computed — it carries authority without the clinical coldness of a mono. This is the single most identity-defining choice in the system. |
| Data, figures | **Geist Mono** | Tabular figures. Mandatory wherever a value changes. |
| UI, body | **Geist** | Neutral, tight at small sizes, gets out of the way. |

All three are freely licensed. Self-host as `woff2`, subset to Latin, `font-display: swap`.

### Scale

| Token | Size / line-height | Face | Tracking | Use |
|---|---|---|---|---|
| `--t-number` | 44 / 0.92 | Display | −0.02em | The hero number |
| `--t-number-lg` | 56 / 0.92 | Display | −0.02em | Hero number ≥1024px |
| `--t-display` | 28 / 1.15 | Display | −0.01em | Screen titles |
| `--t-metric` | 20 / 1.2 | Mono | 0 | Ledger values, percentiles |
| `--t-body` | 15 / 1.5 | UI | 0 | Body copy, list rows |
| `--t-label` | 11 / 1.2 | UI | 0.08em | Uppercase section labels |
| `--t-micro` | 10 / 1.3 | Mono | 0.06em | Timestamps, rsIDs, units |

### Rules

```css
/* Non-negotiable on every value that changes. Without this,
   numbers shift horizontally as they tick and the whole
   interface jitters. */
.numeric { font-variant-numeric: tabular-nums; }
```

- **The number is always signed and always human-readable.** `+2h 14m`, never `134`, never `+134 min`. Hours-and-minutes keeps it legible at every magnitude.
- **The sign is part of the type**, set at 0.72em and `--ash` when the value is neutral-adjacent, full weight and semantic hue when it is not.
- **Uppercase labels are tracked at 0.08em.** Untracked uppercase at 11px is unreadable.
- **No italics anywhere.** Instrument Serif's italic is too expressive for a health context.
- **Maximum two faces per screen.** The mono and the display never appear in the same visual block, except in the ledger where the mono is the value column and the display is absent entirely.

---

## 6. Layout

### The frame

The app renders inside a fixed **390 × 844** device frame, centred on a `--void` field. This is a design decision: it forces one-column, thumb-reachable composition and projects legibly in a demo room.

```css
.frame {
  width: 390px;
  height: 844px;
  border-radius: var(--r-frame);
  background: var(--void);
  border: 1px solid var(--hairline);
  box-shadow:
    0 0 0 1px rgba(232,230,225,.03),
    0 40px 120px -20px rgba(0,0,0,.9);
  overflow: hidden;
  position: relative;
}
```

The surrounding field is `--void` with a single very soft radial gradient behind the frame, `rgba(56,225,176,.04)` at 60% radius — just enough that the frame reads as sitting *in* space rather than pasted on flat black.

### Internal grid

- Horizontal padding: `--s5` (24px) → 342px content width
- Vertical rhythm: `--s5` between major blocks, `--s3` within a block
- The centrepiece occupies a 342 × 342 square, top offset `--s8` (64px) from the frame top
- The hero number overlays the centrepiece's optical centre

### Wide viewport (≥1024px)

Frame shifts left of centre; a 360px attribution panel sits to its right with a `--s7` gap. The panel carries the current attribution trace in `--font-mono`, `--t-micro`, `--ash`.

The panel exists for one reason: the first question anyone asks about this product is "where does that number come from," and the answer should already be on screen.

### Below 480px

The frame dissolves — no border, no radius, no shadow. App renders full-bleed at viewport width. All internal measurements are unchanged.

---

## 7. The centrepiece — "The Organism"

> **Naming note.** With the product now called Loop and the centrepiece being a set of concentric rings, "The Organism" competes with the product name rather than reinforcing it. Alternatives worth a decision: keep as-is, or rename the layers to lean into the loop metaphor. Flagged, not resolved.

Four concentric layers, hand-authored SVG. **The hero number is HTML absolutely positioned over the SVG centre, not an SVG `<text>` element** — this gives real tabular-nums rendering, proper font loading, and selectable text.

### Canvas

```
viewBox="0 0 440 440"     centre (220, 220)
Rendered at 342 × 342 CSS px inside the frame → scale factor 0.777
```

### Layer radii — the master table

| Layer | Radius (viewBox units) | Stroke | Bound to |
|---|---|---|---|
| ③ Core disc | 44 – 64, nominal **54** | fill | Baseline LE vs population median |
| ③ Genome rim | **72** | 1.5 – 5 | Genomic share of baseline shift |
| ② Bands | **86** | 9 | Four factor arcs |
| ① Corona neutral | **148** | — | The zero line |
| ① Corona credit | 148 → **196** max | 3 | Positive minutes, outward |
| ① Corona debit | 148 → **100** min | 3 | Negative minutes, inward |
| ④ Membrane | **204** ± 12 | 1.5 | 7-day volatility |

Maximum extent 216 in a 440 box leaves a 4-unit margin. Nothing clips.

### ① Corona — 24 hourly spines

One spine per hour of the current day, clockwise from **midnight at 12 o'clock**.

```
Angle for hour h:   θ = −90° + (h × 15°)
Spine length:       L = 48 × √( min(|minutes|, 240) / 240 )
Direction:          outward if positive, inward if negative
Stroke:             3px, round linecap
```

Square-root scaling is load-bearing. A +170-minute workout next to a −18-minute snack would otherwise produce a 10:1 length ratio and make every small hour invisible. With the sqrt: 240min → 48 units, 120min → 34, 30min → 17.

| State | Rendering |
|---|---|
| Positive hour | `--credit`, outward, `--glow-credit` |
| Negative hour | `--debit`, inward, `--glow-debit` |
| Zero (data, no events) | 2-unit `--dust` tick on the neutral ring |
| **Absent** (no data / future) | 2-unit `--dust` tick at 40% opacity — **visibly hollow** |
| Low confidence | Same geometry, `opacity: 0.55` |

### ② Bands — four factor arcs

A ring of four arcs at r=86: **Sleep · Movement · Intake · Recovery**.

```
Available sweep:  360° − (4 gaps × 4°) = 344°
Arc sweep:        share of today's total absolute magnitude × 344°
Arc colour:       net direction of that factor
Stroke:           9 units, butt cap, no glow (bands are structure, not emission)
```

Bands are the only layer with a flat, non-glowing treatment. They are the scaffolding the corona hangs off, and glow here would muddy the spines.

### ③ Core — the still centre

```
Radius:  r = 54 + clamp(baseline_LE_delta_years × 2, −10, +10)
Fill:    radial-gradient, --bone at 6% centre → transparent at edge
Shadow:  --glow-core
Rim:     circle at r=72, stroke --genome, width 1.5–5 by genomic share
Pulse:   scale animation at live RHR (§8)
```

The core is the only element that does not change day to day. That stillness is deliberate — it is the visual statement that your baseline is not at stake in a single bad evening.

**Low-confidence PRS state:** the rim renders as a soft gradient stroke rather than a defined one — `filter: blur(2.5px)` plus reduced opacity. An uncertain score is *literally blurry*. This is principle 3 made physical, and it is the most important state in the system.

### ④ Membrane — 7-day volatility

A closed path sampled at 72 points (every 5°), radius displaced by simplex noise.

```
r(θ) = 204 + noise(cos θ, sin θ, t) × A
A    = clamp( stdev(last 7 daily net scores) / 90 × 12, 0, 12 )
```

Rendered as a smooth closed cubic path (Catmull-Rom → Bézier), 1.5-unit stroke, `--hairline` at rest, shifting toward `--neutral` as amplitude approaches maximum.

- Consistent week → a near-perfect calm circle
- Erratic week → a visibly agitated, lumpy boundary

The membrane carries the product's most important non-verbal message: **consistency is the goal.** A user reads their week at a glance with no number and no text.

The noise seed advances at **0.06 units/second** — slow enough that the movement is felt rather than watched.

### Composite states

| State | Rendering |
|---|---|
| No WHOOP connected | All 24 spines hollow; core at population median; membrane perfectly circular |
| No genome | Core rim **absent entirely** — not greyed. The layer is visibly missing, not broken |
| Net-negative day | Spines predominantly inward; **core unchanged, never shrunk**. The app must never render the user's body as degrading |
| First 24 hours | Membrane perfectly circular (no variance data yet); corona fills in live |

---

## 8. Motion

### The pulse — the signature

Driven by the user's **live resting heart rate** from WHOOP. A 52bpm athlete's app breathes visibly slower than a 74bpm user's. This is the detail people remember.

The easing follows a cardiac waveform, not a sine. A sine reads as a pulsing button; this reads as a heartbeat.

```css
@keyframes systole {
  0%   { transform: scale(1.000); }  /* diastolic rest          */
  8%   { transform: scale(1.015); }  /* rapid systolic rise     */
  14%  { transform: scale(1.012); }
  28%  { transform: scale(0.998); }  /* rapid fall, slight undershoot */
  36%  { transform: scale(1.004); }  /* dicrotic notch          */
  48%  { transform: scale(1.000); }
  100% { transform: scale(1.000); }  /* rest until next beat    */
}

.core {
  animation: systole var(--beat) var(--ease-soft) infinite;
  transform-origin: center;
}
```

`--rhr` is set from WHOOP on load; `--beat` derives from it. The entire behaviour is one custom property.

**Amplitude is capped at ±1.5%.** Anything larger becomes a distraction within thirty seconds of looking at it.

### Everything else

| Element | Motion |
|---|---|
| Spines, on load | Grow from the neutral ring, `--d-slow` `--ease-out`, staggered **18ms per hour index** — the day draws itself clockwise |
| Bands, on load | Arc sweep draws from 0, `--d-slow`, after the spines |
| Membrane | Continuous noise drift, 0.06 units/s. Never stops |
| Number, on load | Appears at final value. **No count-up animation** — a number rolling toward your life expectancy is ghoulish |
| Number, on new entry | The delta animates in as a separate chip; the total cross-fades at `--d-base` |
| Value changes | `--d-base` `--ease-soft`. Never a bounce, never an overshoot |

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .core { animation: none; }
  .membrane { --noise-t: 0; }
  * { transition-duration: 1ms !important; }
}
```

**The visualisation must be fully legible with zero animation.** Every value is encoded in geometry and colour; motion only ever adds texture. If a data point is only readable because something moves, that is a design bug.

---

## 9. Components

### 9.1 The number

```css
.hero-number {
  font-family: var(--font-display);
  font-size: var(--t-number);
  font-variant-numeric: tabular-nums;
  line-height: .92;
  letter-spacing: -.02em;
  color: var(--bone);
  text-shadow: var(--glow-core);
}
.hero-number .sign { font-size: .72em; color: var(--ash); margin-right: .06em; }
.hero-number.is-credit .sign { color: var(--credit); }
.hero-number.is-debit  .sign { color: var(--debit);  }
```

The value itself stays `--bone` in both directions. **Only the sign is coloured.** A full-red number at 44px dominates the screen and makes a mildly negative day feel like a catastrophe.

### 9.2 Delta chip

A small pill for an individual event's value.

```css
.delta {
  font-family: var(--font-mono);
  font-size: var(--t-micro);
  font-variant-numeric: tabular-nums;
  padding: 3px var(--s2);
  border-radius: var(--r-pill);
  border: 1px solid currentColor;
  background: var(--credit-dim);   /* or --debit-dim */
  color: var(--credit);            /* or --bone if <16px and negative */
}
```

### 9.3 Label

```css
.label {
  font-family: var(--font-ui);
  font-size: var(--t-label);
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ash);
}
```

### 9.4 Ledger row

The receipt. Deliberately the most conventional-looking thing in the app — receipts should look like receipts.

```
┌──────────────────────────────────────────────┐
│ 12:05   Processed meat, 1 serving    − 75m   │   ← mono, tabular, right-aligned
│         ↳ 3 modifiers applied                │   ← --t-micro, --dust
└──────────────────────────────────────────────┘
   1px --hairline bottom border, no top border
```

- Time: `--font-mono`, `--t-micro`, `--ash`
- Description: `--font-ui`, `--t-body`, `--bone`
- Value: `--font-mono`, `--t-metric`, tabular, right-aligned, `--bone` (sign carries the hue)
- Row height 56px, `--s3` vertical padding
- No zebra striping, no card, no shadow. Hairlines only.

### 9.5 Band legend

Four rows beneath the centrepiece, one per factor. Colour swatch (8px square, not a circle), label, value.

### 9.6 Confidence band — PRS display

The visual answer to §2 principle 3.

```
CORONARY ARTERY DISEASE

        ▏      ░░░▓▓▓█▓▓▓░░░        ▕
   0            ●  78th             100
        ╰─ confidence interval ─╯
```

- The percentile marker is a 6px `--genome` dot
- The interval is a gradient bar, `--genome` at 30% opacity, **width bound to the confidence interval**
- Low ancestry-match confidence → the bar widens *and* gains `filter: blur(1.5px)`
- A `--neutral` label reading `REDUCED CONFIDENCE — see note` sits directly beneath, in the interface, never in a tooltip

### 9.7 Variant row — genome table

```
rs4961        ADD1          GG        Salt-sensitive        ×1.30
rs429358      APOE          ——        Not assayed on your chip
```

- rsID: `--font-mono`, `--t-micro`, `--dust`
- Genotype: `--font-mono`, `--t-body`, `--bone`
- Not-assayed rows render at 45% opacity with `——` in the genotype column. **Never omitted silently** — the absence is information.

### 9.8 Waterfall row — attribution trace

```
Processed meat, 1 serving              −30 min
  × salt-sensitive genotype (rs4961)   ×1.30
  × CVD PRS, 88th percentile           ×1.25
  × no exercise today                  ×1.08
  × compounding clamp applied          ×2.50 → clamped
  ─────────────────────────────────────────────
                                       −75 min
```

All mono, tabular, right-aligned values. Multiplier rows indented `--s4` and set in `--ash`. The clamp row is `--neutral`. The rule above the total is 1px `--hairline`, full column width.

### 9.9 Empty / absent state

A `--dust` hairline outline of the element at 40% opacity, plus a `--t-micro` `--ash` label naming what is missing. **Never a spinner, never a zero, never a grey filled block.**

---

## 10. Screen compositions

Visual composition only. Flows and navigation are in `DESIGN_SPEC.md`.

### 10.1 Today — `/`

```
┌─────────────────────────────┐
│                             │  64px
│                             │
│         ◜◝◜◝◜◝◜◝            │
│      ◜             ◝        │  342×342 centrepiece
│     │    +2h 14m    │       │  ← 44px Instrument Serif, overlaid
│     │     TODAY     │       │  ← 11px tracked label
│      ◟             ◞        │
│         ◟◞◟◞◟◞◟◞            │
│                             │  24px
│  ▪ SLEEP      +1h 02m       │
│  ▪ MOVEMENT   +0h 41m       │  band legend
│  ▪ INTAKE     −0h 18m       │
│  ▪ RECOVERY   +0h 09m       │
│                             │
│  ───────────────────────    │  hairline
│  22:15  Screen past mid…    │  ledger strip, 3 rows max
│  17:40  Zone 2, 41 min      │
└─────────────────────────────┘
```

Three elements, in strict hierarchy: centrepiece, legend, ledger strip. Nothing else. No header, no nav bar, no logo on this screen — the ring *is* the brand mark.

### 10.2 Ledger — `/ledger`

Full-bleed list of 9.4 rows, reverse chronological. A sticky `--t-label` date header per day, `--membrane` background, no border. Running balance in `--font-mono` at the right of each date header.

### 10.3 Genome — `/genome`

Pre-upload: a single `--membrane` card, `--r-card`, containing the consent text at `--t-body` and a file input styled as a `--hairline` dashed outline.

Post-upload: PRS confidence bands (9.6) stacked with `--s5` gaps, then the variant table (9.7) beneath a `--t-label` header, then inferred ancestry with its portability note set in `--neutral` at `--t-body` — **in the layout, at full size, not as a footnote**.

### 10.4 Explain — `/explain/:id`

A single waterfall (9.8), vertically centred, nothing else on screen. Each multiplier row links to its source section in `METHODOLOGY.md`. This screen is the product's integrity made visible.

---

## 11. Accessibility of the visual system

| Concern | Response |
|---|---|
| Contrast | Enforced by the table in §4. `--debit` ≥16px only; `--dust` never text |
| Colour blindness | Credit/debit is a green/red pair — the classic failure. Mitigated by **redundant encoding**: direction is also geometric (outward vs inward spines) and glyphic (`+` / `−`). The visualisation is fully readable in greyscale |
| Reduced motion | §8. All data legible with zero animation |
| Focus | 2px `--credit` outline, 2px offset. Never removed, never `outline: none` |
| Text scaling | Frame height is fixed but all internal type uses `rem`; the ledger scrolls |
| Screen readers | The SVG carries `role="img"` and a generated `aria-label` stating today's net and each band's contribution in words. The centrepiece is decorative to AT; the HTML number and legend carry the meaning |

---

## 12. Implementation notes

**Build order** — the centrepiece is the demo, so it starts early against fixture data rather than waiting on the engine.

1. Tokens + fonts + frame shell
2. Static centrepiece, all four layers, hard-coded fixture values
3. Pulse + membrane drift
4. Data binding to real scored output
5. Components 9.1–9.5
6. Components 9.6–9.8 (genome + explain)
7. States: empty, absent, low-confidence, reduced-motion

**Technical:**
- Hand-authored SVG. No charting library — nothing off-the-shelf produces this.
- The centrepiece is one React component with a pure `(ScoredDay, Baseline) → geometry` function, unit-testable without rendering.
- Simplex noise: `simplex-noise` (~2KB) or hand-rolled. Seed per user id so a user's membrane is stable across sessions.
- All animation via CSS where possible; `requestAnimationFrame` only for the membrane noise.
- Tailwind for layout only. Colour, type, and the centrepiece are hand-written CSS against the tokens.

---

## 13. Open visual questions

1. **"The Organism" vs the Loop name** (§7). Needs a decision before component naming lands in code.
2. **Instrument Serif at 44px** — needs testing against real values. `+2h 14m` at 44px is ~150px wide; a four-digit day (`+18h 02m`) may need a size step down.
3. **Band order.** Sleep · Movement · Intake · Recovery is alphabetically arbitrary. Worth ordering by typical magnitude, or by time-of-day, so the ring reads consistently.
4. **Membrane amplitude divisor.** The `/90` in §7 is a guess; needs calibrating against real 7-day variance once the engine produces data.
5. **The number's colour.** §9.1 keeps the value `--bone` and colours only the sign. Worth A/B-ing against a fully coloured value at the demo.
6. **Wide-viewport panel** — currently attribution. Could instead carry the 30-day history, which may demo better.
