import Link from "next/link";
import { entryId, formatCompact, type LedgerEntry } from "@/lib/loop/fixtures";

/**
 * UI_SPEC.md §9.4 — the receipt row. Deliberately the most conventional-looking
 * thing in the app, because receipts should look like receipts. Hairlines only:
 * no zebra striping, no card, no shadow.
 */
export default function LedgerRow({
  entry,
  showTrace = true,
}: {
  entry: LedgerEntry;
  showTrace?: boolean;
}) {
  const body = (
    <>
      <span className="time">{entry.time}</span>
      <span>
        <span className="what">{entry.what}</span>
        <span className="cite">{entry.detail}</span>
        {entry.guarded && (
          <span className="cite" style={{ color: "var(--neutral)", opacity: 1 }}>
            ↳ reduced to avoid counting the same evidence twice
          </span>
        )}
      </span>
      <span className="value">{formatCompact(entry.minutes)}</span>
    </>
  );

  if (!showTrace) return <div className="ledger-row">{body}</div>;

  return (
    <Link className="ledger-row is-link" href={`/ui/explain/${entryId(entry)}`}>
      {body}
    </Link>
  );
}
