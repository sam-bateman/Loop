"use client";

/**
 * Today's log and the saved-meal shelf — Liv's RecentScanCard and SavedMealsScreen,
 * rebuilt in Loop's own vocabulary (flat rows, tabular numerals, gain/loss colour)
 * rather than ported pixel for pixel.
 */

import type { LogEntry, SavedMeal } from "@/lib/food-store";
import styles from "./nutrition.module.css";
import { Thumb, shortTime, signed, tone } from "./food-ui";

function Glyph({ name }: { name: "bookmark" | "bookmarkFill" | "again" | "trash" }) {
  const paths = {
    bookmark: <path d="M6 3h12v18l-6-4.5L6 21V3Z" />,
    bookmarkFill: <path d="M6 3h12v18l-6-4.5L6 21V3Z" fill="currentColor" />,
    again: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
    trash: <><path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13" /></>,
  };
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export function FoodLog({
  entries,
  savedIds,
  busy,
  onOpen,
  onToggleSave,
  onLogAgain,
  onDelete,
}: {
  entries: LogEntry[];
  savedIds: Set<string>;
  busy: boolean;
  onOpen: (entry: LogEntry) => void;
  onToggleSave: (entry: LogEntry) => void;
  onLogAgain: (entry: LogEntry) => void;
  onDelete: (entry: LogEntry) => void;
}) {
  if (!entries.length) {
    return <p className={styles.empty}>Nothing logged yet today.</p>;
  }

  return (
    <div className={styles.list}>
      {entries.map((entry) => {
        const positive = entry.score.minutes >= 0;
        const isSaved = savedIds.has(`${entry.nutrition.food_name}|${entry.nutrition.portion}`);
        return (
          <div key={entry.id} className={styles.row}>
            <button onClick={() => onOpen(entry)} className={styles.rowOpen}>
              <Thumb
                blob={entry.photo}
                positive={positive}
                className={styles.rowThumb}
                fallbackClassName={styles.rowThumbFallback}
              />
              <span className={styles.rowText}>
                <span className={styles.rowName}>{entry.nutrition.food_name}</span>
                <span className={styles.rowMeta}>
                  {entry.nutrition.portion} · {shortTime(entry.at)} · {entry.nutrition.calories} cal
                </span>
              </span>
              <strong className={`num ${styles.rowMinutes} ${tone(entry.score.minutes)}`}>
                {signed(entry.score.minutes)}
              </strong>
            </button>

            <div className={styles.rowActions}>
              <button
                onClick={() => onToggleSave(entry)}
                aria-pressed={isSaved}
                aria-label={isSaved ? "Remove from saved meals" : "Save this meal"}
                className={`${styles.rowButton} ${isSaved ? styles.isSaved : ""}`}
              >
                <Glyph name={isSaved ? "bookmarkFill" : "bookmark"} />
              </button>
              <button
                onClick={() => onLogAgain(entry)}
                disabled={busy}
                aria-label="Log this again"
                className={styles.rowButton}
              >
                <Glyph name="again" />
              </button>
              <button
                onClick={() => onDelete(entry)}
                aria-label="Delete this entry"
                className={styles.rowButton}
              >
                <Glyph name="trash" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SavedMeals({
  meals,
  busy,
  onLog,
  onRemove,
}: {
  meals: SavedMeal[];
  busy: boolean;
  onLog: (meal: SavedMeal) => void;
  onRemove: (meal: SavedMeal) => void;
}) {
  if (!meals.length) return null;

  return (
    <div className={styles.list}>
      {meals.map((meal) => (
        <div key={meal.id} className={styles.row}>
          <Thumb
            blob={meal.photo}
            positive={meal.score.minutes >= 0}
            className={styles.rowThumb}
            fallbackClassName={styles.rowThumbFallback}
          />
          <span className={styles.rowText}>
            <span className={styles.rowName}>{meal.nutrition.food_name}</span>
            <span className={styles.rowMeta}>{meal.nutrition.portion}</span>
          </span>

          {/* Re-scored on log, never replayed: the same food is worth less later in
              the day once allowances are spent (METHODOLOGY.md §4). */}
          <button onClick={() => onLog(meal)} disabled={busy} className={styles.logPill}>
            Log
          </button>
          <button
            onClick={() => onRemove(meal)}
            aria-label={`Remove ${meal.nutrition.food_name} from saved meals`}
            className={styles.rowButton}
          >
            <Glyph name="trash" />
          </button>
        </div>
      ))}
    </div>
  );
}
