import HeroNumber from "./HeroNumber";
import Organism from "./Organism";
import {
  DAY_SPINE_CLAMP,
  SAMPLE_24_DAYS,
  SAMPLE_BANDS,
  SAMPLE_LAST_7,
  SAMPLE_LEDGER,
  SAMPLE_RHR,
  SAMPLE_TOTAL,
  formatCompact,
} from "../_lib/loop";

/**
 * UI_SPEC.md §10.1 — the Today screen, composed exactly as specified:
 * centrepiece, legend, ledger strip, in strict hierarchy. Nothing else.
 *
 * Used on the landing drafts as the product shot, so a visitor sees the
 * instrument before they are asked to connect anything.
 */
export default function TodayScreen({ ringSize = 342 }: { ringSize?: number }) {
  return (
    <div style={{ padding: "0 var(--s5) var(--s5)" }}>
      <div
        style={{
          position: "relative",
          height: ringSize,
          marginTop: "var(--s8)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Organism
          hours={SAMPLE_24_DAYS}
          clampAt={DAY_SPINE_CLAMP}
          bands={SAMPLE_BANDS}
          size={ringSize}
          rhr={SAMPLE_RHR}
          last7={SAMPLE_LAST_7}
        />
        {/* The number is HTML over the SVG centre, never an SVG <text> —
            §7 requires real tabular-nums and selectable text. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            alignContent: "center",
            gap: "var(--s2)",
            pointerEvents: "none",
          }}
        >
          <HeroNumber minutes={SAMPLE_TOTAL} label="Sample day" />
        </div>
      </div>

      {/* §9.5 — band legend. 8px square swatch, not a circle. */}
      <div style={{ marginTop: "var(--s5)", display: "grid", gap: "var(--s3)" }}>
        {SAMPLE_BANDS.map((b) => (
          <div
            key={b.key}
            style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}
          >
            {/* §9.5 — 8px square, not a circle. An absent band gets a hollow
                square so the legend carries the gap too, not just the ring. */}
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

      <hr className="hairline" style={{ margin: "var(--s5) 0 var(--s2)" }} />

      <div>
        {SAMPLE_LEDGER.slice()
          .reverse()
          .slice(0, 3)
          .map((e) => (
            <div
              key={`${e.time}-${e.what}`}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "var(--s3)",
                padding: "var(--s2) 0",
              }}
            >
              <span className="micro" style={{ flex: "none", width: 38 }}>
                {e.time}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "var(--bone)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.what}
              </span>
              <span className="mono" style={{ fontSize: 13, flex: "none" }}>
                {formatCompact(e.minutes)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
