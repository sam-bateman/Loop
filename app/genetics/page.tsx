import Image from "next/image";
import Link from "next/link";
import { loadDemoGenome, type Insight } from "@/lib/genomics";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<Insight["kind"], string> = {
  drug: "Medication",
  supplement: "Supplement",
  habit: "Habit",
};

function InsightRow({ i }: { i: Insight }) {
  const accent =
    i.severity === "high"
      ? "border-loss/50"
      : i.severity === "medium"
        ? "border-accent/40"
        : "border-line";
  return (
    <div className={`rounded-xl border bg-surface px-4 py-4 ${accent}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
          {KIND_LABEL[i.kind]}
        </span>
        {i.genes.slice(0, 3).map((g) => (
          <span key={g} className="num text-[11px] text-faint">
            {g}
          </span>
        ))}
      </div>
      <h3
        className={`text-[15px] font-semibold leading-snug mb-1.5 ${
          i.severity === "high" ? "text-loss" : ""
        }`}
      >
        {i.headline}
      </h3>
      <p className="text-[13px] text-muted leading-relaxed">{i.detail}</p>
    </div>
  );
}

export default function Genetics() {
  const g = loadDemoGenome();

  if (!g) {
    return (
      <main className="min-h-dvh px-6 py-8 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-3">No genome linked</h1>
        <Link href="/dashboard" className="text-accent text-[14px]">
          ← Back
        </Link>
      </main>
    );
  }

  const drugInsights = g.insights.filter((i) => i.kind === "drug");
  const supplementInsights = g.insights.filter((i) => i.kind === "supplement");
  const habitInsights = g.insights.filter((i) => i.kind === "habit");

  return (
    <main className="min-h-dvh px-6 py-8 max-w-lg mx-auto pb-16">
      <header className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="block w-[72px]">
          <Image
            src="/brand/loop-wordmark.png"
            alt="Loop"
            width={1446}
            height={742}
            priority
            className="w-full h-auto"
          />
        </Link>
        <Link href="/dashboard" className="text-[12.5px] text-faint hover:text-muted transition-colors">
          ← Dashboard
        </Link>
      </header>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-[26px] font-semibold tracking-tight">Your genome</h1>
          <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
            demo genome
          </span>
        </div>
        <p className="text-[14px] text-muted leading-relaxed">
          {g.totalVariants?.toLocaleString()} variants read. Your genome doesn&apos;t change,
          so Loop doesn&apos;t score it — it uses it to tell you which medications need care,
          which supplements are worth considering, and which of your daily habits matter
          more for you than for the average person.
        </p>
      </section>

      {/* Medications — the one clinically established thing on this page */}
      {drugInsights.length > 0 && (
        <section className="mb-9">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-1">Medications</h2>
          <p className="text-[11.5px] text-faint num mb-3">
            {g.drugCounts.avoid} avoid · {g.drugCounts.caution} caution ·{" "}
            {g.drugCounts.standard} standard
          </p>
          <div className="space-y-2.5">
            {drugInsights.map((i) => (
              <InsightRow key={i.headline} i={i} />
            ))}
          </div>
          <p className="text-[12px] text-faint mt-3 leading-relaxed">
            Based on{" "}
            <a
              href="https://cpicpgx.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent"
            >
              CPIC guidelines
            </a>
            . This is the most established evidence on this page — pharmacogenomics is used
            clinically. It is still not a prescription: show it to a doctor, don&apos;t act
            on it alone.
          </p>
        </section>
      )}

      {/* Habits — the only link to Loop's daily score */}
      {habitInsights.length > 0 && (
        <section className="mb-9">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-3">
            What this changes in your daily score
          </h2>
          <div className="space-y-2.5">
            {habitInsights.map((i) => (
              <InsightRow key={i.headline} i={i} />
            ))}
          </div>
        </section>
      )}

      {/* Supplements */}
      {supplementInsights.length > 0 && (
        <section className="mb-9">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-3">
            Nutrition &amp; supplements
          </h2>
          <div className="space-y-2.5">
            {supplementInsights.map((i) => (
              <InsightRow key={i.headline} i={i} />
            ))}
          </div>
        </section>
      )}

      {/* Metabolizer table */}
      {g.genes.length > 0 && (
        <section className="mb-9">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-3">
            Drug-metabolising genes
          </h2>
          <div className="rounded-xl border border-line bg-surface px-4">
            {g.genes.map((gene) => (
              <div
                key={gene.gene}
                className="flex items-center justify-between gap-3 py-3 border-b border-line/60 last:border-0"
              >
                <span className="num text-[13.5px]">{gene.gene}</span>
                <span className="num text-[12px] text-faint">{gene.diplotype}</span>
                <span className="text-[12.5px] text-muted text-right flex-1">
                  {gene.phenotype}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Disease risk — percentiles only, deliberately not converted to a score */}
      {g.riskScores.length > 0 && (
        <section className="mb-9">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-3">
            Disease risk scores
          </h2>
          <div className="rounded-xl border border-line bg-surface px-4">
            {g.riskScores.map((r) => (
              <div key={r.trait} className="py-3.5 border-b border-line/60 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[14px] font-medium">{r.trait}</span>
                  <span className="num text-[14px] text-muted">
                    {r.percentile.toFixed(0)}
                    <span className="text-[11px] text-faint"> percentile</span>
                  </span>
                </div>
                <div className="text-[12px] text-faint mt-1">
                  {r.category} · {r.coverage} · {r.referencePopulation} reference
                  {r.illustrative && " · illustrative panel"}
                </div>
              </div>
            ))}
          </div>
          {g.riskSkipped.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {g.riskSkipped.map((s) => (
                <li key={s.trait} className="text-[12px] text-faint leading-snug pl-3 border-l border-line">
                  {s.trait} — not scored, {s.reason}.
                </li>
              ))}
            </ul>
          )}
          <p className="text-[12px] text-faint mt-3 leading-relaxed">
            Shown as percentiles, not converted into minutes of life. These panels are
            illustrative rather than clinically validated, and turning them into a
            life-expectancy figure would imply a precision that isn&apos;t there.
          </p>
        </section>
      )}

      <section className="rounded-xl border border-line bg-surface-2 px-4 py-4 mb-6">
        <h3 className="text-[13px] font-semibold mb-2">Ancestry changes how much of this holds</h3>
        <p className="text-[12.5px] text-faint leading-relaxed">
          Almost all of this evidence comes from European-ancestry cohorts, and both the
          risk scores and some drug-gene guidance lose accuracy outside that population.
          If your ancestry doesn&apos;t match, treat the risk percentiles especially as
          weak signal. None of this is medical advice.
        </p>
      </section>

      <p className="text-[11.5px] text-faint leading-relaxed">
        {g.source}
        <br />
        {g.citation}
      </p>
    </main>
  );
}
