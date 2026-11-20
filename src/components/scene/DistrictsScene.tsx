"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { DistrictSpec } from "@/data/world";
import { getCobblestoneTextures, getWallMasonryTextures } from "@/engine/textures";
import { createChamferedBox } from "@/engine/geometryBuilders";
import { GlbAsset } from "./GlbAsset";

interface DistrictsSceneProps {
  district: DistrictSpec;
  hideOverlays: boolean;
}

/**
 * Multi-District Architectural Showcase (`1 unit = 1 meter`).
 * Adapts landmark composition, street pavers, architecture styles, and iconic focal structures
 * for Trost (Boulder Monument), Stohess (Cathedral Plaza), Mitras (Royal Citadel),
 * Orvud (Artillery Ramparts), Karanes, Utopia, Ehrmich, and Survey Corps HQ.
 */
export const DistrictsScene: React.FC<DistrictsSceneProps> = ({ district, hideOverlays }) => {
  const cobbleMat = useMemo(() => {
    const tex = getCobblestoneTextures(8);
    tex.map.repeat.set(8, 12);
    tex.normalMap.repeat.set(8, 12);
    tex.roughnessMap.repeat.set(8, 12);
    return new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      color:
        district.biome === "noble-spire" || district.biome === "royal-citadel"
          ? new THREE.Color("#D4CFC6")
          : new THREE.Color("#B4ADA0"),
      roughness: 0.72,
    });
  }, [district.biome]);

  const stoneMat = useMemo(() => {
    const tex = getWallMasonryTextures(8);
    return new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      color:
        district.biome === "royal-citadel"
          ? new THREE.Color("#DCD6C8")
          : district.biome === "highland-fort"
          ? new THREE.Color("#9A9792")
          : new THREE.Color("#B0A798"),
      roughness: 0.84,
    });
  }, [district.biome]);

  const wingGeo = useMemo(() => createChamferedBox(105, 50, 10.6, 0.25, 2, 0.08), []);

  const isAlpine = district.id === "utopia" || district.id === "orvud";
  const isCitadel = district.biome === "royal-citadel" || district.biome === "noble-spire";
  const isKeep = district.biome === "ruined-keep";

  return (
    <group name={`district-${district.id}`}>
      {/* Ground Terrain Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial
          color={isAlpine ? "#6E756F" : isCitadel ? "#4E5B3D" : "#4A5938"}
          roughness={0.94}
        />
      </mesh>

      {/* Grand Central Plaza & Avenue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -16]} material={cobbleMat} receiveShadow>
        <planeGeometry args={[36, 98]} />
      </mesh>

      {/* Wall Backdrop (when District sits on Maria/Rose/Sina) */}
      {district.wallHeightMeters > 0 && (
        <group position={[0, 0, 26]}>
          <GlbAsset model="wallGatehouse" position={[0, 0, 0]} />
          <mesh geometry={wingGeo} material={stoneMat} position={[-64, 25, 0]} castShadow receiveShadow />
          <mesh geometry={wingGeo} material={stoneMat} position={[64, 25, 0]} castShadow receiveShadow />
          {[-26, 26].map((cx) => (
            <GlbAsset key={cx} model="wallCannon" position={[cx, 50, -2.5]} rotation={[0, Math.PI, 0]} />
          ))}
        </group>
      )}

      {/* District-Specific Hero Monument / Focal Structure */}
      {district.id === "trost" && (
        <group position={[0, 0, 22]}>
          {/* Iconic Massive Limestone Boulder sealing Trost Gate */}
          <mesh position={[0, 6.2, -1.5]} castShadow receiveShadow>
            <dodecahedronGeometry args={[7.4, 2]} />
            <meshStandardMaterial
              map={stoneMat.map}
              normalMap={stoneMat.normalMap}
              color="#A59D8F"
              roughness={0.92}
            />
          </mesh>
        </group>
      )}

      {district.id === "stohess" && (
        <group position={[0, 0, -48]}>
          {/* Gothic Stohess Cathedral Spire overlooking Noble Plaza */}
          <GlbAsset model="bellTower" position={[0, 0, 0]} scale={[1.35, 1.25, 1.35]} />
          <mesh position={[0, 6.5, 6]} material={stoneMat} castShadow receiveShadow>
            <boxGeometry args={[18, 13, 12]} />
          </mesh>
        </group>
      )}

      {district.id === "mitras" && (
        <group position={[0, 0, -46]}>
          {/* Mitras Royal Citadel Stepped Basilica & Dome */}
          <mesh position={[0, 1.2, 8]} material={stoneMat} castShadow receiveShadow>
            <boxGeometry args={[32, 2.4, 20]} />
          </mesh>
          <mesh position={[0, 9.5, 0]} material={stoneMat} castShadow receiveShadow>
            <boxGeometry args={[24, 15, 16]} />
          </mesh>
          <mesh position={[0, 20, 0]} castShadow>
            <sphereGeometry args={[7.2, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color="#3E5641" roughness={0.48} metalness={0.25} />
          </mesh>
          <GlbAsset model="bellTower" position={[-14, 0, 2]} scale={[0.9, 1.1, 0.9]} />
          <GlbAsset model="bellTower" position={[14, 0, 2]} scale={[0.9, 1.1, 0.9]} />
        </group>
      )}

      {isKeep && (
        <group position={[0, 0, -28]}>
          {/* Survey Corps Old Castle HQ / Utgard Ruined Keep */}
          <mesh position={[0, 12, 0]} material={stoneMat} castShadow receiveShadow>
            <cylinderGeometry args={[7.2, 8.0, 24, 16]} />
          </mesh>
          <mesh position={[0, 25.2, 0]} material={stoneMat} castShadow>
            <cylinderGeometry args={[7.8, 7.6, 2.4, 16]} />
          </mesh>
          {[-11, 11].map((tx) => (
            <mesh key={tx} position={[tx, 9, 8]} material={stoneMat} castShadow receiveShadow>
              <cylinderGeometry args={[3.4, 3.8, 18, 12]} />
            </mesh>
          ))}
        </group>
      )}

      {/* Flanking District Half-Timbered / Stone Townhouses */}
      {[-19, 19].map((xSide) =>
        [-4, -18, -32].map((zPos, i) => (
          <GlbAsset
            key={`${xSide}-${zPos}`}
            model={isCitadel ? "houseTownhouse" : i % 2 === 0 ? "houseTimberA" : "houseTimberB"}
            position={[xSide, 0, zPos]}
            rotation={[0, xSide < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
            plasterTint={isCitadel ? "#E8E2D5" : isAlpine ? "#CFC9BE" : "#D6CBB4"}
            roofStyle={isCitadel || isAlpine ? "slate" : "clay"}
          />
        ))
      )}

      {/* Market Wagon Staging */}
      <GlbAsset model="marketWagon" position={[-6.5, 0, 4]} rotation={[0, 0.25, 0]} />

      {!hideOverlays && (
        <Html position={[0, 16, -24]} center distanceFactor={95} zIndexRange={[1, 10]}>
          <div className="px-3 py-1.5 bg-[#121311]/90 border border-[#B8965A] text-[#EAE3D2] text-xs font-mono tracking-wider uppercase whitespace-nowrap">
            {district.name} · Wall {district.wall}
          </div>
        </Html>
      )}
    </group>
  );
};
