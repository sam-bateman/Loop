"use client";

import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/**
 * The atmosphere behind the page: a slow water plane in Loop black and brand
 * green. It is loaded with `next/dynamic` + `ssr: false` from Landing, so this
 * module (three.js included) never reaches a device that isn't going to draw it.
 *
 * Geometry and camera are ShaderGradient's own `nightyNight` preset, kept
 * verbatim — it is the one dark preset whose plane stays inside the frame at
 * every aspect ratio, so no geometry edge can drift into view as it animates.
 * Only the three colours are ours.
 *
 * lightType is "3d" on purpose — "env" fetches HDR maps from an external
 * basePath, and this page must not depend on a CDN to look right.
 */
export default function GradientBackdrop() {
  return (
    <ShaderGradientCanvas
      style={{ position: "absolute", inset: 0 }}
      pointerEvents="none"
      pixelDensity={1}
      fov={45}
    >
      <ShaderGradient
        control="props"
        type="waterPlane"
        animate="on"
        uTime={8}
        uSpeed={0.16}
        uStrength={1.5}
        uDensity={1.5}
        uFrequency={0}
        uAmplitude={0}
        color1="#40f830"
        color2="#0f4420"
        color3="#0a0a0b"
        positionX={0}
        positionY={0}
        positionZ={0}
        rotationX={50}
        rotationY={0}
        rotationZ={-60}
        cAzimuthAngle={180}
        cPolarAngle={80}
        cDistance={2.8}
        cameraZoom={9.1}
        lightType="3d"
        brightness={1}
        reflection={0.1}
        grain="on"
        grainBlending={0.1}
      />
    </ShaderGradientCanvas>
  );
}
