"use client";

import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { ExplorationMode, DistrictSpec } from "@/data/world";
import { TitanSpec } from "@/data/titans";
import { CharacterSpec } from "@/data/characters";
import { ScaleSubjectSpec } from "@/data/scaleSubjects";
import { QUALITY_CONFIGS, QualityPreset, TimeOfDay, WeatherMode } from "@/engine/environment";
import { WorldAtmosphere } from "./WorldAtmosphere";
import { ParadisIslandScene } from "./ParadisIslandScene";
import { WallsMonumentScene } from "./WallsMonumentScene";
import { ShiganshinaScene } from "./ShiganshinaScene";
import { DistrictsScene } from "./DistrictsScene";
import { TitansGalleryScene } from "./TitansGalleryScene";
import { ScaleLabScene } from "./ScaleLabScene";
import { CharacterGalleryScene } from "./CharacterGalleryScene";
import { BeyondTheWallsScene } from "./BeyondTheWallsScene";
import { CameraControlMode, CameraRig, CameraTargetPose } from "./CameraRig";
import { PostEffects } from "./PostEffects";

export interface AotWorldCanvasProps {
  mode: ExplorationMode;
  timeOfDay: TimeOfDay;
  weather: WeatherMode;
  quality: QualityPreset;
  onQualityChange: (q: QualityPreset) => void;
  controlMode: CameraControlMode;
  targetPose: CameraTargetPose;
  selectedDistrict: DistrictSpec;
  onSelectDistrict: (d: DistrictSpec) => void;
  selectedTitan: TitanSpec;
  showTitanHumanForm: boolean;
  transformSeqKey: number;
  doomsdayVariant: boolean;
  selectedCharacter: CharacterSpec;
  charAutoTurn: boolean;
  scaleSubjects: ScaleSubjectSpec[];
  scaleSilhouette: boolean;
  scaleXray: boolean;
  scaleGrid: boolean;
  wallXray: boolean;
  showColossalOverWall: boolean;
  hideOverlays: boolean;
  reducedMotion: boolean;
  touchMoveInput: { x: number; y: number };
  onEnterYeagerHouse: () => void;
  onSelectLandmark: (title: string, detail: string) => void;
  onReadyCanvas?: (canvas: HTMLCanvasElement | null) => void;
  onTelemetrySample?: (info: { calls: number; triangles: number; dpr: number }) => void;
}

