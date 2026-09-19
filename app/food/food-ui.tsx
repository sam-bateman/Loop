"use client";

/** Shared presentation helpers for the nutrition island. */

import { useEffect, useState } from "react";
import type { FoodScore } from "@/lib/food-scoring";

export function signed(n: number) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;
}

export function tone(n: number) {
  return n > 0 ? "text-gain" : n < 0 ? "text-loss" : "text-faint";
}

export function shortTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Photos live in IndexedDB as Blobs, so each render needs a fresh object URL and has to
 * revoke it — otherwise a long session leaks every thumbnail it has ever shown.
 */
export function useObjectUrl(blob?: Blob): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  return url;
}

/**
 * One line, not Liv's full factor table. The dominant factor is what a user acts on;
 * the rest is a count so the number still feels accountable.
 */
export function verdictLine(score: FoodScore): string | null {
  const ranked = score.factors
    .filter((f) => !f.neutral && f.minutes !== 0)
    .sort((a, b) => Math.abs(b.minutes) - Math.abs(a.minutes));
  const lead = ranked[0];
  if (!lead) return "Nothing here moves the needle either way.";
  const rest = ranked.length - 1;
  return `${lead.label} ${signed(lead.minutes)} min${
    rest > 0 ? ` · ${rest} other factor${rest > 1 ? "s" : ""}` : ""
  }`;
}

export function Thumb({
  blob,
  positive,
  className,
  fallbackClassName,
}: {
  blob?: Blob;
  positive: boolean;
  className: string;
  fallbackClassName: string;
}) {
  const url = useObjectUrl(blob);
  if (url) return <img src={url} alt="" className={className} />;
  return (
    <div className={fallbackClassName} aria-hidden="true">
      {positive ? "🌿" : "🍔"}
    </div>
  );
}
