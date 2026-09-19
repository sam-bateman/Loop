import AppFrame from "@/components/loop/AppFrame";
import LedgerRow from "@/components/loop/LedgerRow";
import SourceBanner from "@/components/loop/SourceBanner";
import { getLoopData } from "@/lib/loop/data";
import { formatCompact } from "@/lib/loop/fixtures";

export const metadata = { title: "Loop — Ledger" };
export const dynamic = "force-dynamic";

/**
 * UI_SPEC.md §10.2 — the receipt. Full-bleed list of §9.4 rows, reverse
 * chronological, a sticky --t-label date header per day on --membrane with no
 * border, and the running balance in mono at the right of each header.
 */
export default async function Ledger() {
  const data = await getLoopData();
  const running = data.ledger.reduce((a, d) => a + d.minutes, 0);

  return (
    <AppFrame scroll>
      <SourceBanner source={data.source} error={data.error} />

      <div className="ledger-head">
        <span className="label">Ledger — {data.ledger.length} days</span>
        <span className="mono" style={{ fontSize: "var(--t-body)" }}>
          {formatCompact(running)}
        </span>
      </div>

      {data.ledger.map((day) => (
        <section key={day.date}>
          <header className="ledger-day">
            <span className="label">{day.label}</span>
            <span className="mono" style={{ fontSize: 13 }}>
              {day.entries.length ? formatCompact(day.minutes) : ""}
            </span>
          </header>

          <div style={{ padding: "0 var(--s5)" }}>
            {day.entries.length ? (
              day.entries.map((e) => (
                <LedgerRow key={`${e.time}-${e.what}`} entry={e} date={day.date} />
              ))
            ) : (
              /* §9.9 — never a spinner, never a zero, never a grey filled block.
                 DESIGN_SPEC §4.1: a day with no data must not read as a day of
                 perfect behaviour. */
              <div className="empty-state">
                <span className="micro">No data — strap not worn</span>
              </div>
            )}
          </div>
        </section>
      ))}
    </AppFrame>
  );
}
