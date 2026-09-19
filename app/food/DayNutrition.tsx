"use client";

/**
 * Today's intake — the plain calorie-tracker view of the same food log that feeds the
 * microlife score.
 *
 * Loop's own number answers "was that meal worth it?". This answers the question every
 * food log also has to answer: how much have I eaten, and how much is left. The targets
 * and ceilings come from lib/nutrition-targets.ts and are documented in METHODOLOGY.md §8.
 *
 * Targets arrive as a prop because only the server has the WHOOP burn behind them.
 * Totals come from today's log: NutritionSection passes its entries straight in, and
 * anything that renders this on its own falls back to reading lib/food-store.ts —
 * refreshing on `FOOD_LOGGED_EVENT` and on window focus.
 *
 * It owns no composer and no submit path on purpose.
 */

import { useCallback, useEffect, useState } from "react";
import { entriesForDay, type LogEntry } from "@/lib/food-store";
import {
  macroProgress,
  nutrientProgress,
  totalsFor,
  type DailyTargets,
  type NutrientProgress,
} from "@/lib/nutrition-targets";
import styles from "./day-nutrition.module.css";

/** Fire this after writing to the food log to refresh the bars: `FOOD_LOGGED_EVENT`. */
export const FOOD_LOGGED_EVENT = "loop:food-logged";

const ENERGY_NOTE: Record<DailyTargets["energySource"], string> = {
  whoop: "Calorie target set from your average WHOOP daily burn",
  estimated: "Calorie target estimated from your height, weight, age and sex",
  default: "Calorie target is the 2,000 kcal default — finish onboarding for your own",
};

function round(value: number, unit: NutrientProgress["unit"]) {
  if (unit === "g") return value >= 10 ? Math.round(value).toString() : value.toFixed(1);
  return Math.round(value).toLocaleString();
}

function Bar({ item }: { item: NutrientProgress }) {
  // Past a ceiling is a problem; past a target is not. Same bar, opposite meaning.
  const state = item.over ? (item.kind === "limit" ? styles.over : styles.met) : "";
  return (
    <div className={styles.row}>
      <div className={styles.rowHead}>
        <span>{item.label}</span>
        <b className="num">
          {round(item.value, item.unit)}
          <i>
            / {round(item.target, item.unit)} {item.unit}
          </i>
        </b>
      </div>
      <div className={`${styles.track} ${state}`}>
        <span style={{ width: `${item.pct}%` }} />
      </div>
    </div>
  );
}

export function DayNutrition({
  targets,
  entries,
}: {
  targets: DailyTargets;
  /** Today's log. Omit it and this reads the store itself. */
  entries?: LogEntry[];
}) {
  const [own, setOwn] = useState<LogEntry[]>([]);
  const standalone = entries === undefined;

  const reload = useCallback(() => {
    entriesForDay()
      .then(setOwn)
      .catch(() => {
        /* Private mode or a blocked store — the rest of the page is unaffected. */
      });
  }, []);

  useEffect(() => {
    if (!standalone) return;
    reload();
    window.addEventListener(FOOD_LOGGED_EVENT, reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(FOOD_LOGGED_EVENT, reload);
      window.removeEventListener("focus", reload);
    };
  }, [standalone, reload]);

  const totals = totalsFor(entries ?? own);
  const [calories, ...macros] = macroProgress(totals, targets);
  const nutrients = nutrientProgress(totals, targets);
  const left = Math.round(calories.remaining);

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.energy}>
          <div>
            <span>Eaten today</span>
            <strong className="num">
              {Math.round(totals.calories).toLocaleString()}
              <small>kcal</small>
            </strong>
          </div>
          <div className={styles.left}>
            <span>{left >= 0 ? "Remaining" : "Over"}</span>
            <b className={`num ${left < 0 ? styles.loss : ""}`}>
              {Math.abs(left).toLocaleString()}
            </b>
          </div>
        </div>

        <div className={`${styles.track} ${styles.energyTrack} ${calories.over ? styles.over : ""}`}>
          <span style={{ width: `${calories.pct}%` }} />
        </div>
        <p className={styles.energyNote}>{ENERGY_NOTE[targets.energySource]}</p>

        <div className={styles.macros}>
          {macros.map((m) => (
            <div key={m.key}>
              <span>{m.label}</span>
              <b className="num">
                {round(m.value, m.unit)}
                <i>/{round(m.target, m.unit)}g</i>
              </b>
              <div className={`${styles.track} ${m.over ? styles.met : ""}`}>
                <span style={{ width: `${m.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.cardHead}>Fibre to reach · the rest to stay under</p>
        {nutrients.map((item) => (
          <Bar key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}
