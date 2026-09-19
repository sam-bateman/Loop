import AppFrame from "@/components/loop/AppFrame";
import LedgerRow from "@/components/loop/LedgerRow";
import { SAMPLE_DAYS, SAMPLE_RUNNING_TOTAL, formatCompact } from "@/lib/loop/fixtures";

export const metadata = { title: "Loop — Ledger" };

/**
 * UI_SPEC.md §10.2 — the receipt. Full-bleed list of §9.4 rows, reverse
 * chronological, a sticky --t-label date header per day on --membrane with no
 * border, and the running balance in mono at the right of each header.
 */
export default function Ledger() {
  return (
    <AppFrame scroll>
      <div className="ledger-head">
        <span className="label">Ledger</span>
        <span className="mono" style={{ fontSize: "var(--t-body)" }}>
          {formatCompact(SAMPLE_RUNNING_TOTAL)}
        </span>
      </div>

      {SAMPLE_DAYS.map((day) => (
        <section key={day.date}>
          <header className="ledger-day">
            <span className="label">{day.label}</span>
            <span className="mono" style={{ fontSize: 13 }}>
              {day.entries.length ? formatCompact(day.minutes) : ""}
            </span>
          </header>

          <div style={{ padding: "0 var(--s5)" }}>
            {day.entries.length ? (
              day.entries.map((e) => <LedgerRow key={`${e.time}-${e.what}`} entry={e} />)
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
