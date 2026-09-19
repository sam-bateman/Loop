import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accessToken, fetchAll } from "@/lib/whoop";
import { getSession } from "@/lib/session";
import { scoreDays, summarize, type DayScore, type Factor } from "@/lib/scoring";
import { loadDemoGenome } from "@/lib/genomics";
import styles from "@/app/food/dashboard.module.css";

export const dynamic = "force-dynamic";

function signed(n: number, digits = 0) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(digits)}`;
}

function tone(n: number) {
  return n > 0 ? styles.positive : n < 0 ? styles.negative : styles.neutral;
}

function Icon({ name }: { name: "home" | "food" | "genetics" | "science" }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
    food: <><path d="M7 3v7M4 3v4c0 2 1.3 3 3 3s3-1 3-3V3M7 10v11M16 3c-2 2-3 5-3 8h4v10M17 3v8"/></>,
    genetics: <><path d="M7 3c0 6 10 12 10 18M17 3C17 9 7 15 7 21M8.5 6h7M7.5 10h9M7.5 14h9M8.5 18h7"/></>,
    science: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.5 16h9"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Ring({ label, value, sub, progress, color }: { label: string; value: string; sub?: string; progress: number; color: "green" | "blue" | "orange" }) {
  const p = Math.max(2, Math.min(100, progress));
  return (
    <div className={styles.ringMetric}>
      <div className={`${styles.ring} ${styles[color]}`} style={{ "--progress": `${p * 3.6}deg` } as React.CSSProperties}>
        <div className={styles.ringInner}><strong>{value}</strong>{sub && <span>{sub}</span>}</div>
      </div>
      <span className={styles.ringLabel}>{label}</span>
    </div>
  );
}

function Trend({ days }: { days: DayScore[] }) {
  const shown = [...days].reverse().slice(-21);
  const max = Math.max(...shown.map((day) => Math.abs(day.minutes)), 30);
  return (
    <div className={styles.trend} aria-label="Daily life expectancy score for the last 21 days">
      {shown.map((day) => {
        const height = Math.max(4, (Math.abs(day.minutes) / max) * 52);
        return (
          <div className={styles.trendDay} key={day.date} title={`${day.date}: ${signed(day.minutes)} minutes`}>
            <div>{day.minutes >= 0 && <span className={styles.trendGain} style={{ height }} />}</div>
            <i />
            <div>{day.minutes < 0 && <span className={styles.trendLoss} style={{ height }} />}</div>
          </div>
        );
      })}
    </div>
  );
}

function FactorRow({ factor }: { factor: Factor }) {
  return (
    <div className={styles.factorRow}>
      <div>
        <div className={styles.factorTitle}>{factor.label}{factor.guarded && <span>adjusted</span>}{factor.weak && <span>weak evidence</span>}</div>
        <p>{factor.detail}</p>
      </div>
      <strong className={tone(factor.minutes)}>{signed(factor.minutes)}</strong>
    </div>
  );
}

export default async function Dashboard() {
  const token = await accessToken();
  if (!token) redirect("/");

  const data = await fetchAll(token, 30);
  if (!data.cycles.length) {
    return <main className={styles.empty}><Image src="/brand/loop-wordmark.png" alt="Loop" width={1446} height={742} priority /><h1>No WHOOP data yet</h1><p>Loop connected successfully, but WHOOP returned no cycles for the last 30 days.</p><a href="/api/auth/logout">Disconnect</a></main>;
  }

  const session = await getSession();
  const days = scoreDays(data, { age: session.age });
  const summary = summarize(days);
  const today = days.find((day) => day.factors.length > 0);
  const name = session.name ?? data.profile?.first_name;
  const firstName = name?.split(" ")[0];
  const bestDay = [...days].sort((a, b) => b.minutes - a.minutes)[0];
  const worstDay = [...days].sort((a, b) => a.minutes - b.minutes)[0];
  const leadFactor = today ? [...today.factors].sort((a, b) => Math.abs(b.minutes) - Math.abs(a.minutes))[0] : null;
  const genome = loadDemoGenome();
  const genetics = genome ? { avoid: genome.drugCounts.avoid, caution: genome.drugCounts.caution, insights: genome.insights.length } : null;
  const date = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div><p>{date}</p><h1>{firstName ? `Hi, ${firstName}` : "Today"}</h1></div>
        <div className={styles.avatar} aria-label={name ? `${name}'s profile` : "Your profile"}>{(firstName?.[0] ?? "L").toUpperCase()}</div>
      </header>

      <div className={styles.syncPill}><span />WHOOP synced · last 30 days ready</div>

      <section className={styles.heroCard}>
        <div className={styles.lifeHeader}>
          <div><span>Daily pace</span><div><strong className={tone(summary.perDay)}>{signed(summary.perDay)}</strong><small>min / day</small></div></div>
          <div className={styles.projection}><span>One-year projection</span><strong className={tone(summary.annualDays)}>{signed(summary.annualDays, 1)} days</strong></div>
        </div>
        <div className={styles.ringGrid}>
          <Ring label="Recovery" value={today?.recovery == null ? "—" : `${Math.round(today.recovery)}%`} progress={today?.recovery ?? 0} color="green" />
          <Ring label="Sleep" value={today?.sleepHours == null ? "—" : today.sleepHours.toFixed(1)} sub={today?.sleepHours == null ? undefined : "hours"} progress={today?.sleepHours == null ? 0 : (today.sleepHours / 8) * 100} color="blue" />
          <Ring label="Strain" value={today?.strain == null ? "—" : today.strain.toFixed(1)} sub="of 21" progress={today?.strain == null ? 0 : (today.strain / 21) * 100} color="orange" />
        </div>
        {leadFactor && <div className={styles.insight}><div>✦</div><p><strong>{leadFactor.minutes >= 0 ? "Your strongest tailwind" : "Your biggest opportunity"}</strong><span><b>{leadFactor.label}</b> is contributing <em className={tone(leadFactor.minutes)}>{signed(leadFactor.minutes)} minutes</em>. {leadFactor.detail}</span></p></div>}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><span>Last 21 days</span><h2>Your trajectory</h2></div><p>Best <b className={styles.positive}>{signed(bestDay.minutes)}</b> · Low <b className={styles.negative}>{signed(worstDay.minutes)}</b></p></div>
        <div className={styles.card}><Trend days={days} /></div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}><div><span>Nutrition</span><h2>Simple food logging</h2></div></div>
        <Link href="/food" className={styles.geneticsCard}>
          <div className={styles.geneticsIcon}><Icon name="food" /></div>
          <div><span>Food first</span><h2>Power meals & ingredients</h2><p>Pick an easy meal, scan a barcode, or describe what you ate.</p></div><b>→</b>
        </Link>
      </section>

      {today && <section className={styles.section}>
        <div className={styles.sectionHeader}><div><span>Most recent score</span><h2>What moved your number</h2></div><strong className={`${styles.dayTotal} ${tone(today.minutes)}`}>{signed(today.minutes)}<small>min</small></strong></div>
        <div className={`${styles.card} ${styles.factorList}`}>{today.factors.map((factor) => <FactorRow key={factor.label} factor={factor} />)}</div>
        {today.notes.length > 0 && <div className={styles.notes}>{today.notes.map((note) => <p key={note}>{note}</p>)}</div>}
      </section>}

      {today && <section className={styles.section}>
        <div className={styles.sectionHeader}><div><span>Today</span><h2>Vitals</h2></div></div>
        <div className={styles.vitalsGrid}>
          <div><span>Resting HR</span><strong>{today.rhr == null ? "—" : Math.round(today.rhr)}<small>bpm</small></strong></div>
          <div><span>HRV</span><strong>{today.hrv == null ? "—" : Math.round(today.hrv)}<small>ms</small></strong></div>
          <div><span>Sleep</span><strong>{today.sleepHours == null ? "—" : today.sleepHours.toFixed(1)}<small>hours</small></strong></div>
          <div><span>Recovery</span><strong>{today.recovery == null ? "—" : Math.round(today.recovery)}<small>%</small></strong></div>
        </div>
      </section>}

      {genetics && <Link href="/genetics" className={styles.geneticsCard}><div className={styles.geneticsIcon}><Icon name="genetics" /></div><div><span>Personal baseline</span><h2>Your genetics</h2><p>{genetics.insights} useful notes · {genetics.caution} need dose care{genetics.avoid > 0 ? ` · ${genetics.avoid} important` : ""}</p></div><b>→</b></Link>}

      <aside className={styles.disclosure}><strong>Built for direction, not diagnosis.</strong><p>Loop applies population-level observational estimates to your data. Associations are not proof of causation.</p><Link href="/methodology">Read the methodology →</Link></aside>
      <a href="/api/auth/logout" className={styles.disconnect}>Disconnect WHOOP</a>

      <nav className={styles.bottomNav} aria-label="Main navigation">
        <Link href="/dashboard" className={styles.active}><Icon name="home" /><span>Home</span></Link>
        <Link href="/food"><Icon name="food" /><span>Food</span></Link>
        <Link href="/genetics"><Icon name="genetics" /><span>Genetics</span></Link>
        <Link href="/methodology"><Icon name="science" /><span>Science</span></Link>
      </nav>
    </main>
  );
}
