/**
 * DESIGN_SPEC.md §11 is emphatic that nothing in this product may be phrased as
 * a prediction about the person reading it. Demonstration data shown without a
 * label is worse than that — it is someone else's body presented as theirs. The
 * banner is not dismissible and not subtle.
 */
export default function SourceBanner({
  source,
  error,
}: {
  source: "live" | "demo";
  error?: string;
}) {
  if (source === "live" && !error) return null;

  return (
    <div className="source-banner">
      <span className="label" style={{ color: "var(--neutral)" }}>
        {error ? "WHOOP sync failed" : "Demonstration data"}
      </span>
      <p className="micro source-banner-note">
        {error
          ? `${error} Showing a demonstration day instead — these are not your numbers.`
          : "No WHOOP account connected. These are not your numbers."}
      </p>
      <a className="cta-ghost source-banner-cta" href="/api/auth/login">
        Connect WHOOP
      </a>
    </div>
  );
}
