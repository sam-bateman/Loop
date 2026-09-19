import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { accessToken, fetchAll } from "@/lib/whoop";
import { scoreDays, summarize, type DayScore, type Factor } from "@/lib/scoring";

export const dynamic = "force-dynamic";

function signClass(n: number) {
  return n > 0 ? "text-gain" : n < 0 ? "text-loss" : "text-faint";
}
function signed(n: number) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;
}

function Strip({ days }: { days: DayScore[] }) {
  const shown = [...days].reverse().slice(-21);
  const max = Math.max(...shown.map((d) => Math.abs(d.minutes)), 30);
  return (
    <div className="flex items-center gap-[3px] h-24">
      {shown.map((d) => {
        const h = (Math.abs(d.minutes) / max) * 44;
        const up = d.minutes >= 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col justify-center h-full" title={`${d.date}: ${signed(d.minutes)} min`}>
            <div className="h-[44px] flex items-end justify-center">
              {up && <div className="w-full rounded-t-[2px] bg-gain/80" style={{ height: `${Math.max(h, 2)}px` }} />}
            </div>
            <div className="h-px bg-line" />
            <div className="h-[44px] flex items-start justify-center">
              {!up && <div className="w-full rounded-b-[2px] bg-loss/80" style={{ height: `${Math.max(h, 2)}px` }} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FactorRow({ f }: { f: Factor }) {
  return (
    <div className="flex gap-4 py-3.5 border-b border-line/60 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-medium">{f.label}</span>
          {f.weak && (
            <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
              weak evidence
            </span>
          )}
          {f.guarded && (
            <span className="text-[10px] uppercase tracking-wider text-faint border border-line rounded px-1.5 py-px">
              halved
            </span>
          )}
        </div>
        <div className="text-[13px] text-faint mt-1 leading-snug">{f.detail}</div>
      </div>
      <div className={`num text-[15px] font-medium shrink-0 tabular-nums ${signClass(f.minutes)}`}>
        {signed(f.minutes)}
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const token = await accessToken();
  if (!token) redirect("/");

  const data = await fetchAll(token, 30);
  if (!data.cycles.length) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
        <h1 className="text-xl font-semibold mb-3">No WHOOP data yet</h1>
        <p className="text-muted text-[15px] mb-6">
          Loop connected successfully, but WHOOP returned no cycles for the last 30 days.
        </p>
        <a href="/api/auth/logout" className="text-accent text-[14px]">Disconnect</a>
      </main>
    );
  }

  const days = scoreDays(data);
  const s = summarize(days);
  const today = days.find((d) => d.factors.length > 0);
  const name = data.profile?.first_name;

  const bestDay = [...days].sort((a, b) => b.minutes - a.minutes)[0];
  const worstDay = [...days].sort((a, b) => a.minutes - b.minutes)[0];

  return (
    <main className="min-h-dvh px-6 py-8 max-w-lg mx-auto pb-16">
      <header className="flex items-center justify-between mb-10">
        <Image src="/brand/loop-wordmark.png" alt="Loop" width={1446} height={742} priority className="w-[72px] h-auto" />
        <a href="/api/auth/logout" className="text-[12.5px] text-faint hover:text-muted transition-colors">
          Disconnect
        </a>
      </header>

      {/* Hero */}
      <section className="mb-9">
        <p className="text-[13px] text-muted mb-3">
          {name ? `${name}, over` : "Over"} your last {s.daysScored} days, your habits are running at
        </p>
        <div className="flex items-baseline gap-2.5">
          <span className={`num text-[56px] leading-none font-semibold tracking-tight ${signClass(s.perDay)}`}>
            {s.perDay > 0 ? "+" : s.perDay < 0 ? "−" : ""}
            {Math.abs(s.perDay).toFixed(0)}
          </span>
          <span className="text-[15px] text-muted">min / day</span>
        </div>
        <p className="text-[13.5px] text-faint mt-3 leading-relaxed">
          Held for a year that is{" "}
          <span className={signClass(s.annualDays)}>
            {s.annualDays > 0 ? "+" : "−"}
            {Math.abs(s.annualDays).toFixed(1)} days
          </span>{" "}
          of life expectancy — {Math.abs(s.microlives).toFixed(1)} microlives{" "}
          {s.microlives >= 0 ? "banked" : "spent"} so far.
        </p>
      </section>

      {/* Strip */}
      <section className="mb-9">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint">Last 21 days</h2>
          <span className="text-[11.5px] text-faint num">
            best {signed(bestDay.minutes)} · worst {signed(worstDay.minutes)}
          </span>
        </div>
        <Strip days={days} />
      </section>

      {/* Today's breakdown */}
      {today && (
        <section className="mb-9">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint">
              Most recent day
            </h2>
            <span className="text-[11.5px] text-faint num">{today.date}</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`num text-[30px] font-semibold ${signClass(today.minutes)}`}>
              {signed(today.minutes)}
            </span>
            <span className="text-[13px] text-muted">min</span>
          </div>

          <div className="rounded-xl border border-line bg-surface px-4">
            {today.factors.map((f) => (
              <FactorRow key={f.label} f={f} />
            ))}
          </div>

          {today.notes.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {today.notes.map((n) => (
                <li key={n} className="text-[12.5px] text-faint leading-snug pl-3 border-l border-line">
                  {n}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Raw signals */}
      {today && (
        <section className="mb-9">
          <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-3">Signals</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ["Sleep", today.sleepHours != null ? `${today.sleepHours.toFixed(1)}h` : "—"],
              ["Resting HR", today.rhr != null ? `${Math.round(today.rhr)} bpm` : "—"],
              ["HRV", today.hrv != null ? `${Math.round(today.hrv)} ms` : "—"],
              ["Day strain", today.strain != null ? today.strain.toFixed(1) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-surface px-4 py-3">
                <div className="text-[11.5px] text-faint uppercase tracking-wider mb-1">{label}</div>
                <div className="num text-[19px] font-medium">{value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Honesty box */}
      <section className="rounded-xl border border-line bg-surface-2 px-4 py-4 mb-8">
        <h3 className="text-[13px] font-semibold mb-2">What this number is, and isn&apos;t</h3>
        <p className="text-[12.5px] text-faint leading-relaxed">
          These are population-level estimates from observational cohort studies, applied to one
          person. None of the underlying associations are established as causal, the factors are
          summed even though the source cohorts overlap, and one modifier (strain vs. recovery) has
          no mortality evidence behind it at all. Loop states its rates conservatively for exactly
          this reason. It is not medical advice.
        </p>
      </section>

      <footer className="flex items-center justify-between text-[12.5px] text-faint">
        <Link href="/methodology" className="hover:text-muted transition-colors">
          Every rate, with citations →
        </Link>
      </footer>
    </main>
  );
}
