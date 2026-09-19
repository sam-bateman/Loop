"use client";

/**
 * The composer — type it, say it, photograph it, or scan its barcode.
 *
 * This collects input only. Scoring, persistence and the verdict card belong to
 * NutritionSection, so one submit path serves a typed meal, a photo, a barcode hit,
 * a saved meal and an "ate this again".
 */

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./food-entry.module.css";

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

async function toBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export type ComposerPayload = { description?: string; image?: string; photo?: Blob };

export function FoodEntry({
  busy,
  onSubmit,
  onScanBarcode,
}: {
  busy: boolean;
  onSubmit: (payload: ComposerPayload) => void;
  onScanBarcode: () => void;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  // Deferred past hydration: the server renders no mic, so checking during render
  // would mismatch.
  useEffect(() => {
    const check = window.setTimeout(() => setSpeechAvailable(getRecognition() !== null), 0);
    return () => {
      window.clearTimeout(check);
      recRef.current?.stop();
    };
  }, []);

  const send = useCallback(
    (payload: ComposerPayload) => {
      onSubmit(payload);
      setText("");
    },
    [onSubmit]
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
    e.target.value = "";
    if (!file) return;
    // Both copies are kept: base64 goes to Gemini, the Blob is what IndexedDB stores
    // for the thumbnail.
    send({ image: await toBase64(file), description: text.trim() || undefined, photo: file });
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.composer}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={listening ? "Listening…" : "Grilled salmon, spinach, half an avocado"}
          rows={2}
          className={styles.textarea}
        />

        <div className={styles.actions}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Add a photo"
            className={styles.iconButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
          </button>

          <button
            onClick={onScanBarcode}
            disabled={busy}
            aria-label="Scan a barcode"
            className={styles.iconButton}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 6V4h3M18 4h3v2M21 18v2h-3M6 20H3v-2" />
              <path d="M7 8v8M10.5 8v8M14 8v8M17 8v8" />
            </svg>
          </button>

          {speechAvailable && (
            <button
              onClick={toggleSpeech}
              disabled={busy}
              aria-label={listening ? "Stop dictating" : "Dictate"}
              className={`${styles.iconButton} ${listening ? styles.listening : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
          )}

          <button
            onClick={() => send({ description: text.trim() })}
            disabled={busy || !text.trim()}
            className={styles.submit}
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
          className={styles.hidden}
        />
      </div>

      {listening && <p className={styles.listeningText}>Listening — tap the mic again to stop.</p>}
    </div>
  );
}
