import Link from "next/link";
import HeroNumber from "@/components/loop/HeroNumber";
import Organism from "@/components/loop/Organism";
import Switcher from "@/components/loop/Switcher";
import TodayScreen from "@/components/loop/TodayScreen";
import Wordmark from "@/components/loop/Wordmark";
import {
  DAY_SPINE_CLAMP,
  SAMPLE_24_DAYS,
  SAMPLE_ANNUAL_DAYS,
  SAMPLE_BANDS,
  SAMPLE_LAST_7,
  SAMPLE_RHR,
  SAMPLE_TOTAL,
} from "@/lib/loop/fixtures";

export const metadata = { title: "Loop — draft A, The Instrument" };

/**
 * DRAFT A — "The Instrument"
 *
 * The orthodox reading of UI_SPEC.md: the product shot is the argument. A
 * logged-out visitor sees the actual Today screen, breathing at 54bpm, before
 * being asked for anything. Copy is minimal because the ring is doing the work.
 *
 * Wide viewport follows §6: the frame sits left of centre with a panel beside
 * it. The spec fills that panel with an attribution trace; here it carries the
 * pitch instead, because on a landing page the first question is "what is
 * this" rather than "where did that number come from".
 */
export default function DraftA() {
  return (
    <>
      <main className="shell-a">
        {/* ─── Mobile hero: the ring alone, no frame chrome ─── */}
        <section className="a-mobile-hero">
          <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
            <Organism
              hours={SAMPLE_24_DAYS}
              clampAt={DAY_SPINE_CLAMP}
              bands={SAMPLE_BANDS}
              size={300}
              rhr={SAMPLE_RHR}
              last7={SAMPLE_LAST_7}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                alignContent: "center",
                gap: "var(--s2)",
                pointerEvents: "none",
              }}
            >
              <HeroNumber minutes={SAMPLE_TOTAL} label="Sample day" />
            </div>
          </div>
        </section>

        {/* ─── The pitch ─── */}
        <section className="a-copy">
          <Wordmark width={82} eager />

          <h1 className="display a-h1">
            Every other app gives you a score out of a hundred.
            <br />
            <span style={{ color: "var(--credit)" }}>Loop gives you minutes.</span>
          </h1>

          <p style={{ color: "var(--ash)", maxWidth: "46ch", margin: "0 0 var(--s4)" }}>
            It reads your WHOOP sleep, resting heart rate, HRV and training load, and
            converts each one into minutes of life expectancy gained or lost — against
            published all-cause-mortality meta-analyses, at rates deliberately set below
            what those studies imply.
          </p>

          <p
            style={{
              color: "var(--ash)",
              maxWidth: "46ch",
              margin: "0 0 var(--s5)",
              fontSize: 14,
            }}
          >
            A genuinely good day scores about{" "}
            <span className="mono" style={{ color: "var(--bone)" }}>
              +{SAMPLE_TOTAL}m
            </span>
            . Held for a year, that is{" "}
            <span className="mono" style={{ color: "var(--bone)" }}>
              {SAMPLE_ANNUAL_DAYS.toFixed(0)} days
            </span>{" "}
            of life. The numbers are small on purpose — they are what the evidence
            supports, not what would look good here.
          </p>

          <p
            className="micro"
            style={{ maxWidth: "46ch", margin: "0 0 var(--s6)", lineHeight: 1.7 }}
          >
            SEVEN SCORED FACTORS · TWELVE CITATIONS · EVERY RATE WRITTEN DOWN
            BEFORE THE CODE WAS
          </p>

          <div style={{ maxWidth: 380 }}>
            <a className="cta" href="/api/auth/login">
              Connect WHOOP
            </a>
            <p
              style={{
                color: "var(--ash)",
                fontSize: 13,
                lineHeight: 1.6,
                margin: "var(--s3) 0 0",
                textAlign: "center",
              }}
            >
              Read-only. Your tokens stay in an encrypted cookie on your device. Loop
              stores nothing on a server.
            </p>
          </div>

          <div className="a-foot">
            <Link className="link" href="/methodology">
              Read the methodology
            </Link>
            <span className="label">Not medical advice</span>
          </div>
        </section>

        {/* ─── Desktop product shot: the real frame, per §6 ─── */}
        <section className="a-shot" aria-label="Product preview">
          <div className="frame frame--shot">
            <TodayScreen ringSize={342} />
          </div>
        </section>
      </main>

      <Switcher current="a" />
    </>
  );
}
