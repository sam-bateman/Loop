import AppFrame from "@/components/loop/AppFrame";
import TodayScreen from "@/components/loop/TodayScreen";
import Waterfall from "@/components/loop/Waterfall";
import { getLoopData } from "@/lib/loop/data";
import { traceFor, traceForEntry } from "@/lib/loop/adapter";

export const metadata = { title: "Loop — Today" };
/** A live WHOOP pull per request; nothing here is cacheable across users. */
export const dynamic = "force-dynamic";

/** UI_SPEC.md §10.1 */
export default async function Today() {
  const data = await getLoopData();

  // §6 fills the wide-viewport panel with an attribution trace, because "the
  // first question anyone asks about this product is where that number comes
  // from, and the answer should already be on screen." It traces the largest
  // single factor of the most recent day, live or demo alike.
  const day0 = data.ledger[0];
  const biggest = day0?.entries
    .slice()
    .sort((a, b) => Math.abs(b.minutes) - Math.abs(a.minutes))[0];
  const dayScore = data.rawDays.find((d) => d.date === day0?.date);
  const factor = dayScore?.factors.find((f) => f.label === biggest?.what);

  const panelRows =
    dayScore && factor
      ? traceFor(dayScore, factor)
      : biggest
        ? traceForEntry(biggest)
        : [];

  return (
    <AppFrame
      scroll
      panel={
        <>
          <span className="label" style={{ display: "block", marginBottom: "var(--s4)" }}>
            Attribution — {biggest?.what ?? "No data"}
          </span>
          <Waterfall rows={panelRows} total={biggest?.minutes ?? 0} />
          <p className="micro panel-note">
            {data.source === "live"
              ? "The largest single factor today. Tap any ledger row for its own trace."
              : "Demonstration data — connect WHOOP to see your own. Tap any ledger row for its trace."}
          </p>
        </>
      }
    >
      <TodayScreen data={data} />
    </AppFrame>
  );
}