export const AotWorldCanvas: React.FC<AotWorldCanvasProps> = ({
  mode,
  timeOfDay,
  weather,
  quality,
  onQualityChange,
  controlMode,
  targetPose,
  selectedDistrict,
  onSelectDistrict,
  selectedTitan,
  showTitanHumanForm,
  transformSeqKey,
  doomsdayVariant,
  selectedCharacter,
  charAutoTurn,
  scaleSubjects,
  scaleSilhouette,
  scaleXray,
  scaleGrid,
  wallXray,
  showColossalOverWall,
  hideOverlays,
  reducedMotion,
  touchMoveInput,
  onEnterYeagerHouse,
  onSelectLandmark,
  onReadyCanvas,
  onTelemetrySample,
}) => {
  const [webglError, setWebglError] = useState<string | null>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const qCfg = QUALITY_CONFIGS[quality];

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      glRef.current = gl;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.0;
      gl.shadowMap.enabled = qCfg.shadowMapSize > 0;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      onReadyCanvas?.(gl.domElement);

      const handleLoss = (e: Event) => {
        e.preventDefault();
        setWebglError("WebGL graphics context paused. Restore tab or continue with the archival dossier.");
      };
      gl.domElement.addEventListener("webglcontextlost", handleLoss);
    },
    [qCfg.shadowMapSize, onReadyCanvas]
  );

  useEffect(() => {
    if (!onTelemetrySample) return;
    const id = window.setInterval(() => {
      const gl = glRef.current;
      if (!gl) return;
      onTelemetrySample({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        dpr: gl.getPixelRatio(),
      });
    }, 800);
    return () => window.clearInterval(id);
  }, [onTelemetrySample]);

  if (webglError) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#121311] text-[#EAE3D2] p-8 z-0">
        <div className="max-w-lg border border-[#B8965A]/40 bg-[#1B1D1A] p-6 space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#B8965A]">
            Survey Archive · Fallback View
          </p>
          <h2 className="font-serif text-2xl">Real-time 3D Viewport Unavailable</h2>
          <p className="text-sm text-[#A49D8E] leading-relaxed">{webglError}</p>
          <button
            type="button"
            onClick={() => setWebglError(null)}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider border border-[#B8965A] text-[#EAE3D2] hover:bg-[#B8965A] hover:text-[#121311] transition-colors"
          >
            Retry 3D Viewport
          </button>
        </div>
      </div>
    );
  }

  const distanceScale = mode === "paradis" ? 2.4 : mode === "scale" ? 1.6 : 1.0;

  return (
    <div
      className="fixed inset-0 w-full h-full bg-[#121311]"
      style={{ touchAction: controlMode === "orbit" || controlMode === "tour" ? "none" : "pan-y" }}
    >
      <Canvas
        shadows
        dpr={[1, qCfg.maxDpr]}
        camera={{
          position: targetPose.position,
          fov: targetPose.fov,
          near: mode === "paradis" ? 1.0 : 0.15,
          far: mode === "paradis" ? 3600 : 2800,
        }}
        gl={{
          antialias: quality !== "low",
          powerPreference: "high-performance",
          preserveDrawingBuffer: true, // Enables clean Photography Mode PNG export & QA captures
        }}
        onCreated={handleCreated}
      >
        <WorldAtmosphere
          timeOfDay={timeOfDay}
          weather={weather}
          quality={quality}
          reducedMotion={reducedMotion}
          cameraDistanceScale={distanceScale}
        />

        <Suspense fallback={null}>
          {mode === "paradis" && (
            <ParadisIslandScene
              timeOfDay={timeOfDay}
              selectedDistrictId={selectedDistrict.id}
              onSelectDistrict={onSelectDistrict}
              reducedMotion={reducedMotion}
              hideOverlays={hideOverlays}
            />
          )}

          {mode === "walls" && (
            <WallsMonumentScene
              xrayActive={wallXray}
              showColossalPeering={showColossalOverWall}
              hideOverlays={hideOverlays}
              reducedMotion={reducedMotion}
            />
          )}

          {mode === "shiganshina" && (
            <ShiganshinaScene
              timeOfDay={timeOfDay}
              quality={quality}
              reducedMotion={reducedMotion}
              hideOverlays={hideOverlays}
              onEnterYeagerHouse={onEnterYeagerHouse}
              onSelectLandmark={onSelectLandmark}
            />
          )}

          {mode === "districts" && (
            <DistrictsScene district={selectedDistrict} hideOverlays={hideOverlays} />
          )}

          {mode === "titans" && (
            <TitansGalleryScene
              titan={selectedTitan}
              showHumanForm={showTitanHumanForm}
              transformSeqKey={transformSeqKey}
              hideOverlays={hideOverlays}
              reducedMotion={reducedMotion}
              doomsdayVariant={doomsdayVariant}
            />
          )}

          {mode === "scale" && (
            <ScaleLabScene
              subjects={scaleSubjects}
              silhouetteMode={scaleSilhouette}
              xrayOverlay={scaleXray}
              showMetricGrid={scaleGrid}
              hideOverlays={hideOverlays}
              reducedMotion={reducedMotion}
            />
          )}

          {mode === "characters" && (
            <CharacterGalleryScene
              character={selectedCharacter}
              autoTurn={charAutoTurn}
              hideOverlays={hideOverlays}
              reducedMotion={reducedMotion}
            />
          )}

          {mode === "beyond" && (
            <BeyondTheWallsScene
              timeOfDay={timeOfDay}
              quality={quality}
              reducedMotion={reducedMotion}
              hideOverlays={hideOverlays}
            />
          )}
        </Suspense>

        <CameraRig
          mode={mode}
          controlMode={controlMode}
          targetPose={targetPose}
          reducedMotion={reducedMotion}
          touchMoveInput={touchMoveInput}
        />

        <PostEffects
          quality={quality}
          mode={mode}
          onAutoDowngradeQuality={onQualityChange}
        />
      </Canvas>
    </div>
  );
};
