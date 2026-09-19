import BandLegend from "./BandLegend";
import HeroNumber from "./HeroNumber";
import LedgerRow from "./LedgerRow";
import Organism from "./Organism";
import SourceBanner from "./SourceBanner";
import type { LoopData } from "@/lib/loop/data";
import { DAY_SPINE_CLAMP } from "@/lib/loop/fixtures";

/**
 * UI_SPEC.md §10.1 — Today.
 *
 * Three elements in strict hierarchy: centrepiece, legend, ledger strip.
 * Nothing else. No header, no logo — the ring is the brand mark.
 */
export default function TodayScreen({
  data,
  ringSize = 342,
}: {
  data: LoopData;
  ringSize?: number;
}) {
  const strip = data.ledger[0]?.entries ?? [];

  return (
    <>
      <SourceBanner source={data.source} error={data.error} />

      <div style={{ padding: "0 var(--s5)" }}>
        <div
          style={{
            position: "relative",
            height: ringSize,
            marginTop: data.source === "live" ? "var(--s8)" : "var(--s5)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Organism
            hours={data.coronaDays}
            clampAt={DAY_SPINE_CLAMP}
            bands={data.bands}
            size={ringSize}
            rhr={data.rhr}
            last7={data.last7}
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
            <HeroNumber
              minutes={data.total}
              label={data.source === "live" ? "Today" : "Sample day"}
            />
          </div>
        </div>

        <div style={{ marginTop: "var(--s5)" }}>
          <BandLegend bands={data.bands} />
        </div>

        <hr className="hairline" style={{ margin: "var(--s5) 0 0" }} />

        <div>
          {strip.slice(0, 3).map((e) => (
            <LedgerRow key={`${e.time}-${e.what}`} entry={e} date={data.ledger[0]?.date} />
          ))}
        </div>
      </div>
    </>
  );
}
