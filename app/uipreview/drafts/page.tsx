import Link from "next/link";
import Organism from "@/components/loop/Organism";
import Switcher from "@/components/loop/Switcher";
import Wordmark from "@/components/loop/Wordmark";
import {
  DAY_SPINE_CLAMP,
  SAMPLE_24_DAYS,
  SAMPLE_BANDS,
  SAMPLE_HOURS,
  SAMPLE_LAST_7,
  SAMPLE_RHR,
} from "@/lib/loop/fixtures";

export const metadata = { title: "Loop — landing page drafts" };

const DRAFTS = [
  {
    slug: "a",
    name: "The Instrument",
    thesis: "Show the product, say almost nothing.",
    body: "The orthodox reading of UI_SPEC.md. A visitor sees the real Today screen — breathing at 54bpm, Intake rendering as a visible gap — before being asked for anything. Copy is minimal because the ring is the argument.",
    bet: "The visualisation is good enough to sell on sight.",
    risk: "A cold visitor does not yet know what the ring means, and the hero number is +53m, which is honest but quiet.",
  },
  {
    slug: "b",
    name: "The Receipt",
    thesis: "Lead with the arithmetic, including where we discounted ourselves.",
    body: "DESIGN_SPEC.md §10 calls /explain the integrity screen and forbids cutting it. This promotes it to the landing page: a full scored day, itemised, each line carrying its meta-analysis, ending with the two modifier rows where the engine argued itself down.",
    bet: "The hard part of selling a mortality number is being believed, not being liked.",
    risk: "Dense. Asks for more reading than a landing page usually gets.",
  },
  {
    slug: "c",
    name: "Two Bodies",
    thesis: "The genome is the headline, not the upsell.",
    body: "The DESIGN_SPEC.md §1 positioning: the same steak, priced twice. Closes on the ancestry-portability caveat at full size, which the demo script calls the differentiator — almost no consumer genetics product shows you its own limits.",
    bet: "Personalisation is the only defensible moat against WHOOP shipping this themselves.",
    risk: "Advertises Tiers 2 and 3. Neither exists in lib/ — see SCOPE.md §5.",
  },
];

const DECISIONS = [
  {
    n: 1,
    title: "The number is not set in Instrument Serif",
    body: "UI_SPEC.md §5 names Instrument Serif for the hero number and calls it “the single most identity-defining choice in the system”. Drawn next to the actual wordmark it fights it: the logo is monoline, geometric and round-terminalled, and a high-contrast serif beside it reads as two brands sharing a page. These drafts use Quicksand, which shares the wordmark’s construction — uniform stroke, circular bowls, rounded caps — so the display face and the logo have the same skeleton. The cost is warmth: a rounded geometric pushes toward DESIGN_SPEC.md §9’s “too playful → reads as a novelty” failure mode, where the serif pushed toward “too clinical”. Outfit is the same swap without the rounding if this reads too soft. One line in app/dashboard/layout.tsx either way.",
  },
  {
    n: 2,
    title: "The two greens",
    body: "The wordmark is #40F830. UI_SPEC.md §3 sets --credit, the “minutes gained” colour, to #38E1B0. public/brand/README.md argues the brand green should be the gain colour precisely because gaining time is the brand. On these drafts they sit inches apart and the clash is visible. Either recolour the wordmark to --credit, or set --credit back to #40F830 and re-check it against --void for contrast. Right now the repo asserts both.",
  },
  {
    n: 3,
    title: "The hero number does not survive contact with the engine",
    body: "UI_SPEC.md §10.1 shows +2h 14m over a legend that sums to +1h 34m. DESIGN_SPEC.md §1 prices forty minutes of Zone 2 at +3h 50m. Run through lib/scoring.ts, forty-five minutes at zone 2+ is +15m, and a genuinely excellent day — 8h 12m at 92% consistency, RHR 54, HRV 11% over baseline — totals +53m. Every number on these drafts is the engine's, because README.md's central warning is that Liv's science.html drifted from Liv's code, and a landing page is the most public place that can happen.",
  },
  {
    n: 4,
    title: "The corona was designed for a product that logs food",
    body: "Twenty-four hourly spines assume roughly hourly events. WHOOP supplies a handful of readings per day, so a spec-faithful corona on real data is three spines and twenty-one ticks — compare the two rings above. These drafts answer it by re-cutting the corona as twenty-four days rather than twenty-four hours, which fills the ring with data the engine genuinely produces and rhymes with the membrane, already a multi-day measure. If the nutrition tier ships, hours become viable again and this should be revisited.",
  },
  {
    n: 5,
    title: "Which product is this page selling?",
    body: "A, B and C sell the thing in lib/ today: WHOOP in, minutes out, no database. D sells the thing DESIGN_SPEC.md describes: WHOOP plus food plus genome. That is a positioning decision, not a layout one, and it should be made before pixels.",
  },
  {
    n: 6,
    title: "The ring shows a missing quarter",
    body: "Intake renders absent rather than zero, per §2 principle 4 — a band reading 0 would claim you ate nothing worth scoring. It is the right call and it is also a visible hole on a marketing page. Worth deciding on purpose rather than discovering at launch.",
  },
  {
    n: 7,
    title: "The hero number does not fit inside the band ring",
    body: "UI_SPEC.md §7 puts the bands at r=86 and §5 sets the number at 44px, rising to 56px past 1024px. Rendered together, “+53m” is about 150px wide inside a 342px centrepiece — wider than the r=86 circle it is centred in, so the number sits on top of the bands. §13.2 asks what happens at four digits; the collision starts well before that. These drafts move the bands to r=100 and step the number’s size down as the value gets longer. Both numbers are in play.",
  },
  {
    n: 8,
    title: "The Today screen has no logo; a landing page needs one",
    body: "UI_SPEC.md §10.1 says no header, no nav, no logo — the ring is the brand mark. That holds for a signed-in user and cannot hold for a stranger. All four drafts put the wordmark back; §10.1 should say the landing page is the exception.",
  },
];

