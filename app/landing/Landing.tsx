"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMotionBudget } from "./use-motion-budget";
import glass from "./glass-button.module.css";

// Each of these pulls in a WebGL stack (three.js, Paper's shader mount, an SVG
// displacement pipeline). None of them may block the headline, so all three are
// client-only and mounted after the motion budget says yes.
const GradientBackdrop = dynamic(() => import("./GradientBackdrop"), { ssr: false });
const LiquidMark = dynamic(() => import("./LiquidMark"), { ssr: false });
const GlassLens = dynamic(() => import("./GlassLens"), { ssr: false });

/**
 * The scoring model, in the order it reads on the dashboard. Every rate here is
 * the constant of the same name in lib/scoring.ts, derived in
 * METHODOLOGY-WHOOP.md §2. If one changes there, change it here — a landing
 * page that quotes rates the engine no longer uses is worse than one that
 * quotes none.
 */
const SIGNALS = [
  {
    name: "Sleep duration",
    rate: "−18 min",
    per: "per hour under 6.8 h",
    source: "Cappuccio 2010",
  },
  {
    name: "Sleep consistency",
    rate: "±25 min",
    per: "across the regularity range",
    source: "Windred 2024",
  },
  {
    name: "Resting heart rate",
    rate: "−10 min",
    per: "per 5 bpm over 60",
    source: "Zhang 2016",
  },
  {
    name: "Heart rate variability",
    rate: "±5 min",
    per: "per 10% off your baseline",
    source: "Hillebrand 2013",
  },
  {
    name: "Cardiovascular activity",
    rate: "+6 min",
    per: "per 15 min at zone 2+",
    source: "Wen 2011",
  },
] as const;

export default function Landing({
  error,
  signedIn = false,
}: {
  error?: string | null;
  signedIn?: boolean;
}) {
  const { ambient, lens } = useMotionBudget();
  const [backdropIn, setBackdropIn] = useState(false);

  // The gradient's first frames are a flat colour block; crossfading in a beat
  // late hides that and keeps the text readable from the very first paint.
  useEffect(() => {
    if (!ambient) return;
    const id = window.setTimeout(() => setBackdropIn(true), 260);
    return () => window.clearTimeout(id);
  }, [ambient]);

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {ambient && (
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-[1400ms] ease-out ${
            backdropIn ? "opacity-100" : "opacity-0"
          }`}
        >
          <GradientBackdrop />
          {/* Scrims: the gradient is atmosphere, the type is the page. */}
          <div className="absolute inset-0 bg-bg/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
        </div>
      )}

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-6 sm:px-10">
        <header className="flex items-center justify-between py-7">
          <Image
            src="/brand/loop-wordmark.png"
            alt="Loop"
            width={1446}
            height={742}
            priority
            className="h-auto w-[78px]"
          />
          <Link
            href="/methodology"
            className={`${glass.glass} inline-flex h-10 items-center rounded-full bg-white/10 px-4 text-[13px] text-muted transition-colors hover:bg-white/[0.18] hover:text-text`}
          >
            Methodology
          </Link>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-1 flex-col justify-center py-16 sm:py-24">
            <div className="relative -ml-2 mb-8 h-[120px] w-[260px] sm:h-[150px] sm:w-[320px]">
              {ambient ? (
                <LiquidMark className="h-full w-full" />
              ) : (
                <Image
                  src="/brand/loop-mark.png"
                  alt=""
                  width={892}
                  height={411}
                  priority
                  className="h-full w-full object-contain object-left"
                />
              )}
            </div>

            <h1 className="max-w-[16ch] text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[68px]">
              Your WHOOP data, priced in{" "}
              <span className="text-accent">minutes of life</span>.
            </h1>

            <p className="mt-7 max-w-[54ch] text-[16px] leading-relaxed text-muted sm:text-[18px]">
              Loop reads your sleep, resting heart rate, HRV and training load, and converts
              each one into minutes of life expectancy gained or lost — using published
              all-cause-mortality meta-analyses, not vibes.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-8 max-w-md rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-[13.5px] text-loss"
              >
                {error}
              </div>
            )}

            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
              <a
                href={signedIn ? "/dashboard" : "/api/auth/login"}
                className={`${glass.glass} w-full rounded-full bg-white/[0.14] px-8 py-4 text-center text-[15px] font-semibold text-text transition-[background-color,transform] duration-300 hover:bg-white/[0.24] active:scale-[0.98] sm:w-auto`}
              >
                {signedIn ? "Open Loop →" : "Sign in with WHOOP"}
              </a>
              <p className="max-w-[34ch] text-[12.5px] leading-relaxed text-faint">
                {signedIn
                  ? "WHOOP is connected. Your tokens stay in an encrypted cookie on your device — Loop stores nothing on a server."
                  : "Read-only. Your tokens stay in an encrypted cookie on your device — Loop stores nothing on a server."}
              </p>
            </div>
          </section>

          <section className="pb-16 sm:pb-24">
            {/* The lens refracts a clone of this element, so it has to be a
                plain DOM subtree with real edges to bend — hence the panel,
                rather than a bare list sitting on the page background. */}
            <div
              id="signals"
              className="rounded-[28px] border border-line/80 bg-[#0e0e11] px-6 py-10 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] sm:px-10 sm:py-12"
            >
              <div className="flex items-baseline justify-between gap-6">
                <h2 className="text-[13px] uppercase tracking-[0.18em] text-faint">
                  The whole model
                </h2>
                {lens && <p className="text-[12px] text-faint">Drag the lens</p>}
              </div>

              <dl className="mt-8">
                {SIGNALS.map((signal, i) => (
                  <div
                    key={signal.name}
                    className={`grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 sm:grid-cols-[1.1fr_0.9fr_auto] ${
                      i < SIGNALS.length - 1 ? "border-b border-line/60" : ""
                    }`}
                  >
                    <dt className="text-[16px] tracking-[-0.01em] sm:text-[18px]">
                      {signal.name}
                    </dt>
                    {/* Narrow: the citation rides up beside the name and the
                        rate takes its own full-width line — three columns of
                        this at 375px wraps the numbers mid-unit. */}
                    <dd className="text-right text-[12.5px] text-faint sm:order-3">
                      {signal.source}
                    </dd>
                    <dd className="col-span-2 mt-1.5 flex items-baseline gap-2 text-[14px] text-muted sm:order-2 sm:col-span-1 sm:mt-0">
                      <span className="num text-text">{signal.rate}</span>
                      <span>{signal.per}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-8 max-w-[62ch] text-[13.5px] leading-relaxed text-faint">
              One microlife is 30 minutes (Spiegelhalter 2012). Rates are measured against
              the population-average adult, not against an ideal, and each is deliberately
              conservative — written down and cited before any of it was written in code.{" "}
              <Link
                href="/methodology"
                className="text-muted underline decoration-line underline-offset-4 transition-colors hover:text-text"
              >
                Read the derivation
              </Link>
              .
            </p>
          </section>
        </main>

        <footer className="flex items-center justify-between border-t border-line py-7 text-[12.5px] text-faint">
          <Link href="/methodology" className="transition-colors hover:text-muted">
            Methodology &amp; citations →
          </Link>
          <span>Not medical advice</span>
        </footer>
      </div>

      {lens && <GlassLens targetId="signals" />}
    </div>
  );
}
