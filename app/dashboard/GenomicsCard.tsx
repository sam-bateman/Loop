import type { GenomicsResult } from "@/lib/genomics";

function signed(n: number) {
  const r = Math.round(n);
  return `${r > 0 ? "+" : r < 0 ? "−" : ""}${Math.abs(r)}`;
}
function cls(n: number) {
  return n > 0 ? "text-gain" : n < 0 ? "text-loss" : "text-faint";
}

export function GenomicsCard({ g }: { g: GenomicsResult }) {
  return (
    <section className="mb-9">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint">
          Genetic baseline
        </h2>
        <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
          demo genome
        </span>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4 py-4 mb-3">
        <div className="flex items-baseline gap-2">
          <span className={`num text-[30px] font-semibold ${cls(g.baselineMinutesPerDay)}`}>
            {signed(g.baselineMinutesPerDay)}
          </span>
          <span className="text-[13px] text-muted">min / day</span>
        </div>
        <p className="text-[12.5px] text-faint mt-2 leading-relaxed">
          Roughly{" "}
          <span className={cls(g.baselineYears)}>
            {g.baselineYears > 0 ? "+" : "−"}
            {Math.abs(g.baselineYears).toFixed(1)} years
          </span>{" "}
          over a 50-year horizon. This is your starting line, not today&apos;s result —
          it never moves, so Loop keeps it out of the daily number.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface px-4">
        {g.traits.map((t) => (
          <div key={t.trait} className="flex gap-4 py-3.5 border-b border-line/60 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14.5px] font-medium">{t.trait}</span>
                <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
                  {t.referencePopulation} reference
                </span>
                {t.illustrative && (
                  <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
                    illustrative panel
                  </span>
                )}
                {t.clamped && (
                  <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
                    clamped
                  </span>
                )}
              </div>
              <div className="text-[13px] text-faint mt-1 leading-snug">
                {t.percentile.toFixed(1)} percentile · {t.category} · {t.coverage} ·{" "}
                {t.diseaseRR.toFixed(2)}× disease risk
              </div>
            </div>
            <div className={`num text-[15px] font-medium shrink-0 ${cls(t.minutesPerDay)}`}>
              {signed(t.minutesPerDay)}
            </div>
          </div>
        ))}
      </div>

      {g.unscored.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {g.unscored.map((u) => (
            <li key={u.trait} className="text-[12.5px] text-faint leading-snug pl-3 border-l border-line">
              <span className="text-muted">{u.trait}</span> — not scored. {u.reason}.
            </li>
          ))}
        </ul>
      )}

      {g.nutrition.length > 0 && (
        <div className="mt-4">
          <h3 className="text-[11.5px] uppercase tracking-[0.15em] text-faint mb-2">
            Nutrition genetics — context only, not scored
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {g.nutrition.map((n) => (
              <span
                key={n.name}
                className="text-[12px] rounded-full border border-line bg-surface px-2.5 py-1 text-muted"
                title={`${n.genes.join(", ")} · ${n.coverage}`}
              >
                {n.name}{" "}
                <span className={n.category === "Elevated" ? "text-loss" : "text-faint"}>
                  {n.category.toLowerCase()}
                </span>
              </span>
            ))}
          </div>
          <p className="text-[12px] text-faint mt-2 leading-relaxed">
            These are nutrition-genetics signals. They&apos;ll be scored when food
            tracking ships — scoring them now would mean inventing rates.
          </p>
        </div>
      )}

      <p className="text-[12px] text-faint mt-4 leading-relaxed pl-3 border-l border-loss/40">
        <span className="text-loss">Ancestry matters here.</span> These scores come almost
        entirely from European-ancestry cohorts and lose much of their accuracy outside
        that population. If your ancestry doesn&apos;t match the reference, treat the
        number as closer to noise than signal.
      </p>
    </section>
  );
}
