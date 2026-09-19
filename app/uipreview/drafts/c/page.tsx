import Link from "next/link";
import ConfidenceBand from "@/components/loop/ConfidenceBand";
import Organism from "@/components/loop/Organism";
import Switcher from "@/components/loop/Switcher";
import Wordmark from "@/components/loop/Wordmark";
import { formatCompact } from "@/lib/loop/fixtures";

export const metadata = { title: "Loop — draft C, Two Bodies" };

/**
 * DRAFT C — "Two Bodies"
 *
 * The DESIGN_SPEC.md §1 thesis taken as the headline: "Two people eat the same
 * steak; the one carrying a salt-sensitivity variant and an elevated
 * cardiovascular polygenic score pays more for it. Without it, this is a
 * well-designed calculator. With it, it is a personal instrument."
 *
 * ⚠️ This draft advertises Tiers 2 and 3. SCOPE.md §5 lists the nutrition tier
 * as an open decision and the genomics tier as deferred until the WHOOP loop
 * works — neither is in lib/. Do not ship this page before they exist.
 *
 * The waterfall below is DESIGN_SPEC.md §9.8's own worked example, unchanged.
 */

const WATERFALL = [
  { label: "Processed meat, 1 serving", value: -30, kind: "base" as const },
  { label: "Salt-sensitive genotype (rs4961)", value: "×1.30", kind: "mult" as const },
  { label: "Cardiovascular PRS, 88th percentile", value: "×1.25", kind: "mult" as const },
  { label: "No exercise logged today", value: "×1.08", kind: "mult" as const },
  { label: "Compounding clamp applied", value: "×2.50 → clamped", kind: "clamp" as const },
];

export default function DraftC() {
  return (
    <>
      <main className="shell-d">
        <header>
          <Wordmark width={76} eager />
          <h1 className="display d-h1">
            Two people eat the same steak. One of them pays more for it.
          </h1>
          <p style={{ color: "var(--ash)", maxWidth: "54ch", margin: 0 }}>
            Loop prices your behaviour in minutes of life expectancy, then prices it{" "}
            <em style={{ fontStyle: "normal", color: "var(--bone)" }}>for you</em> — your
            WHOOP data sets the day, and your genome sets the exchange rate. Without the
            genome this is a well-designed calculator. With it, it is a personal
            instrument.
          </p>
        </header>

        <section className="d-pair" aria-label="The same event, scored two ways">
          {/* ── Population ── */}
          <div className="card d-panel">
            <div className="d-panel-head">
              <span className="label">Population baseline</span>
              <span className="micro" style={{ textTransform: "none" }}>
                No genome linked
              </span>
            </div>

            <div className="d-core">
              {/* §7 composite states: with no genome the core rim is absent
                  entirely — the layer is visibly missing, not greyed. */}
              <Organism
                hours={Array(24).fill(0)}
                bands={[
                  { key: "intake", label: "Intake", minutes: -30 },
                  { key: "sleep", label: "Sleep", minutes: 0, absent: true, absentReason: "—" },
                ]}
                size={200}
                genomeRim="absent"
              />
            </div>

            <div className="d-wf-row">
              <span style={{ color: "var(--bone)" }}>Processed meat, 1 serving</span>
              <span className="mono">{formatCompact(-30)}</span>
            </div>
            <p className="micro" style={{ textTransform: "none", marginTop: "var(--s3)" }}>
              IARC Monograph 114 · the rate everyone gets
            </p>

            <div className="d-wf-total">
              <span className="label">Net</span>
              <span className="mono" style={{ fontSize: "var(--t-metric)" }}>
                {formatCompact(-30)}
              </span>
            </div>
          </div>

          {/* ── With genome ── */}
          <div className="card d-panel" style={{ borderColor: "rgba(167,139,250,.28)" }}>
            <div className="d-panel-head">
              <span className="label" style={{ color: "var(--genome)" }}>
                With your genome
              </span>
              <span className="micro" style={{ textTransform: "none" }}>
                250 markers kept
              </span>
            </div>

            <div className="d-core">
              <Organism
                hours={Array(24).fill(0)}
                bands={[
                  { key: "intake", label: "Intake", minutes: -75 },
                  { key: "sleep", label: "Sleep", minutes: 0, absent: true, absentReason: "—" },
                ]}
                size={200}
                genomeRim="defined"
              />
            </div>

            {WATERFALL.map((r) => (
              <div
                key={r.label}
                className={
                  "d-wf-row" +
                  (r.kind === "mult" ? " is-mult" : r.kind === "clamp" ? " is-clamp" : "")
                }
              >
                <span style={r.kind === "base" ? { color: "var(--bone)" } : undefined}>
                  {r.kind === "base" ? r.label : `× ${r.label}`}
                </span>
                <span className="mono" style={{ whiteSpace: "nowrap" }}>
                  {typeof r.value === "number" ? formatCompact(r.value) : r.value}
                </span>
              </div>
            ))}

            <div className="d-wf-total">
              <span className="label">Net</span>
              <span className="mono" style={{ fontSize: "var(--t-metric)" }}>
                {formatCompact(-75)}
              </span>
            </div>
          </div>
        </section>

        {/* ── The differentiator: the product showing its own limits ── */}
        <section className="card d-honesty">
          <h2
            className="display"
            style={{
              fontSize: "var(--t-display)",
              letterSpacing: "-.01em",
              margin: "0 0 var(--s3)",
            }}
          >
            And here is where that score is weaker than it looks.
          </h2>
          <p style={{ color: "var(--ash)", maxWidth: "56ch", margin: "0 0 var(--s6)" }}>
            Almost no consumer genetics product tells you this. Loop puts it on the
            screen, at full size, next to the number it qualifies.
          </p>

          <ConfidenceBand
            condition="Coronary artery disease"
            percentile={78}
            ciLow={52}
            ciHigh={94}
            reduced
            note="Your inferred ancestry is under-represented in the reference panel this score was trained on, so the interval is wide."
          />
        </section>

        <div className="d-cta">
          <a className="cta" href="/api/auth/login">
            Connect WHOOP
          </a>
          <Link className="cta-ghost" href="/uipreview/genome">
            Add your genome — optional, and always second
          </Link>
          <p className="micro" style={{ textTransform: "none", lineHeight: 1.7 }}>
            A 23andMe or AncestryDNA export carries around 600,000 markers. Loop keeps
            the few hundred it scores and destroys the rest before the upload finishes.
            The raw file is never written to disk, and genetic data is never shared under
            any framing.
          </p>
        </div>

        <div className="d-foot">
          <Link className="link" href="/methodology">
            Read the methodology
          </Link>
          <span className="label">
            Not medical advice · not a diagnosis · not a prediction about you
          </span>
        </div>
      </main>

      <Switcher current="c" />
    </>
  );
}
