"use client";

/**
 * Barcode scanner — the web stand-in for Liv's VisionKit DataScannerViewController.
 *
 * There is no VisionKit on the web, and the two available options each cover half the
 * field, so this uses both:
 *   - BarcodeDetector, the native Shape Detection API, on Chrome and Android. Free,
 *     hardware-accelerated, no bundle cost.
 *   - @zxing/browser, lazily imported, everywhere else — notably iOS Safari, which is
 *     where most of a WHOOP user base actually is. The ~40 KB only loads on the
 *     browsers that need it.
 *
 * Manual entry stays visible throughout: camera permission can be denied, and a demo
 * should never dead-end on that.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./barcode.module.css";

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "qr_code"];

type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

function nativeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector ?? null;
}

export function BarcodeScanner({
  onFound,
  onClose,
}: {
  onFound: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const foundRef = useRef(false);
  const [status, setStatus] = useState<"starting" | "scanning" | "denied">("starting");
  const [manual, setManual] = useState("");

  // onFound is called at most once, from whichever pipeline wins, then teardown runs.
  const report = useCallback(
    (code: string) => {
      if (foundRef.current) return;
      foundRef.current = true;
      onFound(code);
    },
    [onFound]
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        if (!cancelled) setStatus("denied");
        return;
      }
      if (cancelled || !videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      if (cancelled) return;
      setStatus("scanning");

      const Native = nativeDetector();
      if (Native) {
        const detector = new Native({ formats: FORMATS });
        const tick = async () => {
          if (cancelled || foundRef.current) return;
          try {
            const hits = await detector.detect(video);
            const value = hits[0]?.rawValue?.trim();
            if (value) return report(value);
          } catch {
            // A transient decode failure is normal between frames; keep looping.
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return;
      }

      // iOS Safari and friends: pay for ZXing only here.
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      if (cancelled) return;
      const reader = new BrowserMultiFormatReader();
      zxingControls = await reader.decodeFromVideoElement(video, (result) => {
        const value = result?.getText()?.trim();
        if (value) report(value);
      });
      if (cancelled) zxingControls.stop();
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [report]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Scan a barcode">
      <div className={styles.frame}>
        <video ref={videoRef} playsInline muted className={styles.video} />
        <div className={styles.reticle} aria-hidden="true" />
        <button onClick={onClose} className={styles.close} aria-label="Close scanner">
          ✕
        </button>
      </div>

      <p className={styles.hint}>
        {status === "starting" && "Starting camera…"}
        {status === "scanning" && "Point at the barcode on the packaging."}
        {status === "denied" && "No camera access — type the number below instead."}
      </p>

      <form
        className={styles.manual}
        onSubmit={(e) => {
          e.preventDefault();
          const code = manual.trim();
          if (code) report(code);
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="Or enter the barcode number"
          className={styles.input}
          aria-label="Barcode number"
        />
        <button type="submit" disabled={!manual.trim()} className={styles.go}>
          Look up
        </button>
      </form>
    </div>
  );
}
