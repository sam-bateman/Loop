"use client";

/**
 * The nutrition island — owns every piece of food state on the dashboard.
 *
 * The log and the saved-meal shelf live in IndexedDB on the device (lib/food-store.ts),
 * which is why this is a client component inside an otherwise server-rendered page.
 * The server keeps what only the server should have: the Gemini key and the scoring
 * model.
 *
 * Everything funnels through `logResolved`, so a typed meal, a photo, a barcode hit, a
 * saved meal and an "ate this again" all take the same path and are all scored against
 * the same running intake.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DailyIntake, Nutrition, FoodScore } from "@/lib/food-scoring";
import {
  allSavedMeals,
  deleteLogEntry,
  deleteSavedMeal,
  entriesForDay,
  intakeFor,
  localDay,
  putLogEntry,
  putSavedMeal,
  savedIdFor,
  type LogEntry,
  type LogSource,
  type SavedMeal,
} from "@/lib/food-store";
import type { DailyTargets } from "@/lib/nutrition-targets";
import { DayNutrition, FOOD_LOGGED_EVENT } from "./DayNutrition";
import { FoodEntry } from "./FoodEntry";
import { FoodLog, SavedMeals } from "./FoodLists";
import { VerdictCard } from "./VerdictCard";
import { BarcodeScanner } from "./BarcodeScanner";
import { PowerMeals } from "./PowerMeals";
import { signed } from "./food-ui";
import styles from "./nutrition.module.css";
import shell from "./dashboard.module.css";

type ScoreRequest = {
  nutrition?: Nutrition;
  description?: string;
  image?: string;
  base?: Nutrition;
  priorIntake: DailyIntake;
};

export function NutritionSection({ targets }: { targets: DailyTargets }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [saved, setSaved] = useState<SavedMeal[]>([]);
  const [active, setActive] = useState<LogEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>(0);

  const refresh = useCallback(async () => {
    const [log, bookmarks] = await Promise.all([entriesForDay(), allSavedMeals()]);
    setEntries(log);
    setSaved(bookmarks);
  }, []);

  /** Re-read, then tell DayNutrition's bars to do the same. */
  const commit = useCallback(async () => {
    await refresh();
    window.dispatchEvent(new Event(FOOD_LOGGED_EVENT));
  }, [refresh]);

  useEffect(() => {
    refresh().catch(() => setError("Couldn't open the on-device food log."));
    window.addEventListener(FOOD_LOGGED_EVENT, refresh);
    return () => {
      window.removeEventListener(FOOD_LOGGED_EVENT, refresh);
      window.clearTimeout(toastTimer.current);
    };
  }, [refresh]);

  const flash = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const savedIds = useMemo(() => new Set(saved.map((m) => m.id)), [saved]);
  const dayMinutes = useMemo(
    () => entries.reduce((sum, e) => sum + e.score.minutes, 0),
    [entries]
  );

  /**
   * Score against the day so far. `excludeId` matters for edits: an entry must not
   * count itself as prior intake, or correcting it spends its own allowance twice.
   */
  const scoreIt = useCallback(
    async (req: Omit<ScoreRequest, "priorIntake">, excludeId?: string) => {
      const prior = intakeFor(entries.filter((e) => e.id !== excludeId));
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...req, priorIntake: prior }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not analyze that");
      return data as { nutrition: Nutrition; score: FoodScore };
    },
    [entries]
  );

  const logResolved = useCallback(
    async (req: Omit<ScoreRequest, "priorIntake">, photo: Blob | undefined, source: LogSource) => {
      setBusy(true);
      setError(null);
      try {
        const { nutrition, score } = await scoreIt(req);
        const entry: LogEntry = {
          id: crypto.randomUUID(),
          day: localDay(),
          at: new Date().toISOString(),
          nutrition,
          score,
          photo,
          source,
        };
        await putLogEntry(entry);
        await commit();
        setActive(entry);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [scoreIt, commit]
  );

  const editEntry = useCallback(
    async (entry: LogEntry, correction: string) => {
      setBusy(true);
      setError(null);
      try {
        // `base` tells /api/analyze to treat the correction as authoritative and
        // re-estimate the whole food, rather than patching a single field.
        const { nutrition, score } = await scoreIt(
          { description: correction, base: entry.nutrition },
          entry.id
        );
        const updated: LogEntry = { ...entry, nutrition, score };
        await putLogEntry(updated);
        await commit();
        setActive(updated);
        flash("Updated");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't re-estimate that");
      } finally {
        setBusy(false);
      }
    },
    [scoreIt, commit, flash]
  );

  const toggleSave = useCallback(
    async (entry: LogEntry) => {
      const id = savedIdFor(entry.nutrition);
      if (savedIds.has(id)) {
        await deleteSavedMeal(id);
        flash("Removed from saved");
      } else {
        await putSavedMeal({
          id,
          savedAt: new Date().toISOString(),
          nutrition: entry.nutrition,
          score: entry.score,
          photo: entry.photo,
        });
        flash("Saved");
      }
      await refresh();
    },
    [savedIds, refresh, flash]
  );

  const lookupBarcode = useCallback(
    async (code: string) => {
      setScanning(false);
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/barcode?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Product not found");
        setBusy(false);
        await logResolved({ nutrition: data as Nutrition }, undefined, "barcode");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Barcode lookup failed");
        setBusy(false);
      }
    },
    [logResolved]
  );

  return (
    <section className={shell.section} id="nutrition">
      <div className={shell.sectionHeader}>
        <div>
          <span>Nutrition</span>
          <h2>Power meals & food log</h2>
        </div>
        {dayMinutes !== 0 && (
          <b className={dayMinutes > 0 ? shell.positive : shell.negative}>
            {signed(dayMinutes)} min
          </b>
        )}
      </div>

      <div className={styles.section}>
        <PowerMeals
          busy={busy}
          onLog={(meal) =>
            logResolved({ nutrition: meal.nutrition }, undefined, "suggested")
          }
        />

        <FoodEntry
          busy={busy}
          onSubmit={(p) =>
            logResolved(
              { description: p.description, image: p.image },
              p.photo,
              p.image ? "photo" : "text"
            )
          }
          onScanBarcode={() => setScanning(true)}
        />

        {error && <p className={styles.error}>{error}</p>}

        {active && (
          <VerdictCard
            entry={active}
            saved={savedIds.has(savedIdFor(active.nutrition))}
            busy={busy}
            onEdit={(correction) => editEntry(active, correction)}
            onToggleSave={() => toggleSave(active)}
          />
        )}

        {saved.length > 0 && (
          <>
            <div className={styles.listHead}>
              <span>Saved meals</span>
            </div>
            <SavedMeals
              meals={saved}
              busy={busy}
              onLog={(meal) =>
                logResolved({ nutrition: meal.nutrition }, meal.photo, "saved")
              }
              onRemove={async (meal) => {
                await deleteSavedMeal(meal.id);
                await refresh();
                flash("Removed from saved");
              }}
            />
          </>
        )}

        <div className={styles.listHead}>
          <span>Today</span>
        </div>
        <FoodLog
          entries={entries}
          savedIds={savedIds}
          busy={busy}
          onOpen={setActive}
          onToggleSave={toggleSave}
          onLogAgain={(entry) =>
            logResolved({ nutrition: entry.nutrition }, entry.photo, entry.source)
          }
          onDelete={async (entry) => {
            await deleteLogEntry(entry.id);
            if (active?.id === entry.id) setActive(null);
            await commit();
          }}
        />

        <details className={styles.details}>
          <summary>See calories, macros and daily limits</summary>
          <DayNutrition targets={targets} entries={entries} />
        </details>
      </div>

      {scanning && (
        <BarcodeScanner onFound={lookupBarcode} onClose={() => setScanning(false)} />
      )}
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </section>
  );
}
