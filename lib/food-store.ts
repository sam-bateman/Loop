/**
 * Client-side food store — ported from Liv's SwiftData layer.
 *
 * Liv persists scans and bookmarks with SwiftData (ScanResult + SavedItem) and keeps
 * photos in `@Attribute(.externalStorage)`. The web equivalent is IndexedDB: it holds
 * Blobs natively, so meal photos stay out of the 4 KB session cookie that forced
 * api/meals' old MEAL_LIMIT.
 *
 * This is a hackathon demo, so the store is deliberately device-local — no sync, no
 * server rows. Clearing site data clears the log.
 *
 * Scoring is NOT done here. `lib/food-scoring.ts` stays server-side (it is the
 * methodology, and it pulls in the WHOOP age curve), so the client sends a nutrition
 * payload plus the day's prior intake to /api/meals and stores what comes back.
 */
import type { Nutrition, FoodScore, DailyIntake } from "./food-scoring";

const DB_NAME = "loop-food";
const DB_VERSION = 1;
const LOG = "log";
const SAVED = "saved";

export type LogSource = "photo" | "text" | "barcode" | "saved" | "suggested";

export type LogEntry = {
  id: string;
  /** Local calendar day, not UTC — "today" has to mean the user's today. */
  day: string;
  at: string;
  nutrition: Nutrition;
  score: FoodScore;
  photo?: Blob;
  source: LogSource;
};

export type SavedMeal = {
  /** `name|portion`, matching Liv's RecentScanCard.saveId so re-saving is idempotent. */
  id: string;
  savedAt: string;
  nutrition: Nutrition;
  score: FoodScore;
  photo?: Blob;
};

/** Liv keys a bookmark on name + portion, so the same food at a different size is distinct. */
export function savedIdFor(n: Nutrition): string {
  return `${n.food_name}|${n.portion}`;
}

export function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(LOG)) {
          const log = db.createObjectStore(LOG, { keyPath: "id" });
          log.createIndex("day", "day");
          log.createIndex("at", "at");
        }
        if (!db.objectStoreNames.contains(SAVED)) {
          db.createObjectStore(SAVED, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function run<T>(
  store: string,
  mode: IDBTransactionMode,
  body: (s: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = body(tx.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// --- Log ---

export async function allLogEntries(): Promise<LogEntry[]> {
  const rows = await run<LogEntry[]>(LOG, "readonly", (s) => s.getAll());
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

export async function entriesForDay(day = localDay()): Promise<LogEntry[]> {
  const all = await allLogEntries();
  return all.filter((e) => e.day === day);
}

export async function putLogEntry(entry: LogEntry): Promise<void> {
  await run(LOG, "readwrite", (s) => s.put(entry));
}

export async function deleteLogEntry(id: string): Promise<void> {
  await run(LOG, "readwrite", (s) => s.delete(id));
}

// --- Saved ---

export async function allSavedMeals(): Promise<SavedMeal[]> {
  const rows = await run<SavedMeal[]>(SAVED, "readonly", (s) => s.getAll());
  return rows.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export async function putSavedMeal(meal: SavedMeal): Promise<void> {
  await run(SAVED, "readwrite", (s) => s.put(meal));
}

export async function deleteSavedMeal(id: string): Promise<void> {
  await run(SAVED, "readwrite", (s) => s.delete(id));
}

// --- Running intake ---

const EMPTY: DailyIntake = {
  fruitVegServings: 0,
  oilyFishServings: 0,
  saturatedFatG: 0,
  sodiumMg: 0,
  addedSugarG: 0,
  fibreG: 0,
};

/**
 * Rebuild the day's running intake so tapers and allowances apply correctly.
 *
 * Mirrors `addToIntake` in lib/food-scoring.ts rather than importing it: that module
 * reaches into the WHOOP scoring model, and none of it belongs in the client bundle.
 * Keep the two in step — METHODOLOGY.md §4 is the shared source of truth.
 */
export function intakeFor(entries: LogEntry[]): DailyIntake {
  return entries.reduce<DailyIntake>(
    (acc, { nutrition: n }) => ({
      fruitVegServings: acc.fruitVegServings + Math.min(n.fruit_veg_servings, 5),
      oilyFishServings: acc.oilyFishServings + (n.is_oily_fish ? 1 : 0),
      saturatedFatG: acc.saturatedFatG + n.saturated_fat_g,
      sodiumMg: acc.sodiumMg + n.sodium_mg,
      addedSugarG: acc.addedSugarG + n.added_sugar_g,
      fibreG: acc.fibreG + n.fibre_g,
    }),
    EMPTY
  );
}
