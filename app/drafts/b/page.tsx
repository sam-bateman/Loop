import Link from "next/link";
import Switcher from "../_components/Switcher";
import Wordmark from "../_components/Wordmark";
import {
  SAMPLE_LEDGER,
  SAMPLE_MODIFIERS,
  SAMPLE_TOTAL,
  formatCompact,
  formatMinutes,
} from "../_lib/loop";

export const metadata = { title: "Loop — draft B, The Receipt" };

/**
 * DRAFT B — "The Receipt"
 *
 * Credibility first. DESIGN_SPEC.md §10 calls /explain "the product's integrity
 * screen ... not cut under any circumstances"; this draft promotes it to the
 * landing page, on the theory that the hard part of selling a mortality number
 * is not making it look good, it is being believed.
 *
 * The two modifier rows are the point of the whole page: they are the places
 * the engine discounted itself. Nothing else in this category shows you that.
 */
export default function DraftB() {
  const { sign, value } = formatMinutes(SAMPLE_TOTAL);

  return (
    <>
      <main className="shell-b">
        <header className="b-head">
          <Wordmark width={76} eager />
          <h1 className="display b-h1">Show your working.</h1>
          <p style={{ color: "var(--ash)", maxWidth: "52ch", margin: "0 0 var(--s4)" }}>
            Loop turns WHOOP sleep, resting heart rate, HRV and training load into
            minutes of life expectancy. Every one of those minutes traces back to a
            named meta-analysis, and the rate is always set below what the paper
            implies.
          </p>
          <p style={{ color: "var(--ash)", maxWidth: "52ch", margin: 0, fontSize: 14 }}>
            This is a full day, unedited — including the two lines where the model
            argued itself down.
          </p>

          <div className="b-cta">
            <a className="cta" href="/api/auth/login" style={{ width: "auto" }}>
              Connect WHOOP
            </a>
            <Link className="cta-ghost" href="/methodology">
              Read the methodology
            </Link>
          </div>
          <p className="micro" style={{ marginTop: "var(--s4)", textTransform: "none" }}>
            Read-only · tokens live in an encrypted cookie on your device · not medical
            advice
          </p>
        </header>

        {/* ─── The receipt ─── */}
        <section className="card b-receipt" aria-label="A scored day, itemised">
          <div className="b-receipt-head">
            <span className="label">Sample day — demonstration data</span>
            <span className="micro" style={{ textTransform: "none" }}>
              18 SEP 2026
            </span>
          </div>

          <div>
            {SAMPLE_LEDGER.map((e) => (
              <div className="ledger-row" key={`${e.time}-${e.what}`}>
                <span className="time">{e.time}</span>
                <span>
                  <span className="what">{e.what}</span>
                  <span className="cite">{e.detail}</span>
                  <span className="cite" style={{ color: "var(--ash)", opacity: 1 }}>
                    {e.cite}
                  </span>
                </span>
                <span className="value">{formatCompact(e.minutes)}</span>
              </div>
            ))}
          </div>

          {/* §9.8 — the multiplier rows, indented and set in --ash. */}
          <div className="b-modifiers">
            <span className="label" style={{ display: "block", marginBottom: "var(--s3)" }}>
              Modifiers applied
            </span>
            {SAMPLE_MODIFIERS.map((m) => (
              <div className="b-mod-row" key={m.label}>
                <span>
                  <span
                    style={{
                      color: m.tone === "guard" ? "var(--neutral)" : "var(--bone)",
                      fontSize: 14,
                    }}
                  >
                    {m.label}
                  </span>
                  <span className="cite">{m.note}</span>
                  <span className="cite" style={{ color: "var(--ash)", opacity: 1 }}>
                    {m.cite}
                  </span>
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: "var(--t-body)",
                    color: m.tone === "guard" ? "var(--neutral)" : "var(--ash)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          <div className="b-total">
            <span className="label">Net, this day</span>
            <span className={`hero-number ${SAMPLE_TOTAL >= 0 ? "is-credit" : "is-debit"}`}>
              <span className="sign">{sign}</span>
              {value}
            </span>
          </div>

          <p className="micro b-total-note">
            A good day, scored honestly. Loop&rsquo;s rates are roughly a tenth of what
            the headline studies imply, because observational evidence carries
            confounding the headline number does not.
          </p>
        </section>
      </main>

      <Switcher current="b" />
    </>
  );
}