export default function DraftsIndex() {
  return (
    <>
      <main className="shell-i">
        <header>
          <Wordmark width={92} eager />
          <h1 className="display i-h1">Three ways into the same product.</h1>
          <p style={{ color: "var(--ash)", maxWidth: "62ch", margin: "0 0 var(--s3)" }}>
            Landing-page drafts, built against{" "}
            <span className="mono" style={{ color: "var(--bone)" }}>
              UI_SPEC.md
            </span>{" "}
            and{" "}
            <span className="mono" style={{ color: "var(--bone)" }}>
              DESIGN_SPEC.md
            </span>{" "}
            on <span className="mono">claude/beautiful-mayer-d3g4ii</span>, using the
            wordmark in <span className="mono">public/brand/</span>. Same tokens, same
            type, same centrepiece in all three — what changes is the argument.
          </p>
          <p className="micro" style={{ textTransform: "none", lineHeight: 1.7, maxWidth: "62ch" }}>
            The specs cover Today, Ledger, Genome and Explain. There is no landing page
            in §10, so this is new territory rather than a transcription. Nothing here
            touches the OAuth flow or the scoring engine.
          </p>
        </header>

        <section className="i-grid">
          {DRAFTS.map((d) => (
            <Link key={d.slug} href={`/uipreview/drafts/${d.slug}`} className="card i-card">
              <div className="i-card-head">
                <span className="label">Draft {d.slug.toUpperCase()}</span>
                <span className="micro">Open →</span>
              </div>
              <h2 className="display i-card-name">{d.name}</h2>
              <p className="i-thesis">{d.thesis}</p>
              <p className="i-body">{d.body}</p>
              <dl className="i-meta">
                <dt className="label">Bets on</dt>
                <dd>{d.bet}</dd>
                <dt className="label">Costs you</dt>
                <dd>{d.risk}</dd>
              </dl>
            </Link>
          ))}
        </section>

        {/* ── The ring at two data densities ── */}
        <section className="i-compare">
          <h2 className="display i-h2">What the ring actually has to work with</h2>
          <p style={{ color: "var(--ash)", maxWidth: "58ch" }}>
            Left is the corona exactly as UI_SPEC.md §7 specifies it — twenty-four
            hourly spines — fed real WHOOP-only data. Three spines, twenty-one ticks.
            The hourly mapping assumes a product where you log something most hours.
            Right is the same ring re-cut as twenty-four <em>days</em> of daily nets,
            which is what <span className="mono">lib/scoring.ts</span> actually emits.
            Draft A uses the one on the right.
          </p>
          <div className="i-rings">
            <figure>
              <Organism
                hours={SAMPLE_HOURS}
                bands={SAMPLE_BANDS}
                size={240}
                rhr={SAMPLE_RHR}
                last7={SAMPLE_LAST_7}
              />
              <figcaption className="micro">
                AS SPECIFIED · ONE SPINE PER HOUR · WHOOP-ONLY DAY
              </figcaption>
            </figure>
            <figure>
              <Organism
                hours={SAMPLE_24_DAYS}
                clampAt={DAY_SPINE_CLAMP}
                bands={SAMPLE_BANDS}
                size={240}
                rhr={SAMPLE_RHR}
                last7={SAMPLE_LAST_7}
              />
              <figcaption className="micro">
                PROPOSED · ONE SPINE PER DAY · 24 DAYS OF REAL NETS
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── What the drafts turned up ── */}
        <section className="i-decisions">
          <h2 className="display i-h2">Decisions these drafts could not make for you</h2>
          <p style={{ color: "var(--ash)", maxWidth: "58ch", marginBottom: "var(--s6)" }}>
            Eight places where the specs, the brand assets and the shipped code disagree.
            Each is answered one way in these drafts; each deserves a real answer.
          </p>
          {DECISIONS.map((d) => (
            <div className="i-decision" key={d.n}>
              <span className="mono i-decision-n">{String(d.n).padStart(2, "0")}</span>
              <div>
                <h3 className="i-decision-title">{d.title}</h3>
                <p className="i-decision-body">{d.body}</p>
              </div>
            </div>
          ))}
        </section>

        <footer className="i-foot">
          <span className="micro" style={{ textTransform: "none" }}>
            Drafts are noindex and live under /uipreview/drafts. The shipped landing page at{" "}
            <span className="mono">app/page.tsx</span> is untouched — promoting one means
            moving its body into that file and lifting the tokens from{" "}
            <span className="mono">app/loop-ui.css</span> into{" "}
            <span className="mono">app/globals.css</span>.
          </span>
        </footer>
      </main>

      <Switcher current="" />
    </>
  );
}
