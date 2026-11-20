"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { ScaleSubjectSpec } from "@/data/scaleSubjects";
import { TITANS } from "@/data/titans";
import { CHARACTERS } from "@/data/characters";
import { getCobblestoneTextures, getWallMasonryTextures } from "@/engine/textures";
import { TitanModel3D } from "./TitanModel3D";
import { CharacterModel3D } from "./CharacterModel3D";
import { GlbAsset } from "./GlbAsset";

interface ScaleLabSceneProps {
  subjects: ScaleSubjectSpec[];
  silhouetteMode: boolean;
  xrayOverlay: boolean;
  showMetricGrid: boolean;
  hideOverlays: boolean;
  reducedMotion: boolean;
}

/**
 * Interactive 1:1 Meter Scale Comparison Laboratory (`1 unit = 1 meter`).
 * Places any chosen combination of humans, horses, houses, Titans, the 50m Wall Maria,
 * and Eren's Founding Titan side-by-side against laser-accurate metric height lines.
 */
export const ScaleLabScene: React.FC<ScaleLabSceneProps> = ({
  subjects,
  silhouetteMode,
  xrayOverlay,
  showMetricGrid,
  hideOverlays,
  reducedMotion,
}) => {
  const floorMat = useMemo(() => {
    const tex = getCobblestoneTextures(8);
    tex.map.repeat.set(185, 185);
    tex.normalMap.repeat.set(185, 185);
    tex.roughnessMap.repeat.set(185, 185);
    return new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      color: new THREE.Color("#736E64"),
      roughness: 0.88,
    });
  }, []);

  const wallMat = useMemo(() => {
    const tex = getWallMasonryTextures(8);
    tex.map.repeat.set(22, 3);
    tex.normalMap.repeat.set(22, 3);
    tex.roughnessMap.repeat.set(22, 3);
    return new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      color: new THREE.Color("#AEA594"),
      roughness: 0.88,
      transparent: xrayOverlay,
      opacity: xrayOverlay ? 0.32 : 1,
    });
  }, [xrayOverlay]);

  // Compute balanced horizontal slots so large & small subjects sit cleanly side-by-side
  const placements = useMemo(() => {
    const widths = subjects.map((s) => Math.max(2.6, s.widthHintMeters * 1.15));
    const totalW = widths.reduce((a, b) => a + b, 0) + Math.max(0, subjects.length - 1) * 4.5;
    let cursor = -totalW / 2;
    return subjects.map((s, idx) => {
      const w = widths[idx];
      const x = cursor + w / 2;
      cursor += w + 4.5;
      return { spec: s, x };
    });
  }, [subjects]);

  const maxH = useMemo(
    () => Math.max(52, ...subjects.map((s) => s.heightMeters)),
    [subjects]
  );

  const rulerTicks = useMemo(() => {
    const marks = [1.7, 5, 10, 15, 25, 40, 50, 60, 100, 150, 200, 240];
    return marks.filter((m) => m <= maxH + 15);
  }, [maxH]);

  const erenChar = CHARACTERS[0];
  const civilianSpec = useMemo(
    () => ({
      ...CHARACTERS[2],
      id: "eren" as const,
      name: "Average Human",
      heightMeters: 1.7,
      visual: {
        ...CHARACTERS[2].visual,
        hairHex: "#4E3A2B",
        jacketHex: "#7A7265",
        cloakHex: null,
        hasOdm: false,
        buildScale: 1.0,
        pose: "calm-stand" as const,
      },
    }),
    []
  );

  return (
    <group name="scale-comparison-lab">
      {/* Ground Plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={floorMat} receiveShadow>
        <planeGeometry args={[900, 900]} />
      </mesh>

      {/* Distant 50m Wall Maria Reference Backdrop (`z = -38`) */}
      <mesh position={[0, 25, -42]} material={wallMat} receiveShadow castShadow>
        <boxGeometry args={[420, 50, 10]} />
      </mesh>

      {/* Metric Horizontal Measurement Lines & Ruler Gantry */}
      {showMetricGrid && (
        <group position={[0, 0, -14]}>
          {rulerTicks.map((m) => (
            <group key={m} position={[0, m, 0]}>
              <mesh>
                <boxGeometry args={[180, m >= 50 ? 0.14 : 0.05, 0.05]} />
                <meshBasicMaterial
                  color={m === 50 ? "#9E2B25" : m === 1.7 ? "#3E5641" : "#B8965A"}
                  transparent
                  opacity={m === 50 ? 0.85 : 0.52}
                />
              </mesh>
              {!hideOverlays && (
                <Html position={[-38, 0, 0]} center zIndexRange={[1, 10]}>
                  <div className="px-1.5 py-0.5 bg-[#121311]/90 border border-[#B8965A]/45 text-[#EAE3D2] text-[10px] font-mono whitespace-nowrap">
                    {m} m
                  </div>
                </Html>
              )}
            </group>
          ))}
        </group>
      )}

      {/* Render Each Selected Comparison Subject at Exact 1:1 Meter Scale */}
      {placements.map(({ spec, x }) => {
        const titanSpec = spec.titanId
          ? TITANS.find((t) => t.id === spec.titanId)
          : undefined;

        return (
          <group key={spec.id} position={[x, 0, 0]}>
            {spec.kind === "human" && (
              <CharacterModel3D
                character={civilianSpec}
                silhouetteOnly={silhouetteMode}
                animateIdle={!reducedMotion}
              />
            )}

            {spec.kind === "eren-human" && (
              <CharacterModel3D
                character={erenChar}
                silhouetteOnly={silhouetteMode}
                animateIdle={!reducedMotion}
              />
            )}

            {spec.kind === "horse" && (
              <group>
                <mesh position={[0, 1.25, 0]} castShadow>
                  <capsuleGeometry args={[0.42, 1.25, 6, 12]} />
                  <meshStandardMaterial color={silhouetteMode ? "#1A1C1A" : "#5D3E29"} roughness={0.78} />
                </mesh>
                <mesh position={[0, 1.78, 0.72]} rotation={[0.45, 0, 0]} castShadow>
                  <capsuleGeometry args={[0.19, 0.62, 6, 8]} />
                  <meshStandardMaterial color={silhouetteMode ? "#1A1C1A" : "#5D3E29"} roughness={0.78} />
                </mesh>
                {[-0.24, 0.24].map((hx) =>
                  [-0.48, 0.48].map((hz) => (
                    <mesh key={`${hx}-${hz}`} position={[hx, 0.56, hz]} castShadow>
                      <cylinderGeometry args={[0.08, 0.06, 1.12, 8]} />
                      <meshStandardMaterial color={silhouetteMode ? "#1A1C1A" : "#4A301F"} roughness={0.8} />
                    </mesh>
                  ))
                )}
              </group>
            )}

            {spec.kind === "building" && <GlbAsset model="houseTownhouse" />}

            {spec.kind === "wall" && (
              <mesh position={[0, 25, 0]} material={wallMat} castShadow receiveShadow>
                <boxGeometry args={[12, 50, 10]} />
              </mesh>
            )}

            {spec.kind === "titan" && titanSpec && (
              <TitanModel3D
                titan={titanSpec}
                heightMeters={spec.heightMeters}
                silhouetteOnly={silhouetteMode}
                xrayMode={xrayOverlay}
                animateIdle={!reducedMotion}
                emitSteam={!silhouetteMode}
              />
            )}

            {spec.kind === "founding-doomsday" && (
              <TitanModel3D
                titan={TITANS[0]}
                heightMeters={spec.heightMeters}
                silhouetteOnly={silhouetteMode}
                xrayMode={xrayOverlay}
                doomsdayMode
                animateIdle={false}
                emitSteam={false}
              />
            )}

            {!hideOverlays && (
              <Html
                position={[0, spec.heightMeters + Math.max(0.8, spec.heightMeters * 0.05), 0]}
                center
                zIndexRange={[1, 10]}
              >
                <div className="px-2 py-0.5 bg-[#121311]/92 border border-[#B8965A]/75 text-[#EAE3D2] text-[10px] font-mono whitespace-nowrap">
                  {spec.label} · {spec.heightMeters.toFixed(1)} m
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
