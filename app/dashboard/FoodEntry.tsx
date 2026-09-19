"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Nutrition, FoodScore } from "@/lib/food-scoring";

type Logged = { nutrition: Nutrition; score: FoodScore; at: string };

// The Web Speech API is still vendor-prefixed in Safari and untyped in lib.dom.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionLike)
    | undefined;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = false;
  r.interimResults = true;
  r.lang = "en-US";
  return r;
}

function signed(n: number) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;
}
function cls(n: number) {
  return n > 0 ? "text-gain" : n < 0 ? "text-loss" : "text-faint";
}

export function FoodEntry({ onLogged }: { onLogged?: (l: Logged) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Logged | null>(null);
  const [listening, setListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSpeechAvailable(getRecognition() !== null);
    return () => recRef.current?.stop();
  }, []);

  const submit = useCallback(
    async (payload: { description?: string; image?: string }) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not analyze that");
        setResult(data);
        setText("");
        onLogged?.(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setBusy(false);
      }
    },
    [onLogged]
  );

  function toggleSpeech() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results as ArrayLike<ArrayLike<{ transcript: string }>>)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    submit({ image: btoa(binary), description: text.trim() || undefined });
    e.target.value = "";
  }

  return (
    <section className="mb-9">
      <h2 className="text-[12px] uppercase tracking-[0.15em] text-faint mb-3">
        What did you eat?
      </h2>

      <div className="rounded-xl border border-line bg-surface p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={listening ? "Listening…" : "Grilled salmon, spinach, half an avocado"}
          rows={2}
          className="w-full bg-transparent text-[15px] placeholder:text-faint outline-none resize-none"
        />

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Add a photo"
            className="w-10 h-10 shrink-0 rounded-full border border-line flex items-center justify-center text-muted active:scale-95 transition-transform disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>

          {speechAvailable && (
            <button
              onClick={toggleSpeech}
              disabled={busy}
              aria-label={listening ? "Stop dictating" : "Dictate"}
              className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40 ${
                listening ? "border-accent text-accent" : "border-line text-muted"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}

          <button
            onClick={() => submit({ description: text.trim() })}
            disabled={busy || !text.trim()}
            className="flex-1 h-10 rounded-full bg-text text-bg font-semibold text-[14px] active:scale-[0.98] transition-transform disabled:opacity-30"
          >
            {busy ? "Analyzing…" : "Log it"}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhoto}
          className="hidden"
        />
      </div>

      {listening && (
        <p className="text-[12px] text-accent mt-2">Listening — tap the mic again to stop.</p>
      )}
      {error && <p className="text-[12.5px] text-loss mt-2">{error}</p>}

      {result && (
        <div className="mt-3 rounded-xl border border-line bg-surface px-4 py-4">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-[15px] font-medium">{result.nutrition.food_name}</span>
            <span className={`num text-[22px] font-semibold ${cls(result.score.minutes)}`}>
              {signed(result.score.minutes)}
              <span className="text-[12px] text-muted font-normal ml-1">min</span>
            </span>
          </div>
          <p className="text-[12.5px] text-faint mb-3">{result.nutrition.portion}</p>

          <div className="space-y-1.5">
            {result.score.factors.map((f) => (
              <div key={f.label} className="flex justify-between gap-3 text-[13px]">
                <span className={f.neutral ? "text-faint" : "text-muted"}>{f.label}</span>
                {!f.neutral && (
                  <span className={`num shrink-0 ${cls(f.minutes)}`}>{signed(f.minutes)}</span>
                )}
              </div>
            ))}
          </div>

          {result.score.notes.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {result.score.notes.map((n) => (
                <li key={n} className="text-[12px] text-faint leading-snug pl-3 border-l border-line">
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
