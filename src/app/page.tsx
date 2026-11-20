"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { DISTRICTS, DistrictSpec, ExplorationMode } from "@/data/world";
import { TITANS, TitanSpec } from "@/data/titans";
import { CHARACTERS, CharacterSpec } from "@/data/characters";
import { SCALE_SUBJECTS } from "@/data/scaleSubjects";
import { GUIDED_TOURS, GuidedTour } from "@/data/tours";
import { QualityPreset, TimeOfDay, WeatherMode } from "@/engine/environment";
import { AotWorldCanvas } from "@/components/scene/AotWorldCanvas";
import { CameraControlMode, CameraTargetPose } from "@/components/scene/CameraRig";
import { MuseumHud } from "@/components/ui/MuseumHud";

const DEFAULT_POSES: Record<ExplorationMode, Omit<CameraTargetPose, "id">> = {
  paradis: { position: [0, 92, 265], target: [0, 8, 12], fov: 42 },
  walls: { position: [24, 42, 96], target: [-6, 38, 16], fov: 46 },
  shiganshina: { position: [-14, 15, -56], target: [0, 9, 8], fov: 46 },
  districts: { position: [24, 18, 56], target: [0, 12, -14], fov: 45 },
  titans: { position: [12, 7.5, 32], target: [0, 7.5, 0], fov: 42 },
  scale: { position: [20, 24, 106], target: [0, 24, -4], fov: 46 },
  characters: { position: [0.55, 1.05, 3.3], target: [0, 0.92, 0], fov: 36 },
  beyond: { position: [0, 14, 42], target: [2, 24, -20], fov: 48 },
};

