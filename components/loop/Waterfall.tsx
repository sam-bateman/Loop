import { formatCompact, type TraceRow } from "@/lib/loop/fixtures";

/**
 * UI_SPEC.md §9.8 — the attribution trace. All mono, tabular, right-aligned
 * values; multiplier rows indented and set in --ash; the clamp row in
 * --neutral; a 1px hairline rule above the total.
 *
 * DESIGN_SPEC.md §10 calls this the product's integrity screen and says it is
 * not cut under any circumstances.
 */
export default function Waterfall({
  rows,
  total,
}: {
  rows: TraceRow[];
  total: number;
}) {
  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={`${r.label}-${i}`}
          className={`wf-row is-${r.kind}`}
        >
          <span>
            <span className="wf-label">
              {r.kind === "base" ? r.label : `× ${r.label}`}
            </span>
            {r.cite && <span className="cite">{r.cite}</span>}
          </span>
          <span className="wf-value">
            {typeof r.value === "number" ? formatCompact(r.value) : r.value}
          </span>
        </div>
      ))}

      <div className="wf-total">
        <span className="label">Net</span>
        <span className="mono wf-total-value">{formatCompact(total)}</span>
      </div>
    </div>
  );
}
