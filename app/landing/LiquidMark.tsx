"use client";

import { LiquidMetal } from "@paper-design/shaders-react";

/**
 * The lemniscate from the wordmark, run through Paper's liquid-metal shader.
 *
 * The mark is the two `o`s of "loop" fused into a closed loop with no endpoint
 * (see public/brand/README.md); liquid metal keeps it moving without ever
 * arriving anywhere, which is the same idea in motion.
 *
 * colorBack is fully transparent (#00000000) so the shader composites over the
 * gradient rather than punching a rectangle through it. The shader reads the
 * PNG's alpha as its shape mask, which is why it takes loop-mark.png — the
 * transparent-background asset — and not one of the flattened icon files.
 */
export default function LiquidMark({ className }: { className?: string }) {
  return (
    <LiquidMetal
      className={className}
      image="/brand/loop-mark.png"
      colorBack="#00000000"
      colorTint="#40f830"
      speed={0.6}
      repetition={3.2}
      softness={0.35}
      shiftRed={0.2}
      shiftBlue={0.25}
      distortion={0.12}
      contour={0.85}
      angle={40}
      scale={0.82}
      fit="contain"
      maxPixelCount={1_100_000}
    />
  );
}
