import { formatCompact, type Band } from "@/lib/loop/fixtures";

/** UI_SPEC.md §9.5 — colour swatch (8px square, not a circle), label, value. */
export default function BandLegend({ bands }: { bands: Band[] }) {
  return (
    <div style={{ display: "grid", gap: "var(--s3)" }}>
      {bands.map((b) => (
        <div key={b.key} style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              flex: "none",
              background: b.absent
                ? "transparent"
                : b.minutes >= 0
                  ? "var(--credit)"
                  : "var(--debit)",
              /* §9.9 — absence is a hairline outline, never a grey filled block. */
              boxShadow: b.absent ? "inset 0 0 0 1px var(--dust)" : undefined,
            }}
          />
          <span className="label" style={{ flex: 1 }}>
            {b.label}
          </span>
          {b.absent ? (
            <span className="micro" style={{ textTransform: "none" }}>
              {b.absentReason}
            </span>
          ) : (
            <span className="mono" style={{ fontSize: "var(--t-body)" }}>
              {formatCompact(b.minutes)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
