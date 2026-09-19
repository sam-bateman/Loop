import type { Metadata } from "next";
import { Quicksand, Geist_Mono } from "next/font/google";
import "../loop-ui.css";

const display = Quicksand({ subsets: ["latin"], display: "swap", variable: "--font-display" });
const ui = Quicksand({ subsets: ["latin"], display: "swap", variable: "--font-ui" });
const mono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Loop",
  description: "Minutes of life expectancy, from your WHOOP data.",
  robots: { index: false, follow: false },
};

export default function UiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`loop-ui loop-field ${display.variable} ${ui.variable} ${mono.variable}`}>
      {children}
    </div>
  );
}
