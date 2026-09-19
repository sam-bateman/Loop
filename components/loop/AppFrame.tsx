import TabBar from "./TabBar";

/**
 * UI_SPEC.md §6 — the app renders inside a fixed 390 × 844 device frame,
 * centred on a --void field. Below 480px the frame dissolves entirely and the
 * app renders full-bleed; all internal measurements are unchanged.
 *
 * On ≥1024px a panel sits to the right of the frame. §6 is explicit about why
 * it exists: "the first question anyone asks about this product is 'where does
 * that number come from', and the answer should already be on screen."
 */
export default function AppFrame({
  children,
  panel,
  scroll = false,
}: {
  children: React.ReactNode;
  panel?: React.ReactNode;
  /** Ledger-style screens scroll inside the frame rather than clipping. */
  scroll?: boolean;
}) {
  return (
    <div className="app-stage">
      <div className="frame">
        <div className={`frame-body${scroll ? " is-scroll" : ""}`}>{children}</div>
        <TabBar />
      </div>
      {panel && <aside className="app-panel">{panel}</aside>}
    </div>
  );
}
