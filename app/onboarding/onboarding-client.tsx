"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Ruler from "./ruler";

/** Sync theatre. Real work already happened; these are the honest step names. */
const SYNC_STEPS: { label: string; ms: number }[] = [
  { label: "Contacting WHOOP", ms: 1200 },
  { label: "Verifying authorization", ms: 1500 },
  { label: "Establishing secure connection", ms: 1700 },
  { label: "Reading your profile", ms: 2000 },
  { label: "Syncing 30 days of cycles", ms: 3400 },
  { label: "Checking sleep & recovery records", ms: 2600 },
];

const QUESTIONS = ["name", "sex", "age", "weight"] as const;
const SYNC_WEIGHT = 40; // % of the bar the connection owns
const Q_WEIGHT = 60; // % the four answers own

type Sex = "male" | "female" | "other";

export default function Onboarding({
  initialName,
  initialWeightLb,
}: {
  initialName: string;
  initialWeightLb?: number;
}) {
  const router = useRouter();

  const [done, setDone] = useState(0); // sync steps completed
  const [qIndex, setQIndex] = useState(-1); // -1 = intro, 4 = finishing
  const saving = useRef(false);

  const [name, setName] = useState(initialName);
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState(32);
  const [weight, setWeight] = useState(initialWeightLb ?? 165);

  // Walk the sync steps on a timer.
  useEffect(() => {
    if (done >= SYNC_STEPS.length) return;
    const t = setTimeout(() => setDone((d) => d + 1), SYNC_STEPS[done].ms);
    return () => clearTimeout(t);
  }, [done]);

  const synced = done >= SYNC_STEPS.length;
  const answered = Math.max(0, qIndex);
  const pct = Math.round(
    (SYNC_WEIGHT * done) / SYNC_STEPS.length + (Q_WEIGHT * answered) / QUESTIONS.length,
  );

  // Once the last question is in, wait for the sync to land, then hand off.
  useEffect(() => {
    if (qIndex !== QUESTIONS.length || !synced || saving.current) return;
    saving.current = true;
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sex, age, weightLb: weight }),
    })
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/dashboard"));
  }, [qIndex, synced, name, sex, age, weight, router]);

  const step: "intro" | "finish" | (typeof QUESTIONS)[number] =
    qIndex === -1 ? "intro" : qIndex >= QUESTIONS.length ? "finish" : QUESTIONS[qIndex];
  const canContinue =
    step === "name" ? name.trim().length > 0 : step === "sex" ? sex !== null : true;

  return (
    <main className="min-h-dvh flex flex-col px-6 pt-6 pb-8 max-w-lg mx-auto">
      {/* Progress header */}
      <header className="flex items-center gap-3 mb-1">
        {qIndex > 0 && qIndex < QUESTIONS.length ? (
          <button
            onClick={() => setQIndex((i) => i - 1)}
            aria-label="Back"
            className="shrink-0 w-9 h-9 -ml-1 rounded-full border border-line flex items-center justify-center text-muted active:scale-95 transition-transform"
          >
            ←
          </button>
        ) : (
          <Image
            src="/brand/loop-wordmark.png"
            alt="Loop"
            width={1446}
            height={742}
            priority
            className="w-[52px] h-auto shrink-0"
          />
        )}
        <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="num text-[12.5px] text-muted w-9 text-right tabular-nums">{pct}%</span>
      </header>

      {/* Live sync line, always visible so the questions feel like shared time */}
      <SyncLine done={done} synced={synced} compact={qIndex >= 0} />

      {step === "intro" && (
        <Intro done={done} synced={synced} onStart={() => setQIndex(0)} />
      )}

      {step === "name" && (
        <Question title="First, what should we call you?" hint="This only ever lives in your session cookie.">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) setQIndex(1);
            }}
            placeholder="Your name"
            className="w-full bg-transparent border-b border-line focus:border-accent outline-none text-[30px] font-semibold tracking-tight py-3 placeholder:text-faint/60 transition-colors"
          />
        </Question>
      )}

      {step === "sex" && (
        <Question
          title="What sex were you assigned at birth?"
          hint="Mortality tables are sex-specific. It changes the baseline, not the judgement."
        >
          <div className="grid gap-2.5">
            {(
              [
                ["male", "Male"],
                ["female", "Female"],
                ["other", "Other / prefer not to say"],
              ] as [Sex, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => {
                  setSex(v);
                  navigator.vibrate?.(6);
                  setTimeout(() => setQIndex(2), 180);
                }}
                className={`w-full text-left rounded-2xl border px-5 py-4 text-[16px] font-medium transition-colors active:scale-[0.99] ${
                  sex === v
                    ? "border-accent bg-accent/10 text-text"
                    : "border-line bg-surface text-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Question>
      )}

      {step === "age" && (
        <Question title="How old are you?" hint="Loop scales every rate down with age — the same habit buys a younger body more time.">
          <Dial value={age} unit="years" caption={ageCaption(age)} />
          <Ruler min={16} max={90} value={age} onChange={setAge} majorEvery={5} labelEvery={10} label="Age in years" />
        </Question>
      )}

      {step === "weight" && (
        <Question title="And your weight?" hint="Used for context on training load. Nothing here is a target.">
          <Dial value={weight} unit="lb" caption={initialWeightLb ? "From your WHOOP profile" : "Drag to adjust"} />
          <Ruler min={80} max={400} value={weight} onChange={setWeight} majorEvery={5} labelEvery={20} label="Weight in pounds" />
        </Question>
      )}

      {step === "finish" && (
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-10 h-10 rounded-full border-2 border-line border-t-accent animate-spin mb-6" />
          <h1 className="text-[22px] font-semibold tracking-tight mb-2">
            {synced ? "All set" : "Finishing your sync"}
          </h1>
          <p className="text-muted text-[14px] max-w-[280px] leading-relaxed">
            {synced
              ? "Scoring your last 30 days against the model."
              : "Your answers are saved. Waiting on the last of your WHOOP history."}
          </p>
        </div>
      )}

      {step !== "intro" && step !== "finish" && step !== "sex" && (
        <button
          disabled={!canContinue}
          onClick={() => setQIndex((i) => i + 1)}
          className="mt-auto w-full rounded-full bg-text text-bg font-semibold text-[15px] py-4 disabled:opacity-25 active:scale-[0.98] transition-all"
        >
          Continue
        </button>
      )}
    </main>
  );
}

function ageCaption(age: number) {
  if (age < 30) return "Full weighting — nothing is discounted yet";
  if (age < 50) return "Rates get scaled down slightly at your age";
  return "Rates are scaled down meaningfully at your age";
}

function Dial({ value, unit, caption }: { value: number; unit: string; caption: string }) {
  return (
    <div className="text-center mb-5">
      <p className="text-[13px] text-muted mb-2">{caption}</p>
      <div className="flex items-baseline justify-center gap-2">
        <span className="num text-[52px] leading-none font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <span className="text-[17px] text-muted">{unit}</span>
      </div>
    </div>
  );
}

function Question({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col pt-8">
      <h1 className="text-[27px] leading-[1.18] font-semibold tracking-[-0.025em] mb-2">{title}</h1>
      <p className="text-faint text-[13.5px] leading-relaxed mb-10">{hint}</p>
      <div className="flex-1 flex flex-col justify-center pb-6">{children}</div>
    </div>
  );
}

function SyncLine({ done, synced, compact }: { done: number; synced: boolean; compact: boolean }) {
  if (!compact) return null;
  return (
    <div className="flex items-center gap-2 mt-3 h-4">
      {synced ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[11.5px] text-muted">WHOOP connected · 30 days synced</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11.5px] text-faint">{SYNC_STEPS[done].label}…</span>
        </>
      )}
    </div>
  );
}

function Intro({
  done,
  synced,
  onStart,
}: {
  done: number;
  synced: boolean;
  onStart: () => void;
}) {
  const ready = done >= 2;

  return (
    <div className="flex-1 flex flex-col pt-10">
      <h1 className="text-[27px] leading-[1.18] font-semibold tracking-[-0.025em] mb-2">
        {synced ? "Your WHOOP is connected." : "Pulling your WHOOP history."}
      </h1>
      <p className="text-faint text-[13.5px] leading-relaxed mb-8">
        Thirty days of sleep, recovery and strain, read once and scored on your device.
      </p>

      <ul className="space-y-3 mb-10">
        {SYNC_STEPS.map((s, i) => {
          const state = i < done ? "done" : i === done ? "active" : "pending";
          return (
            <li key={s.label} className="flex items-center gap-3">
              <span
                className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[9px] transition-colors ${
                  state === "done"
                    ? "border-accent bg-accent text-bg"
                    : state === "active"
                      ? "border-accent animate-pulse"
                      : "border-line"
                }`}
              >
                {state === "done" ? "✓" : ""}
              </span>
              <span
                className={`text-[14px] transition-colors ${
                  state === "pending" ? "text-faint/50" : state === "active" ? "text-text" : "text-muted"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>

      <div
        className={`mt-auto transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <div className="rounded-2xl border border-line bg-surface px-5 py-4 mb-4">
          <p className="text-[15px] leading-relaxed">
            {synced
              ? "Before we score it, we have a few questions for you."
              : "While this connects, we have a few questions for you."}
          </p>
          <p className="text-faint text-[13px] leading-relaxed mt-1.5">
            Four of them. They sharpen the numbers WHOOP can&apos;t tell us.
          </p>
        </div>
        <button
          disabled={!ready}
          onClick={onStart}
          className="w-full rounded-full bg-text text-bg font-semibold text-[15px] py-4 active:scale-[0.98] transition-transform"
        >
          Let&apos;s go
        </button>
      </div>
    </div>
  );
}
