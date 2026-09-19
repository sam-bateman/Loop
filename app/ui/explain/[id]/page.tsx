import Link from "next/link";
import { notFound } from "next/navigation";
import AppFrame from "@/components/loop/AppFrame";
import Waterfall from "@/components/loop/Waterfall";
import { SAMPLE_LEDGER, SAMPLE_TRACES, entryId } from "@/lib/loop/fixtures";

/**
 * UI_SPEC.md §10.4 — Explain. A single waterfall, vertically centred, nothing
 * else on screen. Each multiplier row links to its source section in the
 * methodology. DESIGN_SPEC.md §10: "this screen is the product's integrity
 * made visible", and §12 lists it as never cut.
 */
export function generateStaticParams() {
  return SAMPLE_LEDGER.map((e) => ({ id: entryId(e) }));
}

export default async function Explain({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = SAMPLE_LEDGER.find((e) => entryId(e) === id);
  const rows = SAMPLE_TRACES[id];
  if (!entry || !rows) notFound();

  return (
    <AppFrame scroll>
      <div className="screen explain">
        <Link className="back-link label" href="/ui">
          ← Today
        </Link>

        <span className="label" style={{ display: "block", marginTop: "var(--s6)" }}>
          {entry.time}
        </span>
        <h1 className="explain-title display">{entry.what}</h1>
        <p className="explain-detail">{entry.detail}</p>

        <hr className="hairline" style={{ margin: "var(--s6) 0 var(--s4)" }} />

        <Waterfall rows={rows} total={entry.minutes} />

        <Link className="cta-ghost explain-source" href="/methodology">
          Every rate above, with its citation
        </Link>
      </div>
    </AppFrame>
  );
}
