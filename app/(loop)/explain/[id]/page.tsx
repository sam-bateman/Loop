import Link from "next/link";
import { notFound } from "next/navigation";
import AppFrame from "@/components/loop/AppFrame";
import Waterfall from "@/components/loop/Waterfall";
import { factorId, traceFor, traceForEntry } from "@/lib/loop/adapter";
import { getLoopData } from "@/lib/loop/data";
import type { TraceRow } from "@/lib/loop/fixtures";

export const dynamic = "force-dynamic";

/**
 * UI_SPEC.md §10.4 — Explain. A single waterfall, vertically centred, nothing
 * else on screen. DESIGN_SPEC.md §10 calls this "the product's integrity made
 * visible" and §12 lists it as never cut.
 *
 * The trace is rebuilt from the same DayScore the ledger row came from, so the
 * number here and the number there cannot disagree.
 */
export default async function Explain({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getLoopData();

  const hit = data.ledger
    .flatMap((day) => day.entries.map((entry) => ({ day, entry })))
    .find(({ day, entry }) => factorId(day.date, entry.what) === id);

  if (!hit) notFound();

  const dayScore = data.rawDays.find((d) => d.date === hit.day.date);
  const factor = dayScore?.factors.find((f) => f.label === hit.entry.what);

  // Live data carries the modifiers the engine applied, so the trace is exact.
  // On demonstration data there is no DayScore behind the row, so the rate and
  // citation are shown without a modifier stack rather than inventing one.
  const rows: TraceRow[] =
    dayScore && factor ? traceFor(dayScore, factor) : traceForEntry(hit.entry);

  return (
    <AppFrame scroll>
      <div className="screen explain">
        <Link className="back-link label" href="/ledger">
          ← Ledger
        </Link>

        <span className="label" style={{ display: "block", marginTop: "var(--s6)" }}>
          {hit.day.label}
        </span>
        <h1 className="explain-title display">{hit.entry.what}</h1>
        <p className="explain-detail">{hit.entry.detail}</p>

        {data.source === "demo" && (
          <p className="micro" style={{ textTransform: "none", marginTop: "var(--s3)" }}>
            Demonstration data — not your numbers.
          </p>
        )}

        <hr className="hairline" style={{ margin: "var(--s6) 0 var(--s4)" }} />

        <Waterfall rows={rows} total={hit.entry.minutes} />

        <Link className="cta-ghost explain-source" href="/methodology">
          Every rate above, with its citation
        </Link>
      </div>
    </AppFrame>
  );
}
