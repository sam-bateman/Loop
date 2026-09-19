/**
 * UI_SPEC.md §9.6 — the PRS confidence band.
 *
 * The visual answer to §2 principle 3: "a confident number and an uncertain
 * number must never look identical." Low ancestry-match confidence widens the
 * interval AND blurs it, and the caveat sits in the interface at full size —
 * never in a tooltip, per DESIGN_SPEC.md §5.4.3.
 */
export default function ConfidenceBand({
  condition,
  percentile,
  ciLow,
  ciHigh,
  reduced = false,
  note,
}: {
  condition: string;
  percentile: number;
  ciLow: number;
  ciHigh: number;
  reduced?: boolean;
  note?: string;
}) {
  return (
    <div>
      <span className="label" style={{ display: "block", marginBottom: "var(--s3)" }}>
        {condition}
      </span>

      <div className="cb-track">
        <div
          className="cb-interval"
          style={{
            left: `${ciLow}%`,
            width: `${ciHigh - ciLow}%`,
            filter: reduced ? "blur(1.5px)" : undefined,
          }}
        />
        <div className="cb-marker" style={{ left: `${percentile}%` }} />
      </div>

      <div className="cb-scale">
        <span className="micro">0</span>
        <span className="mono cb-pct">{percentile}th percentile</span>
        <span className="micro">100</span>
      </div>

      {reduced && (
        <p className="cb-warn">
          Reduced confidence — polygenic scores are calibrated within an ancestry
          group and do not transfer cleanly between them. {note}
        </p>
      )}
    </div>
  );
}
