"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, N8AO } from "@react-three/postprocessing";
import { QUALITY_CONFIGS, QualityPreset } from "@/engine/environment";
import { ExplorationMode } from "@/data/world";

interface PostEffectsProps {
  quality: QualityPreset;
  mode: ExplorationMode;
  onAutoDowngradeQuality?: (next: QualityPreset) => void;
}

/**
 * Postprocessing stack + rolling frame-time quality governor (`build-threejs-scroll-worlds`).
 * Uses high-threshold selective bloom so bright stone/plaster never turns milky.
 */
export const PostEffects: React.FC<PostEffectsProps> = ({
  quality,
  onAutoDowngradeQuality,
}) => {
  const cfg = QUALITY_CONFIGS[quality];
  const governorRef = useRef({ slowFrames: 0, warmupFrames: 90 });

  useFrame((_, rawDelta) => {
    if (!onAutoDowngradeQuality || quality === "low") return;
    const gov = governorRef.current;
    if (gov.warmupFrames > 0) {
      gov.warmupFrames -= 1;
      return;
    }
    const ms = rawDelta * 1000;
    if (ms > 36 && ms < 250) {
      gov.slowFrames += 1;
      if (gov.slowFrames >= 120) {
        gov.slowFrames = 0;
        const next: QualityPreset =
          quality === "ultra" ? "high" : quality === "high" ? "medium" : "low";
        onAutoDowngradeQuality(next);
      }
    } else {
      gov.slowFrames = Math.max(0, gov.slowFrames - 1);
    }
  });

  if (!cfg.enableBloom && !cfg.enableAO) {
    return null;
  }

  return (
    <EffectComposer multisampling={quality === "ultra" ? 4 : 0}>
      {cfg.enableAO ? (
        <N8AO
          aoRadius={2.4}
          intensity={1.35}
          distanceFalloff={0.85}
          quality={quality === "ultra" ? "medium" : "performance"}
        />
      ) : (
        <></>
      )}
      {cfg.enableBloom ? (
        <Bloom
          luminanceThreshold={1.28}
          luminanceSmoothing={0.35}
          intensity={0.28}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
    </EffectComposer>
  );
};
