import { formatMinutes } from "@/lib/loop/fixtures";

/**
 * UI_SPEC.md §9.1 — the value stays --bone in both directions; only the sign
 * carries the semantic hue. A full-red number at 44px makes a mildly negative
 * day feel like a catastrophe.
 *
 * The size step is the answer to §13.2: a fixed 44/56px number is wider than
 * the band ring it sits inside as soon as the value carries hours, so the
 * size scales with the length of the value rather than being set once.
 */
export default function HeroNumber({
  minutes,
  label,
}: {
  minutes: number;
  label?: string;
}) {
  const { sign, value } = formatMinutes(minutes);
  const chars = (sign + value).length;
  // Sized to clear the band ring's inner edge (r=100 less a 9-unit stroke) at
  // the 342px centrepiece §6 specifies. Measured, not guessed.
  const scale = chars <= 4 ? 0.9 : chars <= 6 ? 0.76 : 0.62;

  return (
    <div style={{ display: "grid", justifyItems: "center", gap: "var(--s2)" }}>
      <div
        className={`hero-number ${minutes >= 0 ? "is-credit" : "is-debit"}`}
        style={{ ["--hero-scale" as string]: scale }}
      >
        <span className="sign">{sign}</span>
        {value}
      </div>
      {label && <div className="label">{label}</div>}
    </div>
  );
}
