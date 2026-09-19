"use client";

import { useEffect, useMemo, useState } from "react";

type RoutineItem = { id: string; name: string; kind: "medication" | "supplement" };
const STORAGE_KEY = "loop:routine:v1";

export default function RoutineLog({ avoid, caution }: { avoid: string[]; caution: string[] }) {
  const [items, setItems] = useState<RoutineItem[]>([]);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<RoutineItem["kind"]>("medication");

  useEffect(() => {
    let stored: unknown = [];
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    } catch { /* A blocked store should never block the genetics screen. */ }
    const timer = window.setTimeout(() => {
      if (Array.isArray(stored)) setItems(stored as RoutineItem[]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const normalizedAvoid = useMemo(() => avoid.map((item) => item.toLowerCase()), [avoid]);
  const normalizedCaution = useMemo(() => caution.map((item) => item.toLowerCase()), [caution]);

  function save(next: RoutineItem[]) {
    setItems(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* local-only convenience */ }
  }

  function add() {
    const clean = name.trim();
    if (!clean) return;
    save([...items, { id: crypto.randomUUID(), name: clean, kind }]);
    setName("");
  }

  return (
    <section className="routine-card">
      <div className="section-copy">
        <span className="card-eyebrow">My routine</span>
        <h2>Log medications or supplements</h2>
        <p>Saved only on this device. Medication names are checked against this report’s known flags.</p>
      </div>
      <div className="routine-form">
        <select value={kind} onChange={(event) => setKind(event.target.value as RoutineItem["kind"])} aria-label="Item type">
          <option value="medication">Medication</option>
          <option value="supplement">Supplement</option>
        </select>
        <input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={kind === "medication" ? "e.g. warfarin" : "e.g. vitamin D"} aria-label="Medication or supplement name" />
        <button type="button" onClick={add} disabled={!name.trim()}>Add</button>
      </div>
      {items.length > 0 && (
        <div className="routine-list">
          {items.map((item) => {
            const query = item.name.toLowerCase();
            const blocked = item.kind === "medication" && normalizedAvoid.some((drug) => query.includes(drug) || drug.includes(query));
            const careful = item.kind === "medication" && normalizedCaution.some((drug) => query.includes(drug) || drug.includes(query));
            return (
              <div className="routine-row" key={item.id}>
                <div>
                  <b>{item.name}</b>
                  <span data-level={blocked ? "high" : careful ? "medium" : undefined}>
                    {blocked ? "Flagged: contact your prescriber" : careful ? "Flagged: dose care may be needed" : item.kind === "supplement" ? "Supplement logged" : "No exact report match"}
                  </span>
                </div>
                <button type="button" onClick={() => save(items.filter((candidate) => candidate.id !== item.id))} aria-label={`Remove ${item.name}`}>×</button>
              </div>
            );
          })}
        </div>
      )}
      <p className="routine-caveat">This is not a complete drug-interaction checker. A missing flag does not mean a medication or combination is safe.</p>
    </section>
  );
}
