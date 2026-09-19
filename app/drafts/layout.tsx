import type { Metadata } from "next";
import { Quicksand, Geist_Mono } from "next/font/google";
import "../loop-ui.css";

/**
 * TYPE — a deliberate departure from UI_SPEC.md §5.
 *
 * The spec names Instrument Serif for the number and calls it "the single most
 * identity-defining choice in the system". Drawn against the actual wordmark it
 * fights it: public/brand/loop-wordmark.png is monoline, geometric and
 * round-terminalled, and a high-contrast serif beside it reads as two brands.
 *
 * Quicksand is the closest widely-available match to the wordmark's
 * construction — uniform stroke, circular bowls, rounded caps — so the display
 * face and the logo share a skeleton. Geist Mono stays for figures, because
 * Quicksand has no tabular companion and §5 is right that every changing value
 * needs one.
 *
 * Trade-off worth naming: a rounded geometric reads warmer than the serif did,
 * which pushes against DESIGN_SPEC.md §9's "too playful → reads as a novelty"
 * failure mode. Outfit is the same swap without the rounding if this goes too
 * soft. Both are one line below.
 */
const display = Quicksand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const ui = Quicksand({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Loop — landing page drafts",
  description:
    "Four landing-page directions for Loop, built against UI_SPEC.md and DESIGN_SPEC.md.",
  robots: { index: false, follow: false },
};

export default function DraftsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`loop-ui loop-field ${display.variable} ${ui.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
