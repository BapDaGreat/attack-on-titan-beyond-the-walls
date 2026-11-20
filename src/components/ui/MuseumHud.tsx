"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Compass,
  Eye,
  EyeOff,
  Footprints,
  Info,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Ruler,
  Settings2,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Wind,
  X,
} from "lucide-react";
import { DISTRICTS, DistrictSpec, ExplorationMode, LORE_ENTRIES, WALL_SPECS } from "@/data/world";
import { TITANS, TitanSpec } from "@/data/titans";
import { CHARACTERS, CharacterSpec } from "@/data/characters";
import { SCALE_SUBJECTS, ScaleSubjectSpec } from "@/data/scaleSubjects";
import { GUIDED_TOURS, GuidedTour } from "@/data/tours";
import { QUALITY_CONFIGS, QualityPreset, TimeOfDay, WeatherMode } from "@/engine/environment";
import { CameraControlMode } from "../scene/CameraRig";
import { CompassMinimap } from "./CompassMinimap";
import { TouchJoystick } from "./TouchJoystick";

interface MuseumHudProps {
  mode: ExplorationMode;
  onSelectMode: (m: ExplorationMode) => void;
  controlMode: CameraControlMode;
  onChangeControlMode: (cm: CameraControlMode) => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (t: TimeOfDay) => void;
  weather: WeatherMode;
  onChangeWeather: (w: WeatherMode) => void;
  quality: QualityPreset;
  onChangeQuality: (q: QualityPreset) => void;
  selectedDistrict: DistrictSpec;
  onSelectDistrict: (d: DistrictSpec) => void;
  onDiveIntoDistrict: (d: DistrictSpec) => void;
  selectedTitan: TitanSpec;
  onSelectTitan: (t: TitanSpec) => void;
  showTitanHumanForm: boolean;
  onToggleTitanHumanForm: () => void;
  doomsdayVariant: boolean;
  onToggleDoomsdayVariant: () => void;
  onTriggerTransformation: () => void;
  selectedCharacter: CharacterSpec;
  onSelectCharacter: (c: CharacterSpec) => void;
  charAutoTurn: boolean;
  onToggleCharAutoTurn: () => void;
  scaleSubjectIds: string[];
  onToggleScaleSubject: (id: string) => void;
  onSetScalePreset: (ids: string[], eyeLevel?: boolean) => void;
  scaleSilhouette: boolean;
  onToggleScaleSilhouette: () => void;
  scaleXray: boolean;
  onToggleScaleXray: () => void;
  scaleGrid: boolean;
  onToggleScaleGrid: () => void;
  eyeLevelScaleCam: boolean;
  onToggleEyeLevelScaleCam: () => void;
  wallXray: boolean;
  onToggleWallXray: () => void;
  showColossalOverWall: boolean;
  onToggleColossalOverWall: () => void;
  onFlyWallToWall: () => void;
  onWalkWallTop: () => void;
  onEnterYeagerHouse: () => void;
  onWalkShiganshinaStreet: () => void;
  onBeyondView: (view: "forest" | "utgard") => void;
  activeTour: GuidedTour | null;
  tourStopIndex: number;
  tourPlaying: boolean;
  onStartTour: (tour: GuidedTour) => void;
  onToggleTourPlay: () => void;
  onStepTour: (delta: number) => void;
  onExitTour: () => void;
  hideUi: boolean;
  onToggleHideUi: () => void;
  onCaptureScreenshot: () => void;
  onTouchMove: (vec: { x: number; y: number }) => void;
  landmarkNotice: { title: string; detail: string } | null;
  onDismissLandmarkNotice: () => void;
  exploredModes: Set<ExplorationMode>;
  telemetry: { calls: number; triangles: number; dpr: number };
}

const MODE_NAV: { id: ExplorationMode; label: string }[] = [
  { id: "paradis", label: "Paradis Island" },
  { id: "walls", label: "The Three Walls" },
  { id: "shiganshina", label: "Shiganshina" },
  { id: "districts", label: "Cities & Districts" },
  { id: "titans", label: "Nine Titans" },
  { id: "scale", label: "Size Comparison" },
  { id: "characters", label: "Characters" },
  { id: "beyond", label: "Beyond the Walls" },
];

