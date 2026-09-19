import AppFrame from "@/components/loop/AppFrame";
import ConfidenceBand from "@/components/loop/ConfidenceBand";

export const metadata = { title: "Loop — Genome" };

/**
 * UI_SPEC.md §10.3 — Genome, post-upload: PRS confidence bands stacked with
 * --s5 gaps, then the variant table beneath a --t-label header, then inferred
 * ancestry with its portability note in --neutral at --t-body — in the layout,
 * at full size, not as a footnote.
 *
 * ⚠️ Nothing behind this screen is built. SCOPE.md §5 defers the genomics tier
 * until the WHOOP loop works, and DESIGN_SPEC.md §4.2 flags swabio as a
 * contract rather than an integration. This is the visual target only.
 */
const VARIANTS = [
  { rsid: "rs4961", gene: "ADD1", genotype: "GG", effect: "Salt-sensitive", mult: "×1.30" },
  { rsid: "rs1801133", gene: "MTHFR", genotype: "CT", effect: "Reduced folate metabolism", mult: "×1.10" },
  { rsid: "rs762551", gene: "CYP1A2", genotype: "AA", effect: "Fast caffeine metaboliser", mult: "×0.90" },
  { rsid: "rs429358", gene: "APOE", genotype: null, effect: "Not assayed on your chip", mult: null },
  { rsid: "rs671", gene: "ALDH2", genotype: null, effect: "Not assayed on your chip", mult: null },
];

export default function Genome() {
  return (
    <AppFrame scroll>
      <div className="screen">
        <span className="label" style={{ display: "block", marginBottom: "var(--s5)" }}>
          Genome
        </span>

        <div style={{ display: "grid", gap: "var(--s5)" }}>
          <ConfidenceBand
            condition="Coronary artery disease"
            percentile={78}
            ciLow={52}
            ciHigh={94}
            reduced
            note="Your inferred ancestry is under-represented in the reference panel this score was trained on."
          />
          <ConfidenceBand
            condition="Type 2 diabetes"
            percentile={41}
            ciLow={33}
            ciHigh={49}
          />
        </div>

        <span
          className="label"
          style={{ display: "block", margin: "var(--s7) 0 var(--s3)" }}
        >
          Variants scored
        </span>

        <div>
          {VARIANTS.map((v) => (
            /* §9.7 — not-assayed rows render at 45% with —— in the genotype
               column. Never omitted silently: the absence is information. */
            <div key={v.rsid} className="variant-row" data-absent={!v.genotype || undefined}>
              <span className="micro variant-rsid">{v.rsid}</span>
              <span className="variant-gene">{v.gene}</span>
              <span className="mono variant-genotype">{v.genotype ?? "——"}</span>
              <span className="variant-effect">{v.effect}</span>
              <span className="mono variant-mult">{v.mult ?? ""}</span>
            </div>
          ))}
        </div>

        <span
          className="label"
          style={{ display: "block", margin: "var(--s7) 0 var(--s3)" }}
        >
          Inferred ancestry
        </span>
        <p style={{ color: "var(--bone)", fontSize: "var(--t-body)", margin: "0 0 var(--s3)" }}>
          72% Northern European · 18% South Asian · 10% unassigned
        </p>
        <p className="portability-note">
          Polygenic scores are relative percentiles within an ancestry group, not
          verdicts. They are calibrated on predominantly European reference panels and
          transfer poorly across ancestries, so the coronary artery disease score above
          is less reliable for you than its number suggests. Most consumer genetics
          products do not tell you this.
        </p>

        <button className="danger-button" type="button">
          Delete genetic data
        </button>
        <p className="micro" style={{ textTransform: "none", marginTop: "var(--s3)" }}>
          The raw file was never written to disk. Deleting removes the scored variants
          too, and cannot be undone.
        </p>
      </div>
    </AppFrame>
  );
}
