import AppFrame from "@/components/loop/AppFrame";
import TodayScreen from "@/components/loop/TodayScreen";
import Waterfall from "@/components/loop/Waterfall";
import { SAMPLE_TRACES } from "@/lib/loop/fixtures";

export const metadata = { title: "Loop — Today" };

/** UI_SPEC.md §10.1 */
export default function Today() {
  return (
    <AppFrame
      scroll
      panel={
        <>
          <span className="label" style={{ display: "block", marginBottom: "var(--s4)" }}>
            Attribution — cardiovascular activity
          </span>
          <Waterfall rows={SAMPLE_TRACES["cardiovascular-activity"]} total={15} />
          <p className="micro panel-note">
            §6 puts this panel here for one reason: the first question anyone asks about
            this product is where the number comes from, so the answer is already on
            screen. Tap any ledger row for its own trace.
          </p>
        </>
      }
    >
      <TodayScreen />
    </AppFrame>
  );
}