export default function BeyondTheWallsPage() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mode, setMode] = useState<ExplorationMode>("paradis");
  const [controlMode, setControlMode] = useState<CameraControlMode>("orbit");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
  const [weather, setWeather] = useState<WeatherMode>("clear");
  const [quality, setQuality] = useState<QualityPreset>("high");

  const [selectedDistrict, setSelectedDistrict] = useState<DistrictSpec>(DISTRICTS[0]);
  const [selectedTitan, setSelectedTitan] = useState<TitanSpec>(TITANS[1]); // Attack Titan default
  const [showTitanHumanForm, setShowTitanHumanForm] = useState(true);
  const [transformSeqKey, setTransformSeqKey] = useState(0);
  const [doomsdayVariant, setDoomsdayVariant] = useState(false);

  const [selectedCharacter, setSelectedCharacter] = useState<CharacterSpec>(CHARACTERS[0]);
  const [charAutoTurn, setCharAutoTurn] = useState(true);

  const [scaleSubjectIds, setScaleSubjectIds] = useState<string[]>([
    "average-human",
    "attack-titan",
    "colossal-titan",
  ]);
  const [scaleSilhouette, setScaleSilhouette] = useState(false);
  const [scaleXray, setScaleXray] = useState(false);
  const [scaleGrid, setScaleGrid] = useState(true);
  const [eyeLevelScaleCam, setEyeLevelScaleCam] = useState(false);

  const [wallXray, setWallXray] = useState(false);
  const [showColossalOverWall, setShowColossalOverWall] = useState(true);

  const [activeTour, setActiveTour] = useState<GuidedTour | null>(null);
  const [tourStopIndex, setTourStopIndex] = useState(0);
  const [tourPlaying, setTourPlaying] = useState(false);

  const [hideUi, setHideUi] = useState(false);
  const [touchMoveInput, setTouchMoveInput] = useState({ x: 0, y: 0 });
  const [landmarkNotice, setLandmarkNotice] = useState<{ title: string; detail: string } | null>(
    null
  );
  const [exploredModes, setExploredModes] = useState<Set<ExplorationMode>>(
    () => new Set(["paradis"])
  );
  const [telemetry, setTelemetry] = useState({ calls: 0, triangles: 0, dpr: 1 });
  const [customPose, setCustomPose] = useState<CameraTargetPose | null>(null);
  const [introVisible, setIntroVisible] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const introRef = useRef<HTMLDivElement>(null);

  // Detect reduced motion, mobile quality tier, and optional query-param entry (?mode=)
  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onMq);

    if (window.innerWidth < 768) {
      setQuality("medium");
    }

    const params = new URLSearchParams(window.location.search);
    const qMode = params.get("mode") as ExplorationMode | null;
    if (qMode && qMode in DEFAULT_POSES) {
      setMode(qMode);
      setExploredModes((prev) => new Set(prev).add(qMode));
      setIntroVisible(false);
    }
    const qTitan = params.get("titan");
    if (qTitan) {
      const found = TITANS.find((t) => t.id === qTitan);
      if (found) setSelectedTitan(found);
    }
    const qChar = params.get("character");
    if (qChar) {
      const found = CHARACTERS.find((c) => c.id === qChar);
      if (found) setSelectedCharacter(found);
    }
    const qXray = params.get("xray");
    if (qXray === "1") setWallXray(true);

    return () => mq.removeEventListener("change", onMq);
  }, []);

  // GSAP intro title sequence (skips animation under reduced motion)
  useEffect(() => {
    if (!introVisible || !introRef.current) return;
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.from(".aot-intro-beat", {
        y: 12,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.out",
      });
    }, introRef);
    return () => ctx.revert();
  }, [introVisible, reducedMotion]);

  // Compute authoritative camera target pose for active state
  const targetPose: CameraTargetPose = useMemo(() => {
    if (customPose) return customPose;

    if (mode === "titans") {
      const h =
        selectedTitan.id === "founding" && doomsdayVariant
          ? 62
          : selectedTitan.heightMeters;
      return {
        id: `titan-${selectedTitan.id}-${doomsdayVariant}`,
        position: [h * 0.9, h * 0.48, h * 2.18],
        target: [0, h * 0.5, 0],
        fov: 42,
      };
    }

    if (mode === "scale") {
      const maxH = Math.max(
        18,
        ...scaleSubjectIds.map(
          (id) => SCALE_SUBJECTS.find((s) => s.id === id)?.heightMeters || 15
        )
      );
      if (eyeLevelScaleCam) {
        return {
          id: `scale-eye-${scaleSubjectIds.join("-")}`,
          position: [-4, 1.7, Math.max(26, maxH * 0.62)],
          target: [2, Math.min(48, maxH * 0.55), -6],
          fov: 58,
        };
      }
      return {
        id: `scale-wide-${scaleSubjectIds.join("-")}`,
        position: [maxH * 0.36, maxH * 0.46, maxH * 2.08],
        target: [0, maxH * 0.48, -6],
        fov: 44,
      };
    }

    if (mode === "characters") {
      return {
        id: `char-${selectedCharacter.id}`,
        position: [0.48, selectedCharacter.heightMeters * 0.62, 3.05],
        target: [0, selectedCharacter.heightMeters * 0.54, 0],
        fov: 36,
      };
    }

    if (mode === "paradis") {
      return {
        id: `paradis-${selectedDistrict.id}`,
        position: [
          selectedDistrict.macroPos[0] * 0.45,
          92,
          245 + selectedDistrict.macroPos[2] * 0.25,
        ],
        target: [
          selectedDistrict.macroPos[0] * 0.45,
          6,
          selectedDistrict.macroPos[2] * 0.35,
        ],
        fov: 42,
      };
    }

    const base = DEFAULT_POSES[mode];
    return { id: `default-${mode}`, ...base };
  }, [
    customPose,
    mode,
    selectedTitan,
    doomsdayVariant,
    scaleSubjectIds,
    eyeLevelScaleCam,
    selectedCharacter,
    selectedDistrict,
  ]);

  const selectMode = useCallback((next: ExplorationMode) => {
    setActiveTour(null);
    setTourPlaying(false);
    setCustomPose(null);
    setControlMode("orbit");
    setIntroVisible(false);
    setMode(next);
    setExploredModes((prev) => new Set(prev).add(next));
  }, []);

  // Apply Guided Tour Stop settings cleanly
  const applyTourStop = useCallback((tour: GuidedTour, idx: number) => {
    const stop = tour.stops[idx];
    if (!stop) return;
    setIntroVisible(false);
    setMode(stop.mode);
    setExploredModes((prev) => new Set(prev).add(stop.mode));
    setControlMode("tour");
    setCustomPose({
      id: `tour-${tour.id}-${stop.id}-${Date.now()}`,
      position: stop.cameraPos,
      target: stop.cameraTarget,
      fov: stop.fov,
    });

    if (stop.presetOptions?.timeOfDay) {
      setTimeOfDay(stop.presetOptions.timeOfDay);
    }
    if (stop.presetOptions?.wallXray !== undefined) {
      setWallXray(stop.presetOptions.wallXray);
    }
    if (stop.presetOptions?.titanId) {
      const found = TITANS.find((t) => t.id === stop.presetOptions!.titanId);
      if (found) setSelectedTitan(found);
    }
    if (stop.presetOptions?.scalePair) {
      setScaleSubjectIds(stop.presetOptions.scalePair);
    }
  }, []);

  // Auto-advance Guided Tour when playing
  useEffect(() => {
    if (!activeTour || !tourPlaying) return;
    const currentStop = activeTour.stops[tourStopIndex];
    const timer = window.setTimeout(() => {
      if (tourStopIndex + 1 < activeTour.stops.length) {
        const nextIdx = tourStopIndex + 1;
        setTourStopIndex(nextIdx);
        applyTourStop(activeTour, nextIdx);
      } else {
        setTourPlaying(false);
      }
    }, (currentStop?.dwellSeconds || 7) * 1000);
    return () => window.clearTimeout(timer);
  }, [activeTour, tourPlaying, tourStopIndex, applyTourStop]);

  const handleStartTour = useCallback(
    (tour: GuidedTour) => {
      setActiveTour(tour);
      setTourStopIndex(0);
      setTourPlaying(true);
      applyTourStop(tour, 0);
    },
    [applyTourStop]
  );

  const handleStepTour = useCallback(
    (delta: number) => {
      if (!activeTour) return;
      const next = Math.max(0, Math.min(activeTour.stops.length - 1, tourStopIndex + delta));
      setTourStopIndex(next);
      applyTourStop(activeTour, next);
    },
    [activeTour, tourStopIndex, applyTourStop]
  );

  const handleCaptureScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `paradis-${mode}-${Date.now()}.png`;
    a.click();
  }, [mode]);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#121311]">
      {/* Real-time 3D WebGL Canvas */}
      {mounted ? (
        <AotWorldCanvas
          mode={mode}
          timeOfDay={timeOfDay}
          weather={weather}
          quality={quality}
          onQualityChange={setQuality}
          controlMode={controlMode}
          targetPose={targetPose}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(d) => {
            setSelectedDistrict(d);
            setCustomPose(null);
          }}
          selectedTitan={selectedTitan}
          showTitanHumanForm={showTitanHumanForm}
          transformSeqKey={transformSeqKey}
          doomsdayVariant={doomsdayVariant}
          selectedCharacter={selectedCharacter}
          charAutoTurn={charAutoTurn}
          scaleSubjects={SCALE_SUBJECTS.filter((s) => scaleSubjectIds.includes(s.id))}
          scaleSilhouette={scaleSilhouette}
          scaleXray={scaleXray}
          scaleGrid={scaleGrid}
          wallXray={wallXray}
          showColossalOverWall={showColossalOverWall}
          hideOverlays={hideUi || introVisible}
          reducedMotion={reducedMotion}
          touchMoveInput={touchMoveInput}
          onEnterYeagerHouse={() => {
            setControlMode("walk");
            setCustomPose({
              id: `yeager-interior-${Date.now()}`,
              position: [-21.6, 1.7, -34.2],
              target: [-23.2, 1.4, -40.8],
              fov: 54,
            });
            setLandmarkNotice({
              title: "Yeager Residence · Interior",
              detail:
                "Standing inside Eren's childhood living room. Ahead: the stone hearth fireplace, oak dining table, and Grisha's locked cellar trapdoor in the back-right corner. Use WASD + drag to explore.",
            });
          }}
          onSelectLandmark={(title, detail) => setLandmarkNotice({ title, detail })}
          onReadyCanvas={(c) => {
            canvasRef.current = c;
          }}
          onTelemetrySample={setTelemetry}
        />
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-[#121311] text-[#EAE3D2]">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#B8965A]">
            Initializing Paradis 3D World...
          </p>
        </div>
      )}

      {/* Cinematic Opening Arrival Overlay (Dismissible immediately into full HUD exploration) */}
      {introVisible && (
        <div
          ref={introRef}
          className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-end p-6 sm:p-12 bg-gradient-to-t from-[#121311]/90 via-[#121311]/25 to-transparent"
        >
          <div className="max-w-2xl space-y-4 pointer-events-auto">
            <p className="aot-intro-beat text-xs font-mono uppercase tracking-[0.24em] text-[#B8965A]">
              Historical Survey Archive · Paradis Island
            </p>
            <h2 className="aot-intro-beat font-serif text-3xl sm:text-5xl leading-[1.08] tracking-wide text-[#EAE3D2]">
              Beyond the Walls
            </h2>
            <p className="aot-intro-beat text-sm sm:text-base text-[#EAE3D2]/85 max-w-xl leading-relaxed">
              An interactive 1:1 meter 3D reconstruction of Paradis Island, the 50-meter concentric Walls, Shiganshina District, the Nine Titans, and the Survey Corps.
            </p>
            <div className="aot-intro-beat flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIntroVisible(false);
                  handleStartTour(GUIDED_TOURS[0]);
                }}
                className="px-5 py-2.5 bg-[#B8965A] text-[#121311] font-mono text-xs uppercase tracking-wider hover:bg-[#cca96d] transition-colors cursor-pointer"
              >
                Begin Guided Tour
              </button>
              <button
                type="button"
                onClick={() => selectMode("shiganshina")}
                className="px-5 py-2.5 bg-[#121311]/85 border border-[#EAE3D2]/40 text-[#EAE3D2] font-mono text-xs uppercase tracking-wider hover:border-[#B8965A] transition-colors cursor-pointer"
              >
                Enter Shiganshina (1:1m)
              </button>
              <button
                type="button"
                onClick={() => setIntroVisible(false)}
                className="px-4 py-2.5 text-[#A49D8E] font-mono text-xs uppercase tracking-wider hover:text-[#EAE3D2] cursor-pointer"
              >
                Explore Island Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Museum HUD & Navigation */}
      {!introVisible && (
        <MuseumHud
          mode={mode}
          onSelectMode={selectMode}
          controlMode={controlMode}
          onChangeControlMode={setControlMode}
          timeOfDay={timeOfDay}
          onChangeTimeOfDay={setTimeOfDay}
          weather={weather}
          onChangeWeather={setWeather}
          quality={quality}
          onChangeQuality={setQuality}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(d) => {
            setSelectedDistrict(d);
            setCustomPose(null);
          }}
          onDiveIntoDistrict={(d) => {
            setSelectedDistrict(d);
            selectMode(d.id === "shiganshina" ? "shiganshina" : d.id === "forest-giant-trees" || d.id === "utgard" ? "beyond" : "districts");
          }}
          selectedTitan={selectedTitan}
          onSelectTitan={(t) => {
            setSelectedTitan(t);
            setCustomPose(null);
          }}
          showTitanHumanForm={showTitanHumanForm}
          onToggleTitanHumanForm={() => setShowTitanHumanForm((v) => !v)}
          doomsdayVariant={doomsdayVariant}
          onToggleDoomsdayVariant={() => setDoomsdayVariant((v) => !v)}
          onTriggerTransformation={() => setTransformSeqKey((k) => k + 1)}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={(c) => {
            setSelectedCharacter(c);
            setCustomPose(null);
          }}
          charAutoTurn={charAutoTurn}
          onToggleCharAutoTurn={() => setCharAutoTurn((v) => !v)}
          scaleSubjectIds={scaleSubjectIds}
          onToggleScaleSubject={(id) => {
            setScaleSubjectIds((prev) => {
              if (prev.includes(id)) {
                return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
              }
              return prev.length >= 3 ? [...prev.slice(1), id] : [...prev, id];
            });
            setCustomPose(null);
          }}
          onSetScalePreset={(ids, eye) => {
            setScaleSubjectIds(ids);
            setEyeLevelScaleCam(Boolean(eye));
            setCustomPose(null);
          }}
          scaleSilhouette={scaleSilhouette}
          onToggleScaleSilhouette={() => setScaleSilhouette((v) => !v)}
          scaleXray={scaleXray}
          onToggleScaleXray={() => setScaleXray((v) => !v)}
          scaleGrid={scaleGrid}
          onToggleScaleGrid={() => setScaleGrid((v) => !v)}
          eyeLevelScaleCam={eyeLevelScaleCam}
          onToggleEyeLevelScaleCam={() => {
            setEyeLevelScaleCam((v) => !v);
            setCustomPose(null);
          }}
          wallXray={wallXray}
          onToggleWallXray={() => setWallXray((v) => !v)}
          showColossalOverWall={showColossalOverWall}
          onToggleColossalOverWall={() => setShowColossalOverWall((v) => !v)}
          onFlyWallToWall={() => {
            setControlMode("orbit");
            setCustomPose({
              id: `wall-to-wall-${Date.now()}`,
              position: [28, 62, 65],
              target: [-8, 38, -240],
              fov: 48,
            });
          }}
          onWalkWallTop={() => {
            setControlMode("walk");
            setCustomPose({
              id: `wall-top-${Date.now()}`,
              position: [-26, 51.7, 17.5],
              target: [18, 51.4, 17.5],
              fov: 54,
            });
          }}
          onEnterYeagerHouse={() => {
            setControlMode("walk");
            setCustomPose({
              id: `yeager-enter-${Date.now()}`,
              position: [-21.8, 1.7, -33.2],
              target: [-22.6, 1.4, -40.5],
              fov: 54,
            });
            setLandmarkNotice({
              title: "Yeager Residence · Ground Floor",
              detail:
                "You are standing at the doorway of Eren's childhood home. Walk forward with W to inspect the hearth, oak dining table, and Grisha's cellar trapdoor.",
            });
          }}
          onWalkShiganshinaStreet={() => {
            setControlMode("walk");
            setCustomPose({
              id: `shig-street-${Date.now()}`,
              position: [0, 1.7, 8],
              target: [0, 2.2, -32],
              fov: 52,
            });
          }}
          onBeyondView={(view) => {
            setControlMode("orbit");
            if (view === "forest") {
              setCustomPose({
                id: `beyond-forest-${Date.now()}`,
                position: [0, 14, 42],
                target: [2, 24, -20],
                fov: 48,
              });
            } else {
              setCustomPose({
                id: `beyond-utgard-${Date.now()}`,
                position: [-14, 16, -34],
                target: [22, 14, -68],
                fov: 46,
              });
            }
          }}
          activeTour={activeTour}
          tourStopIndex={tourStopIndex}
          tourPlaying={tourPlaying}
          onStartTour={handleStartTour}
          onToggleTourPlay={() => setTourPlaying((p) => !p)}
          onStepTour={handleStepTour}
          onExitTour={() => {
            setActiveTour(null);
            setTourPlaying(false);
            setControlMode("orbit");
          }}
          hideUi={hideUi}
          onToggleHideUi={() => setHideUi((v) => !v)}
          onCaptureScreenshot={handleCaptureScreenshot}
          onTouchMove={setTouchMoveInput}
          landmarkNotice={landmarkNotice}
          onDismissLandmarkNotice={() => setLandmarkNotice(null)}
          exploredModes={exploredModes}
          telemetry={telemetry}
        />
      )}
    </main>
  );
}
