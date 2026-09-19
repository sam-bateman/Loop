"use client";

/**
 * The verdict card — what you just logged, and the two things you might do about it.
 *
 * Deliberately not a port of Liv's ResultSheet. Loop shows the number, the food, and
 * the single factor driving it; the full factor breakdown already has a home in the
 * dashboard's "What moved your number" section and on /methodology.
 *
 * Edit re-runs the analysis with the original estimate as a baseline, which is what
 * /api/analyze's `base` parameter is for — a correction re-estimates the whole food
 * rather than patching one field.
 */

import { useState } from "react";
import type { LogEntry } from "@/lib/food-store";
import styles from "./nutrition.module.css";
import { Thumb, shortTime, signed, tone, verdictLine } from "./food-ui";

export function VerdictCard({
  entry,
  saved,
  busy,
  onEdit,
  onToggleSave,
}: {
  entry: LogEntry;
  saved: boolean;
  busy: boolean;
  onEdit: (correction: string) => void;
  onToggleSave: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [correction, setCorrection] = useState("");

  const { nutrition, score } = entry;
  const positive = score.minutes >= 0;

  function submitEdit() {
    const text = correction.trim();
    if (!text) return;
    onEdit(text);
    setCorrection("");
    setEditing(false);
  }

  return (
    <div className={styles.verdict}>
      <div className={styles.verdictBody}>
        <Thumb
          blob={entry.photo}
          positive={positive}
          className={styles.thumb}
          fallbackClassName={styles.thumbFallback}
        />
        <div className={styles.verdictMain}>
          <div className={styles.verdictTop}>
            <span className={styles.verdictName}>{nutrition.food_name}</span>
            <strong className={`num ${styles.verdictMinutes} ${tone(score.minutes)}`}>
              {signed(score.minutes)}
              <small>min</small>
            </strong>
          </div>
          <p className={styles.verdictMeta}>
            {nutrition.portion} · {nutrition.calories} cal · {shortTime(entry.at)}
            {nutrition.data_source ? ` · ${nutrition.data_source}` : ""}
          </p>
          <p className={styles.verdictWhy}>{verdictLine(score)}</p>
        </div>
      </div>

      {editing ? (
        <div className={styles.edit}>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            rows={2}
            autoFocus
            placeholder="What did we get wrong? e.g. it was half that size, no dressing"
            className={styles.editField}
          />
          <div className={styles.editRow}>
            <button
              onClick={() => {
                setEditing(false);
                setCorrection("");
              }}
              className={styles.ghost}
            >
              Cancel
            </button>
            <button onClick={submitEdit} disabled={busy || !correction.trim()} className={styles.primary}>
              {busy ? "Re-checking…" : "Re-estimate"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.verdictActions}>
          <button onClick={() => setEditing(true)} disabled={busy} className={styles.ghost}>
            Edit
          </button>
          <button
            onClick={onToggleSave}
            disabled={busy}
            aria-pressed={saved}
            className={`${styles.ghost} ${saved ? styles.saved : ""}`}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
