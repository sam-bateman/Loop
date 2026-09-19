import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loop — what your WHOOP data is doing to your lifespan",
  description:
    "Loop converts WHOOP sleep, recovery and strain into minutes of life expectancy, using published mortality meta-analyses. Every number is cited.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
