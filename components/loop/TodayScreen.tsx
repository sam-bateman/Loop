import BandLegend from "./BandLegend";
import HeroNumber from "./HeroNumber";
import LedgerRow from "./LedgerRow";
import Organism from "./Organism";
import {
  DAY_SPINE_CLAMP,
  SAMPLE_24_DAYS,
  SAMPLE_BANDS,
  SAMPLE_LAST_7,
  SAMPLE_LEDGER,
  SAMPLE_RHR,
  SAMPLE_TOTAL,
} from "@/lib/loop/fixtures";

/**
 * UI_SPEC.md §10.1 — Today.
 *
 * Three elements in strict hierarchy: centrepiece, legend, ledger strip.
 * Nothing else. No header, no logo — the ring is the brand mark.
 */
export default function TodayScreen({
  ringSize = 342,
  label = "Today",
  compact = false,
}: {
  ringSize?: number;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div style={{ padding: "0 var(--s5)" }}>
      <div
        style={{
          position: "relative",
          height: ringSize,
          marginTop: compact ? "var(--s5)" : "var(--s8)",
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
        {/* §7 — the number is HTML over the SVG centre, never an SVG <text>,
            so it gets real tabular figures and stays selectable. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            alignContent: "center",
            pointerEvents: "none",
          }}
        >
          <HeroNumber minutes={SAMPLE_TOTAL} label={label} />
        </div>
      </div>

      <div style={{ marginTop: "var(--s5)" }}>
        <BandLegend bands={SAMPLE_BANDS} />
      </div>

      <hr className="hairline" style={{ margin: "var(--s5) 0 0" }} />

      <div>
        {SAMPLE_LEDGER.slice()
          .reverse()
          .slice(0, 3)
          .map((e) => (
            <LedgerRow key={`${e.time}-${e.what}`} entry={e} />
          ))}
      </div>
    </div>
  );
}