export const MuseumHud: React.FC<MuseumHudProps> = ({
  mode,
  onSelectMode,
  controlMode,
  onChangeControlMode,
  timeOfDay,
  onChangeTimeOfDay,
  weather,
  onChangeWeather,
  quality,
  onChangeQuality,
  selectedDistrict,
  onSelectDistrict,
  onDiveIntoDistrict,
  selectedTitan,
  onSelectTitan,
  showTitanHumanForm,
  onToggleTitanHumanForm,
  doomsdayVariant,
  onToggleDoomsdayVariant,
  onTriggerTransformation,
  selectedCharacter,
  onSelectCharacter,
  charAutoTurn,
  onToggleCharAutoTurn,
  scaleSubjectIds,
  onToggleScaleSubject,
  onSetScalePreset,
  scaleSilhouette,
  onToggleScaleSilhouette,
  scaleXray,
  onToggleScaleXray,
  scaleGrid,
  onToggleScaleGrid,
  eyeLevelScaleCam,
  onToggleEyeLevelScaleCam,
  wallXray,
  onToggleWallXray,
  showColossalOverWall,
  onToggleColossalOverWall,
  onFlyWallToWall,
  onWalkWallTop,
  onEnterYeagerHouse,
  onWalkShiganshinaStreet,
  onBeyondView,
  activeTour,
  tourStopIndex,
  tourPlaying,
  onStartTour,
  onToggleTourPlay,
  onStepTour,
  onExitTour,
  hideUi,
  onToggleHideUi,
  onCaptureScreenshot,
  onTouchMove,
  landmarkNotice,
  onDismissLandmarkNotice,
  exploredModes,
  telemetry,
}) => {
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const loreDialogRef = useRef<HTMLDialogElement>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const toursDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (window.innerWidth < 640) {
      setPanelCollapsed(true);
    }
  }, []);

  // Keyboard shortcut H for Hide UI / Photography mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.key === "h" || e.key === "H") {
        onToggleHideUi();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggleHideUi]);

  if (hideUi) {
    return (
      <div className="fixed inset-0 pointer-events-none z-20 p-4 flex items-end justify-end gap-2">
        <button
          type="button"
          onClick={onCaptureScreenshot}
          className="pointer-events-auto px-3 py-2 bg-[#121311]/88 border border-[#B8965A]/60 text-[#EAE3D2] text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:bg-[#B8965A] hover:text-[#121311] transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" aria-hidden="true" />
          Capture
        </button>
        <button
          type="button"
          onClick={onToggleHideUi}
          className="pointer-events-auto px-3 py-2 bg-[#121311]/88 border border-[#EAE3D2]/30 text-[#EAE3D2] text-xs font-mono uppercase tracking-wider flex items-center gap-2 hover:border-[#B8965A] transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Show HUD (H)
        </button>
      </div>
    );
  }

  const currentTourStop = activeTour ? activeTour.stops[tourStopIndex] : null;
  const explorationPct = Math.round((exploredModes.size / MODE_NAV.length) * 100);

  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between">
      {/* Top Editorial Archival Bar */}
      <header className="pointer-events-auto bg-[#121311]/92 border-b border-[#B8965A]/30 px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-6 bg-[#9E2B25]" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="font-serif text-sm sm:text-base tracking-[0.12em] uppercase text-[#EAE3D2] truncate">
              Attack on Titan · Beyond the Walls
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#A49D8E]">
              Survey Archive · 1 Unit = 1 Meter · Explored {explorationPct}%
            </p>
          </div>
        </div>

        {/* Realm Navigation */}
        <nav aria-label="Primary 3D Realms" className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
          {MODE_NAV.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSelectMode(item.id)}
                className={`px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-[#EAE3D2] text-[#121311] border-[#EAE3D2]"
                    : "bg-transparent text-[#EAE3D2]/80 border-transparent hover:border-[#B8965A]/45 hover:text-[#EAE3D2]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Utility Triggers (Tours, Lore, Atmosphere/Quality, Photo Mode) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toursDialogRef.current?.showModal()}
            className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider border border-[#B8965A]/60 text-[#EAE3D2] hover:bg-[#B8965A] hover:text-[#121311] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Guided Tours</span>
          </button>

          <button
            type="button"
            onClick={() => loreDialogRef.current?.showModal()}
            className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider border border-[#EAE3D2]/25 text-[#EAE3D2]/90 hover:border-[#B8965A] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Lore & History</span>
          </button>

          <button
            type="button"
            onClick={() => settingsDialogRef.current?.showModal()}
            aria-label="Atmosphere, weather, and graphics settings"
            className="px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider border border-[#EAE3D2]/25 text-[#EAE3D2]/90 hover:border-[#B8965A] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">{timeOfDay}</span>
          </button>

          <button
            type="button"
            onClick={onCaptureScreenshot}
            aria-label="Capture PNG screenshot"
            className="p-1.5 border border-[#EAE3D2]/25 text-[#EAE3D2]/90 hover:border-[#B8965A] transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleHideUi}
            aria-label="Hide interface for photography mode (H)"
            className="p-1.5 border border-[#EAE3D2]/25 text-[#EAE3D2]/90 hover:border-[#B8965A] transition-colors cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Overlay Body: Left Contextual Inspector + Right Minimap/Camera Controls */}
      <div className="flex-1 flex flex-col sm:flex-row justify-between items-stretch sm:items-end p-3 sm:p-5 gap-3 min-h-0">
        {/* Left Museum Dossier & Controls Rail */}
        <aside className="pointer-events-auto w-full sm:w-[330px] max-h-[42dvh] sm:max-h-[72dvh] flex flex-col bg-[#121311]/90 border border-[#B8965A]/35 text-[#EAE3D2]">
          <div className="px-3.5 py-2.5 border-b border-[#EAE3D2]/12 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#B8965A]">
              {MODE_NAV.find((m) => m.id === mode)?.label}
            </span>
            <button
              type="button"
              onClick={() => setPanelCollapsed((v) => !v)}
              className="text-[11px] font-mono uppercase text-[#A49D8E] hover:text-[#EAE3D2] cursor-pointer"
            >
              {panelCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>

          {!panelCollapsed && (
            <div className="p-3.5 overflow-y-auto space-y-3 text-xs leading-relaxed">
              {/* PARADIS ISLAND PANEL */}
              {mode === "paradis" && (
                <>
                  <h2 className="font-serif text-lg text-[#EAE3D2]">Paradis Island Survey</h2>
                  <p className="text-[#A49D8E]">
                    Strategic 1:1000 relief displaying the island coast, mountain spine, river basin, and all three 50-meter concentric Walls.
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {WALL_SPECS.map((w) => (
                      <div key={w.id} className="border-l-2 pl-2.5 py-0.5" style={{ borderColor: w.colorAccent }}>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span>{w.name}</span>
                          <span className="text-[#B8965A]">R {w.canonRadiusKm} km · H {w.heightMeters} m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-[#EAE3D2]/12 space-y-2">
                    <p className="text-[11px] font-mono uppercase text-[#B8965A]">
                      Selected: {selectedDistrict.name}
                    </p>
                    <p className="text-[#EAE3D2]/85">{selectedDistrict.summary}</p>
                    <button
                      type="button"
                      onClick={() => onDiveIntoDistrict(selectedDistrict)}
                      className="w-full py-2 bg-[#3E5641] hover:bg-[#4B684F] text-[#EAE3D2] font-mono text-[11px] uppercase tracking-wider border border-[#EAE3D2]/20 cursor-pointer"
                    >
                      Descend to 1:1m District
                    </button>
                  </div>
                </>
              )}

              {/* THREE WALLS PANEL */}
              {mode === "walls" && (
                <>
                  <h2 className="font-serif text-lg text-[#EAE3D2]">The Three Walls · 50 m</h2>
                  <p className="text-[#A49D8E]">
                    True 1:1 meter elevation of Wall Maria&apos;s cyclopean masonry, arched gatehouse, and rail-mounted cannon batteries.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={onToggleWallXray}
                      aria-pressed={wallXray}
                      className={`py-2 px-3 font-mono text-[11px] uppercase tracking-wider border text-left flex items-center justify-between cursor-pointer ${
                        wallXray
                          ? "bg-[#1C3D42] border-[#4AC8CE] text-[#EAE3D2]"
                          : "border-[#EAE3D2]/25 text-[#EAE3D2]/85 hover:border-[#B8965A]"
                      }`}
                    >
                      <span>X-Ray Wall Titans Cutaway</span>
                      <span>{wallXray ? "ON" : "OFF"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleColossalOverWall}
                      aria-pressed={showColossalOverWall}
                      className={`py-2 px-3 font-mono text-[11px] uppercase tracking-wider border text-left flex items-center justify-between cursor-pointer ${
                        showColossalOverWall
                          ? "bg-[#9E2B25]/80 border-[#EAE3D2]/40 text-[#EAE3D2]"
                          : "border-[#EAE3D2]/25 text-[#EAE3D2]/85 hover:border-[#B8965A]"
                      }`}
                    >
                      <span>Colossal Titan (60 m) Above Wall</span>
                      <span>{showColossalOverWall ? "ON" : "OFF"}</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={onWalkWallTop}
                        className="py-2 px-2.5 font-mono text-[11px] uppercase border border-[#B8965A]/55 hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                      >
                        Walk 50m Top
                      </button>
                      <button
                        type="button"
                        onClick={onFlyWallToWall}
                        className="py-2 px-2.5 font-mono text-[11px] uppercase border border-[#B8965A]/55 hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                      >
                        Maria → Sina
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SHIGANSHINA DISTRICT PANEL */}
              {mode === "shiganshina" && (
                <>
                  <h2 className="font-serif text-lg text-[#EAE3D2]">Shiganshina District</h2>
                  <p className="text-[#A49D8E]">
                    Southern salient of Wall Maria. Half-timbered dwellings, canal masonry bridge, moving supply cart, living residents, and Yeager Residence interior.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={onEnterYeagerHouse}
                      className="py-2 px-3 bg-[#3E5641] hover:bg-[#4B684F] text-[#EAE3D2] font-mono text-[11px] uppercase tracking-wider border border-[#EAE3D2]/25 cursor-pointer"
                    >
                      Explore Yeager Residence Interior
                    </button>
                    <button
                      type="button"
                      onClick={onWalkShiganshinaStreet}
                      className="py-2 px-3 border border-[#B8965A]/55 text-[#EAE3D2] font-mono text-[11px] uppercase tracking-wider hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                    >
                      Walk Main Avenue (1.7m Eye Level)
                    </button>
                  </div>
                </>
              )}

              {/* MULTI-DISTRICT PANEL */}
              {mode === "districts" && (
                <>
                  <h2 className="font-serif text-lg text-[#EAE3D2]">{selectedDistrict.name}</h2>
                  <p className="text-[10px] font-mono uppercase text-[#B8965A]">
                    Wall {selectedDistrict.wall} · {selectedDistrict.canonFidelity}
                  </p>
                  <p className="text-[#EAE3D2]/85">{selectedDistrict.summary}</p>
                  <p className="text-[#A49D8E] text-[11px]">{selectedDistrict.architectureNotes}</p>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {DISTRICTS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onSelectDistrict(d)}
                        className={`px-2 py-1.5 text-left font-mono text-[10px] border truncate cursor-pointer ${
                          d.id === selectedDistrict.id
                            ? "bg-[#B8965A] text-[#121311] border-[#B8965A]"
                            : "border-[#EAE3D2]/20 text-[#EAE3D2]/80 hover:border-[#B8965A]/60"
                        }`}
                      >
                        {d.name.replace(" District", "")}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* NINE TITANS PANEL */}
              {mode === "titans" && (
                <>
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif text-lg text-[#EAE3D2]">{selectedTitan.name}</h2>
                    <span className="font-mono text-xs text-[#B8965A]">{selectedTitan.heightMeters} m</span>
                  </div>
                  <p className="text-[10px] font-mono uppercase text-[#A49D8E]">
                    {selectedTitan.category} · {selectedTitan.inheritors.join(", ")}
                  </p>
                  <p className="text-[#EAE3D2]/85">{selectedTitan.summary}</p>
                  <ul className="space-y-1 text-[11px] text-[#A49D8E] list-disc pl-4">
                    {selectedTitan.abilities.map((ab, i) => (
                      <li key={i}>{ab}</li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={onTriggerTransformation}
                      className="col-span-2 py-2 px-3 bg-[#9E2B25] hover:bg-[#B2342D] text-[#EAE3D2] font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      Trigger Transformation Burst
                    </button>
                    <button
                      type="button"
                      onClick={onToggleTitanHumanForm}
                      aria-pressed={showTitanHumanForm}
                      className={`py-1.5 px-2 font-mono text-[10px] uppercase border cursor-pointer ${
                        showTitanHumanForm ? "bg-[#3E5641] border-[#EAE3D2]/30" : "border-[#EAE3D2]/20"
                      }`}
                    >
                      {showTitanHumanForm ? "Hide Human Form" : "Compare Human"}
                    </button>
                    {selectedTitan.id === "founding" && (
                      <button
                        type="button"
                        onClick={onToggleDoomsdayVariant}
                        aria-pressed={doomsdayVariant}
                        className={`py-1.5 px-2 font-mono text-[10px] uppercase border cursor-pointer ${
                          doomsdayVariant ? "bg-[#B8965A] text-[#121311] border-[#B8965A]" : "border-[#EAE3D2]/20"
                        }`}
                      >
                        {doomsdayVariant ? "Ymir Form" : "Doomsday Form"}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#EAE3D2]/12">
                    {TITANS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelectTitan(t)}
                        className={`px-2 py-1 text-left font-mono text-[10px] border truncate cursor-pointer ${
                          t.id === selectedTitan.id
                            ? "bg-[#EAE3D2] text-[#121311] border-[#EAE3D2]"
                            : "border-[#EAE3D2]/18 text-[#EAE3D2]/80 hover:border-[#B8965A]"
                        }`}
                      >
                        {t.numberLabel}. {t.name.replace(" Titan", "")}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* SCALE COMPARISON LAB PANEL */}
              {mode === "scale" && (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg text-[#EAE3D2]">Scale Laboratory</h2>
                    <Ruler className="w-4 h-4 text-[#B8965A]" aria-hidden="true" />
                  </div>
                  <p className="text-[#A49D8E]">
                    Select up to 3 subjects at exact 1:1 meter scale beside Wall Maria (50 m).
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSetScalePreset(["average-human", "colossal-titan", "wall-maria"], true)}
                      className="py-1.5 px-2 font-mono text-[10px] uppercase border border-[#B8965A]/55 hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                    >
                      Colossal vs Wall
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetScalePreset(["eren-human", "attack-titan", "shiganshina-house"], false)}
                      className="py-1.5 px-2 font-mono text-[10px] uppercase border border-[#B8965A]/55 hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                    >
                      Attack vs House
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={onToggleEyeLevelScaleCam}
                      aria-pressed={eyeLevelScaleCam}
                      className={`py-1.5 px-2 font-mono text-[10px] uppercase border cursor-pointer ${
                        eyeLevelScaleCam ? "bg-[#3E5641] border-[#EAE3D2]/30" : "border-[#EAE3D2]/20"
                      }`}
                    >
                      1.7m Human Eye
                    </button>
                    <button
                      type="button"
                      onClick={onToggleScaleSilhouette}
                      aria-pressed={scaleSilhouette}
                      className={`py-1.5 px-2 font-mono text-[10px] uppercase border cursor-pointer ${
                        scaleSilhouette ? "bg-[#EAE3D2] text-[#121311]" : "border-[#EAE3D2]/20"
                      }`}
                    >
                      Silhouette
                    </button>
                    <button
                      type="button"
                      onClick={onToggleScaleXray}
                      aria-pressed={scaleXray}
                      className={`py-1.5 px-2 font-mono text-[10px] uppercase border cursor-pointer ${
                        scaleXray ? "bg-[#1C3D42] border-[#4AC8CE]" : "border-[#EAE3D2]/20"
                      }`}
                    >
                      X-Ray Overlay
                    </button>
                    <button
                      type="button"
                      onClick={onToggleScaleGrid}
                      aria-pressed={scaleGrid}
                      className={`py-1.5 px-2 font-mono text-[10px] uppercase border cursor-pointer ${
                        scaleGrid ? "bg-[#B8965A] text-[#121311]" : "border-[#EAE3D2]/20"
                      }`}
                    >
                      Metric Ruler
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto grid grid-cols-1 gap-1 pt-1 border-t border-[#EAE3D2]/12">
                    {SCALE_SUBJECTS.map((sub: ScaleSubjectSpec) => {
                      const active = scaleSubjectIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onToggleScaleSubject(sub.id)}
                          aria-pressed={active}
                          className={`px-2 py-1 flex items-center justify-between font-mono text-[10px] border cursor-pointer ${
                            active
                              ? "bg-[#B8965A]/25 border-[#B8965A] text-[#EAE3D2]"
                              : "border-[#EAE3D2]/12 text-[#A49D8E] hover:text-[#EAE3D2]"
                          }`}
                        >
                          <span>{sub.label}</span>
                          <span>{sub.heightMeters} m</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* CHARACTERS PANEL */}
              {mode === "characters" && (
                <>
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif text-lg text-[#EAE3D2]">{selectedCharacter.name}</h2>
                    <span className="font-mono text-xs text-[#B8965A]">{selectedCharacter.heightMeters.toFixed(2)} m</span>
                  </div>
                  <p className="text-[10px] font-mono uppercase text-[#A49D8E]">
                    {selectedCharacter.regiment} · {selectedCharacter.title}
                  </p>
                  <p className="text-[#EAE3D2]/85">{selectedCharacter.bio}</p>
                  <p className="text-[11px] font-mono text-[#B8965A]">
                    Gear: {selectedCharacter.signatureGear}
                  </p>
                  <button
                    type="button"
                    onClick={onToggleCharAutoTurn}
                    aria-pressed={charAutoTurn}
                    className="w-full py-1.5 px-2 font-mono text-[10px] uppercase border border-[#EAE3D2]/25 hover:border-[#B8965A] cursor-pointer"
                  >
                    {charAutoTurn ? "Pause Pedestal Turn" : "Resume Pedestal Turn"}
                  </button>
                  <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#EAE3D2]/12">
                    {CHARACTERS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectCharacter(c)}
                        className={`px-2 py-1 text-left font-mono text-[10px] border truncate cursor-pointer ${
                          c.id === selectedCharacter.id
                            ? "bg-[#EAE3D2] text-[#121311] border-[#EAE3D2]"
                            : "border-[#EAE3D2]/18 text-[#EAE3D2]/80 hover:border-[#B8965A]"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* BEYOND THE WALLS PANEL */}
              {mode === "beyond" && (
                <>
                  <h2 className="font-serif text-lg text-[#EAE3D2]">Beyond the Walls</h2>
                  <p className="text-[#A49D8E]">
                    80-meter ancient hardwood canopy with volumetric sun shafts, falling leaves, Pure Titans, and the ruined Utgard Watchtower keep.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onBeyondView("forest")}
                      className="py-2 px-2.5 font-mono text-[11px] uppercase border border-[#B8965A]/55 hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                    >
                      Giant Forest
                    </button>
                    <button
                      type="button"
                      onClick={() => onBeyondView("utgard")}
                      className="py-2 px-2.5 font-mono text-[11px] uppercase border border-[#B8965A]/55 hover:bg-[#B8965A] hover:text-[#121311] cursor-pointer"
                    >
                      Utgard Ruins
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </aside>

        {/* Right Side: Active Tour Dock + Camera Controls + Minimap */}
        <div className="flex flex-col items-end gap-2.5">
          {landmarkNotice && (
            <div className="pointer-events-auto max-w-xs bg-[#121311]/94 border border-[#B8965A] p-3 text-xs text-[#EAE3D2] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-sm text-[#B8965A]">{landmarkNotice.title}</span>
                <button
                  type="button"
                  onClick={onDismissLandmarkNotice}
                  aria-label="Close landmark note"
                  className="text-[#A49D8E] hover:text-[#EAE3D2] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[#EAE3D2]/85 leading-relaxed">{landmarkNotice.detail}</p>
            </div>
          )}

          {activeTour && currentTourStop && (
            <div className="pointer-events-auto w-full sm:w-[360px] bg-[#121311]/95 border border-[#B8965A] p-3.5 text-[#EAE3D2] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#B8965A]">
                  {currentTourStop.eyebrow} · {tourStopIndex + 1}/{activeTour.stops.length}
                </span>
                <button
                  type="button"
                  onClick={onExitTour}
                  className="text-[10px] font-mono uppercase text-[#A49D8E] hover:text-[#EAE3D2] cursor-pointer"
                >
                  Exit Tour
                </button>
              </div>
              <h3 className="font-serif text-base">{currentTourStop.title}</h3>
              <p className="text-xs text-[#A49D8E] leading-relaxed">{currentTourStop.description}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onStepTour(-1)}
                  aria-label="Previous tour stop"
                  className="p-2 border border-[#EAE3D2]/25 hover:border-[#B8965A] cursor-pointer"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleTourPlay}
                  className="px-3 py-1.5 flex-1 bg-[#B8965A] text-[#121311] font-mono text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {tourPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {tourPlaying ? "Pause" : "Play"}
                </button>
                <button
                  type="button"
                  onClick={() => onStepTour(1)}
                  aria-label="Next tour stop"
                  className="p-2 border border-[#EAE3D2]/25 hover:border-[#B8965A] cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeControlMode("walk")}
                  className="px-2.5 py-1.5 border border-[#EAE3D2]/25 text-[10px] font-mono uppercase hover:border-[#B8965A] cursor-pointer"
                >
                  Free Explore
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-2.5">
            {(controlMode === "walk" || controlMode === "fly") && (
              <div className="sm:hidden">
                <TouchJoystick onChange={onTouchMove} />
              </div>
            )}

            {/* Free Exploration Mode Switcher */}
            <div className="pointer-events-auto bg-[#121311]/90 border border-[#EAE3D2]/25 p-1.5 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "orbit", label: "Orbit", icon: RotateCcw },
                    { id: "walk", label: "Walk", icon: Footprints },
                    { id: "fly", label: "Fly", icon: Wind },
                  ] as const
                ).map((cm) => {
                  const Icon = cm.icon;
                  const active = controlMode === cm.id;
                  return (
                    <button
                      key={cm.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChangeControlMode(cm.id)}
                      className={`px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 border cursor-pointer ${
                        active
                          ? "bg-[#B8965A] text-[#121311] border-[#B8965A]"
                          : "border-transparent text-[#EAE3D2]/80 hover:border-[#EAE3D2]/25"
                      }`}
                    >
                      <Icon className="w-3 h-3" aria-hidden="true" />
                      {cm.label}
                    </button>
                  );
                })}
              </div>
              {(controlMode === "walk" || controlMode === "fly") && (
                <p className="text-[10px] font-mono text-[#A49D8E] px-1">
                  WASD move · Drag look · Shift sprint {controlMode === "fly" ? "· Space/C height" : ""}
                </p>
              )}
            </div>

            <div className="hidden md:block">
              <CompassMinimap
                mode={mode}
                selectedDistrict={selectedDistrict}
                onSelectDistrict={onSelectDistrict}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Native Accessible Modal Dialogs (`modern-web-guidance` dialog pattern) */}
      <dialog
        ref={toursDialogRef}
        aria-labelledby="tours-dialog-title"
        closedby="any"
        className="m-auto w-[min(92vw,680px)] max-h-[82dvh] bg-[#121311] text-[#EAE3D2] border border-[#B8965A]/60 p-0 backdrop:bg-[#090A08]/80"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE3D2]/15 pb-3">
            <h2 id="tours-dialog-title" className="font-serif text-xl tracking-wide">
              Cinematic Guided Tours
            </h2>
            <button
              type="button"
              onClick={() => toursDialogRef.current?.close()}
              aria-label="Close guided tours"
              className="p-1.5 border border-[#EAE3D2]/20 hover:border-[#B8965A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {GUIDED_TOURS.map((tour) => (
              <button
                key={tour.id}
                type="button"
                onClick={() => {
                  onStartTour(tour);
                  toursDialogRef.current?.close();
                }}
                className="text-left p-3.5 border border-[#EAE3D2]/20 hover:border-[#B8965A] bg-[#191B18] space-y-1.5 cursor-pointer transition-colors"
              >
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#B8965A]">
                  Tour {tour.number} · {tour.stops.length} Stops
                </span>
                <h3 className="font-serif text-base text-[#EAE3D2]">{tour.title}</h3>
                <p className="text-xs text-[#A49D8E] leading-relaxed">{tour.subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      </dialog>

      <dialog
        ref={loreDialogRef}
        aria-labelledby="lore-dialog-title"
        closedby="any"
        className="m-auto w-[min(92vw,720px)] max-h-[84dvh] bg-[#121311] text-[#EAE3D2] border border-[#B8965A]/60 p-0 backdrop:bg-[#090A08]/80"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE3D2]/15 pb-3">
            <h2 id="lore-dialog-title" className="font-serif text-xl tracking-wide">
              Paradis Chronology & Architectural Ledger
            </h2>
            <button
              type="button"
              onClick={() => loreDialogRef.current?.close()}
              aria-label="Close lore dossier"
              className="p-1.5 border border-[#EAE3D2]/20 hover:border-[#B8965A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 max-h-[60dvh] overflow-y-auto pr-1">
            {LORE_ENTRIES.map((entry) => (
              <article key={entry.year} className="border-l-2 border-[#B8965A] pl-3.5 py-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase text-[#B8965A]">
                  <span>Year {entry.year}</span>
                  <span>·</span>
                  <span>{entry.era}</span>
                  <span>·</span>
                  <span className="text-[#A49D8E]">{entry.location}</span>
                </div>
                <h3 className="font-serif text-base text-[#EAE3D2]">{entry.title}</h3>
                <p className="text-xs text-[#EAE3D2]/85 leading-relaxed">{entry.summary}</p>
                <p className="text-[10px] font-mono text-[#A49D8E]">{entry.canonNote}</p>
              </article>
            ))}
            <div className="pt-3 border-t border-[#EAE3D2]/15 text-[11px] font-mono text-[#A49D8E] space-y-1">
              <p className="text-[#EAE3D2]">Asset Provenance & Scope Disclosure</p>
              <p>
                All binary `.glb` architecture (`house-timber-a/b`, `house-townhouse`, `yeager-house`, `wall-gatehouse`, `wall-cannon`, `bell-tower`, `market-wagon`, `odm-gear`) and procedural PBR normal/roughness/albedo maps are compiled from deterministic TypeScript/Node builders with `1 unit = 1 meter` scale accuracy. Canon locations distinguish reconstructed exteriors from explicitly attested canon details.
              </p>
            </div>
          </div>
        </div>
      </dialog>

      <dialog
        ref={settingsDialogRef}
        aria-labelledby="settings-dialog-title"
        closedby="any"
        className="m-auto w-[min(92vw,460px)] bg-[#121311] text-[#EAE3D2] border border-[#B8965A]/60 p-0 backdrop:bg-[#090A08]/80"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAE3D2]/15 pb-3">
            <h2 id="settings-dialog-title" className="font-serif text-lg tracking-wide flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#B8965A]" aria-hidden="true" />
              Atmosphere, Weather & Quality
            </h2>
            <button
              type="button"
              onClick={() => settingsDialogRef.current?.close()}
              aria-label="Close environment settings"
              className="p-1.5 border border-[#EAE3D2]/20 hover:border-[#B8965A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-mono uppercase text-[#B8965A] mb-1.5">Time of Day</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["morning", "midday", "sunset", "night"] as TimeOfDay[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={timeOfDay === t}
                    onClick={() => onChangeTimeOfDay(t)}
                    className={`py-1.5 text-[11px] font-mono uppercase border cursor-pointer ${
                      timeOfDay === t
                        ? "bg-[#B8965A] text-[#121311] border-[#B8965A]"
                        : "border-[#EAE3D2]/20 text-[#EAE3D2]/85 hover:border-[#B8965A]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase text-[#B8965A] mb-1.5">Weather</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["clear", "overcast", "rain", "storm"] as WeatherMode[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    aria-pressed={weather === w}
                    onClick={() => onChangeWeather(w)}
                    className={`py-1.5 text-[11px] font-mono uppercase border cursor-pointer ${
                      weather === w
                        ? "bg-[#3E5641] text-[#EAE3D2] border-[#EAE3D2]/40"
                        : "border-[#EAE3D2]/20 text-[#EAE3D2]/85 hover:border-[#B8965A]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase text-[#B8965A] mb-1.5">Graphics Preset</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(QUALITY_CONFIGS) as QualityPreset[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    aria-pressed={quality === q}
                    onClick={() => onChangeQuality(q)}
                    className={`py-1.5 px-2 text-left text-[11px] font-mono border cursor-pointer ${
                      quality === q
                        ? "bg-[#EAE3D2] text-[#121311] border-[#EAE3D2]"
                        : "border-[#EAE3D2]/20 text-[#EAE3D2]/85 hover:border-[#B8965A]"
                    }`}
                  >
                    {QUALITY_CONFIGS[q].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#EAE3D2]/12 flex items-center justify-between text-[10px] font-mono text-[#A49D8E]">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" aria-hidden="true" />
                {telemetry.calls} draw calls · {(telemetry.triangles / 1000).toFixed(1)}k tris
              </span>
              <span>DPR {telemetry.dpr.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};
