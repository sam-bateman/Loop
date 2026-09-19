import AppFrame from "@/components/loop/AppFrame";
import RoutineLog from "@/components/loop/RoutineLog";
import { loadDemoGenome, type Insight } from "@/lib/genomics";

export const metadata = { title: "Loop — Genetics" };

function plainTitle(insight: Insight) {
  const title = insight.headline.toLowerCase();
  if (title.startsWith("omega-3")) return "Prioritize omega-3 foods";
  if (title.startsWith("carbohydrate")) return "Build meals around slow carbs";
  if (title.startsWith("antioxidant")) return "Get antioxidants from food";
  return insight.headline.replace(/ — .*genetic risk/i, "");
}

export default function GeneticsPage() {
  const genome = loadDemoGenome();

  if (!genome) {
    return (
      <AppFrame>
        <main className="screen genetics-screen">
          <div className="screen-kicker">Genetics</div>
          <h1 className="screen-title">No genetics report yet.</h1>
          <p className="screen-intro">When a report is available, Loop will turn it into a short list of useful notes.</p>
        </main>
      </AppFrame>
    );
  }

  const drugInsights = genome.insights.filter((item) => item.kind === "drug");
  const foodInsights = genome.insights.filter((item) => item.kind === "supplement");
  const habitInsights = genome.insights.filter((item) => item.kind === "habit");

  return (
    <AppFrame scroll>
      <main className="screen genetics-screen">
        <div className="genetics-heading">
          <div>
            <div className="screen-kicker">Genetics</div>
            <h1 className="screen-title">What matters for you.</h1>
          </div>
          <span className="demo-chip">Demo report</span>
        </div>
        <p className="screen-intro">
          No research dashboard. Just the medication notes, food priorities and habits
          worth knowing about.
        </p>

        <section className="important-card">
          <span className="important-icon" aria-hidden="true">!</span>
          <div>
            <span className="card-eyebrow">Most important</span>
            <h2>{genome.drugCounts.avoid} medication needs special care</h2>
            <p>
              This report also flags {genome.drugCounts.caution} medications where dose
              or monitoring may need adjustment. Show these notes to the prescriber or pharmacist.
            </p>
          </div>
        </section>

        <section className="genetics-section">
          <div className="section-copy">
            <span className="card-eyebrow">Medication</span>
            <h2>Bring these up before taking them</h2>
          </div>
          <div className="advice-list">
            {drugInsights.map((item) => (
              <article className={`advice-card severity-${item.severity}`} key={item.headline}>
                <div className="advice-mark" aria-hidden="true" />
                <div>
                  <h3>{item.headline}</h3>
                  <p>{item.detail}</p>
                  <span className="evidence-tag">Based on {item.genes.join(" + ")}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <RoutineLog avoid={genome.drugs.avoid.map((drug) => drug.drug)} caution={genome.drugs.caution.map((drug) => drug.drug)} />

        <section className="genetics-section">
          <div className="section-copy">
            <span className="card-eyebrow">Food first</span>
            <h2>What to eat more often</h2>
            <p>These are meal priorities, not proof that you have a deficiency.</p>
          </div>
          <div className="advice-list">
            {foodInsights.map((item) => (
              <article className="advice-card food-advice" key={item.headline}>
                <div className="advice-mark" aria-hidden="true" />
                <div>
                  <h3>{plainTitle(item)}</h3>
                  <p>{item.detail}</p>
                  <span className="evidence-tag">Genetic clue · {item.genes.join(" + ")}</span>
                </div>
              </article>
            ))}
          </div>
          <a className="food-link" href="/food">See power meals and ingredients <span>→</span></a>
        </section>

        {habitInsights.length > 0 && (
          <section className="genetics-section">
            <div className="section-copy">
              <span className="card-eyebrow">Daily habits</span>
              <h2>Small things to watch</h2>
            </div>
            <div className="advice-list">
              {habitInsights.map((item) => (
                <article className="advice-card habit-advice" key={item.headline}>
                  <div className="advice-mark" aria-hidden="true" />
                  <div><h3>{item.headline}</h3><p>{item.detail}</p></div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="supplement-note">
          <span aria-hidden="true">✦</span>
          <div>
            <h2>Should you add a supplement?</h2>
            <p>
              Not from genetics alone. Start with food. If you are considering a supplement,
              confirm the need with the appropriate blood test or a clinician first—especially
              when you also take medication.
            </p>
          </div>
        </section>

        <details className="technical-details">
          <summary>See the technical evidence</summary>
          <div className="technical-body">
            <p>
              These details help a clinician check the report. They are not diagnoses and do not
              belong in the main experience.
            </p>
            <h3>Pharmacogenetic results</h3>
            {genome.genes.map((gene) => (
              <div className="technical-row" key={gene.gene}>
                <b>{gene.gene}</b><span>{gene.diplotype}</span><small>{gene.phenotype}</small>
              </div>
            ))}
            <h3>Illustrative risk scores</h3>
            {genome.riskScores.map((risk) => (
              <div className="technical-row" key={risk.trait}>
                <b>{risk.trait}</b><span>{risk.percentile}th percentile</span><small>{risk.coverage}</small>
              </div>
            ))}
          </div>
        </details>
        <p className="medical-footnote">
          Demo data only. Loop does not diagnose conditions or replace your doctor or pharmacist.
        </p>
      </main>
    </AppFrame>
  );
}
