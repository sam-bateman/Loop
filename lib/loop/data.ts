import { accessToken, fetchAll } from "@/lib/whoop";
import { scoreDays } from "@/lib/scoring";
import { toView, type LoopView } from "./adapter";
import {
  SAMPLE_24_DAYS,
  SAMPLE_BANDS,
  SAMPLE_DAYS,
  SAMPLE_LAST_7,
  SAMPLE_RHR,
  SAMPLE_TOTAL,
} from "./fixtures";

export type LoopData = LoopView & {
  /** "live" is a real WHOOP pull. Everything else renders demonstration data. */
  source: "live" | "demo";
  /** Set when a WHOOP account is connected but the pull or the scoring failed. */
  error?: string;
};

export const DEMO_DATA: LoopData = {
  source: "demo",
  today: null,
  rawDays: [],
  bands: SAMPLE_BANDS,
  total: SAMPLE_TOTAL,
  ledger: SAMPLE_DAYS,
  coronaDays: SAMPLE_24_DAYS,
  last7: SAMPLE_LAST_7,
  rhr: SAMPLE_RHR,
  annualDays: (SAMPLE_TOTAL * 365) / 1440,
};

/**
 * The one place the screens get their numbers.
 *
 * Signed in → a live WHOOP pull scored by lib/scoring.ts. Signed out, or the
 * pull fails → the fixture day, labelled as demonstration data everywhere it
 * renders. It never silently falls back to fixtures while claiming to be live:
 * `source` says which, and the screens print it.
 */
export async function getLoopData(): Promise<LoopData> {
  let token: string | null = null;
  try {
    token = await accessToken();
  } catch {
    // iron-session throws when SESSION_SECRET is unset, which is the normal
    // state on a preview deployment. Demo data is the right answer there.
    return DEMO_DATA;
  }
  if (!token) return DEMO_DATA;

  try {
    const data = await fetchAll(token, 30);
    if (!data.cycles.length) {
      return { ...DEMO_DATA, error: "WHOOP returned no cycles for the last 30 days." };
    }
    const days = scoreDays(data);
    if (!days.length) {
      return { ...DEMO_DATA, error: "No scoreable days in the last 30 days." };
    }
    return { ...toView(days), source: "live" };
  } catch (e) {
    return {
      ...DEMO_DATA,
      error: e instanceof Error ? e.message : "Could not reach WHOOP.",
    };
  }
}
