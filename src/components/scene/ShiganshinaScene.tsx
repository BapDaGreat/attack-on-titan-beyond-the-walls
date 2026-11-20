"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import {
  getCobblestoneTextures,
  getTimberTextures,
  getWallMasonryTextures,
  getWovenClothTextures,
} from "@/engine/textures";
import { localShiganshinaHeight, createSeededRng } from "@/engine/noise";
import { createChamferedBox } from "@/engine/geometryBuilders";
import { QualityPreset, QUALITY_CONFIGS, TimeOfDay } from "@/engine/environment";
import { GlbAsset } from "./GlbAsset";

interface ShiganshinaSceneProps {
  timeOfDay: TimeOfDay;
  quality: QualityPreset;
  reducedMotion: boolean;
  hideOverlays: boolean;
  onEnterYeagerHouse: () => void;
  onSelectLandmark?: (label: string, detail: string) => void;
}

interface HousePlacement {
  model: "houseTimberA" | "houseTimberB" | "houseTownhouse";
  pos: [number, number, number];
  rotY: number;
  scale: [number, number, number];
  plasterTint: string;
  roofStyle: "clay" | "slate";
}

/**
 * Flagship Phase 2 Environment: Shiganshina District (`1 unit = 1 meter`).
 * - Backed by the 50m Wall Maria gatehouse & masonry wings
 * - Radial cobblestone avenues, stone river canal with masonry arch bridge
 * - Varied half-timbered houses (`house-timber-a/b`, `house-townhouse`) + `bell-tower.glb`
 * - Walkable `yeager-house.glb` with flickering hearth light & cellar hatch
 * - Living animated NPCs, Garrison soldiers, market stalls, and horse wagon
 */
export const ShiganshinaScene: React.FC<ShiganshinaSceneProps> = ({
  timeOfDay,
  quality,
  reducedMotion,
  hideOverlays,
  onEnterYeagerHouse,
  onSelectLandmark,
}) => {
  const qCfg = QUALITY_CONFIGS[quality];
  const hearthLightRef = useRef<THREE.PointLight>(null);
  const lanternLightRef = useRef<THREE.PointLight>(null);
  const wagonGroupRef = useRef<THREE.Group>(null);
  const npcRefs = useRef<(THREE.Group | null)[]>([]);
  const wallWingGeo = useMemo(() => createChamferedBox(112, 50, 10.6, 0.25, 2, 0.08), []);

  // Ground terrain & road blend
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(460, 460, 120, 120);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const meadow = new THREE.Color("#4B5D38");
    const dirt = new THREE.Color("#6B5F4D");
    const canalBed = new THREE.Color("#2C352E");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = localShiganshinaHeight(x, z);
      pos.setY(i, y);

      if (y < -0.5) {
        tmp.copy(canalBed);
      } else {
        const onStreet = z <= 12 && Math.abs(x) < 105 ? 0.72 : Math.exp(-Math.pow(x / 8.5, 2)) * 0.85;
        tmp.copy(meadow).lerp(dirt, onStreet);
      }
      cols[i * 3] = tmp.r;
      cols[i * 3 + 1] = tmp.g;
      cols[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const materials = useMemo(() => {
    const cobble = getCobblestoneTextures(8);
    cobble.map.repeat.set(4, 24);
    cobble.normalMap.repeat.set(4, 24);
    cobble.roughnessMap.repeat.set(4, 24);

    const wallStone = getWallMasonryTextures(8);
    wallStone.map.repeat.set(4, 2);
    wallStone.normalMap.repeat.set(4, 2);
    wallStone.roughnessMap.repeat.set(4, 2);

    const awning = getWovenClothTextures("#8C3B2B", 4);
    const awningAlt = getWovenClothTextures("#405742", 4);
    const timber = getTimberTextures("oak", 4);

    return {
      cobble: new THREE.MeshStandardMaterial({
        map: cobble.map,
        normalMap: cobble.normalMap,
        roughnessMap: cobble.roughnessMap,
        roughness: 0.78,
      }),
      wallStone: new THREE.MeshStandardMaterial({
        map: wallStone.map,
        normalMap: wallStone.normalMap,
        roughnessMap: wallStone.roughnessMap,
        color: new THREE.Color("#B4AA99"),
        roughness: 0.86,
      }),
      awning: new THREE.MeshPhysicalMaterial({
        map: awning.map,
        normalMap: awning.normalMap,
        roughness: 0.88,
        sheen: 0.55,
        sheenColor: new THREE.Color("#C76E5A"),
        side: THREE.DoubleSide,
      }),
      awningAlt: new THREE.MeshPhysicalMaterial({
        map: awningAlt.map,
        normalMap: awningAlt.normalMap,
        roughness: 0.88,
        sheen: 0.55,
        sheenColor: new THREE.Color("#6D8B70"),
        side: THREE.DoubleSide,
      }),
      timber: new THREE.MeshStandardMaterial({
        map: timber.map,
        normalMap: timber.normalMap,
        roughness: 0.72,
      }),
    };
  }, []);

  // Deterministic varied urban housing placements (non-cloned tints, scales & orientations)
  const houses: HousePlacement[] = useMemo(
    () => [
      // West Avenue Row (between boulevard and canal)
      { model: "houseTimberA", pos: [-15.5, 0, -10], rotY: Math.PI / 2, scale: [1, 1, 1], plasterTint: "#DDD2BE", roofStyle: "clay" },
      { model: "houseTownhouse", pos: [-16.0, 0, -24], rotY: Math.PI / 2, scale: [0.98, 1.05, 0.96], plasterTint: "#D4C6AD", roofStyle: "slate" },
      { model: "houseTimberB", pos: [-15.5, 0, -52], rotY: Math.PI / 2, scale: [1.04, 1.0, 1.02], plasterTint: "#C9BDA6", roofStyle: "clay" },
      // West Across Canal (framing Yeager Residence)
      { model: "houseTimberB", pos: [-44, 0, -12], rotY: Math.PI / 2, scale: [1.02, 0.95, 1.0], plasterTint: "#D9CEB7", roofStyle: "clay" },
      { model: "houseTimberA", pos: [-45, 0, -26], rotY: Math.PI / 2, scale: [1.05, 1.08, 1.0], plasterTint: "#CFC2AC", roofStyle: "slate" },
      { model: "houseTownhouse", pos: [-42, 0, -44], rotY: 0, scale: [1.0, 1.02, 1.0], plasterTint: "#E0D6C3", roofStyle: "clay" },
      // East Avenue Row
      { model: "houseTownhouse", pos: [15.8, 0, -10], rotY: -Math.PI / 2, scale: [1, 1.06, 1], plasterTint: "#DFD5C0", roofStyle: "slate" },
      { model: "houseTimberA", pos: [15.5, 0, -24], rotY: -Math.PI / 2, scale: [1.02, 0.96, 1.0], plasterTint: "#CBBCA3", roofStyle: "clay" },
      { model: "houseTimberB", pos: [16.2, 0, -42], rotY: -Math.PI / 2, scale: [1.06, 1.04, 1.05], plasterTint: "#D5C9B2", roofStyle: "clay" },
      // East Outer District Blocks
      { model: "houseTimberA", pos: [34, 0, -8], rotY: 0, scale: [0.98, 1.0, 1.04], plasterTint: "#D2C4AA", roofStyle: "clay" },
      { model: "houseTimberB", pos: [38, 0, -34], rotY: -Math.PI / 2, scale: [1.08, 1.12, 1.0], plasterTint: "#DED4BF", roofStyle: "slate" },
      { model: "houseTownhouse", pos: [42, 0, -56], rotY: Math.PI, scale: [1.04, 1.0, 1.0], plasterTint: "#C9BDA6", roofStyle: "clay" },
      { model: "houseTimberA", pos: [-8, 0, -68], rotY: 0, scale: [1.1, 1.04, 1.0], plasterTint: "#DDD1BB", roofStyle: "slate" },
      { model: "houseTimberB", pos: [12, 0, -70], rotY: 0, scale: [1.05, 0.98, 1.0], plasterTint: "#D2C6B0", roofStyle: "clay" },
    ],
    []
  );

  // NPC Patrol & Stroll Routes
  const npcSpecs = useMemo(() => {
    const base = [
      { id: 0, route: "avenue", speed: 1.5, phase: 0.0, coat: "#3E5641", x: -4.2, z0: -6, z1: -55 },
      { id: 1, route: "avenue", speed: 1.3, phase: 1.8, coat: "#5C4738", x: 4.5, z0: -10, z1: -50 },
      { id: 2, route: "market", speed: 1.1, phase: 0.7, coat: "#7A523B", x: 9.2, z0: -12, z1: -34 },
      { id: 3, route: "parapet", speed: 1.4, phase: 2.3, coat: "#3B4A3D", y: 50.0, x0: -48, x1: 48, z: 16.5 },
      { id: 4, route: "parapet", speed: 1.4, phase: 5.1, coat: "#3B4A3D", y: 50.0, x0: 48, x1: -48, z: 16.5 },
      { id: 5, route: "canal", speed: 1.2, phase: 3.1, coat: "#6A5848", x: -19.5, z0: -14, z1: -44 },
    ];
    return base.slice(0, Math.max(2, Math.round(base.length * qCfg.npcDensity)));
  }, [qCfg.npcDensity]);

  // Scattered trees outside Wall Maria & inside district gardens
  const trees = useMemo(() => {
    const rng = createSeededRng(84599);
    const list: { pos: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 65; i++) {
      const x = (rng() - 0.5) * 260;
      const z = 34 + rng() * 140; // Beyond Wall Maria outer face
      if (Math.abs(x) < 10) continue; // Keep road clear
      list.push({ pos: [x, localShiganshinaHeight(x, z), z], scale: 0.85 + rng() * 0.75 });
    }
    // Inner courtyard trees near canal & Yeager home
    list.push({ pos: [-34, 0, -28], scale: 1.15 }, { pos: [-35, 0, -45], scale: 1.25 }, { pos: [26, 0, -42], scale: 1.1 });
    return list;
  }, []);

  const isEveningOrNight = timeOfDay === "sunset" || timeOfDay === "night";

  useFrame(({ clock }) => {
    const t = reducedMotion ? 0 : clock.elapsedTime;

    // Practical hearth flicker inside Yeager Residence
    if (hearthLightRef.current) {
      hearthLightRef.current.intensity = 6.5 + Math.sin(t * 7.2) * 0.7 + Math.sin(t * 13.1) * 0.4;
    }
    if (lanternLightRef.current) {
      lanternLightRef.current.intensity = isEveningOrNight ? 5.2 + Math.sin(t * 2.1) * 0.25 : 0.4;
    }

    // Moving Supply Wagon along radial avenue
    if (wagonGroupRef.current && !reducedMotion) {
      const zTravel = ((t * 2.2) % 88) - 68;
      wagonGroupRef.current.position.set(1.2, 0, zTravel);
    }

    // Living NPC walks
    npcRefs.current.forEach((grp, idx) => {
      const spec = npcSpecs[idx];
      if (!grp || !spec || reducedMotion) return;
      if (spec.route === "parapet") {
        const u = (Math.sin(t * 0.16 * spec.speed + spec.phase) + 1) * 0.5;
        const x = THREE.MathUtils.lerp(spec.x0!, spec.x1!, u);
        grp.position.set(x, spec.y!, spec.z);
        grp.rotation.y = Math.cos(t * 0.16 * spec.speed + spec.phase) > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        const u = (Math.sin(t * 0.22 * spec.speed + spec.phase) + 1) * 0.5;
        const z = THREE.MathUtils.lerp(spec.z0!, spec.z1!, u);
        grp.position.set(spec.x!, 0, z);
        grp.rotation.y = Math.cos(t * 0.22 * spec.speed + spec.phase) > 0 ? Math.PI : 0;
      }
      grp.position.y += Math.abs(Math.sin(t * 6.5 + spec.phase)) * 0.04;
    });
  });

  useEffect(() => {
    return () => {
      terrainGeo.dispose();
      wallWingGeo.dispose();
    };
  }, [terrainGeo, wallWingGeo]);

  return (
    <group name="shiganshina-district-1to1">
      {/* Ground Terrain */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Main Stone-Paved Radial Boulevard & Plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -28]} receiveShadow>
        <planeGeometry args={[17, 130]} />
        <primitive object={materials.cobble} attach="material" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-12, 0.035, -34]} receiveShadow>
        <planeGeometry args={[58, 12]} />
        <primitive object={materials.cobble} attach="material" />
      </mesh>

      {/* River Canal Water Plane + Stone Retaining Walls + Arched Masonry Bridge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-28, -0.55, -28]} receiveShadow>
        <planeGeometry args={[9.5, 118]} />
        <meshPhysicalMaterial
          color="#243C3E"
          roughness={0.14}
          metalness={0.15}
          clearcoat={0.85}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {/* Stone Canal Bridge connecting Boulevard to Yeager Residence */}
      <group position={[-28, 0, -34]}>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[11.6, 0.55, 5.2]} />
          <primitive object={materials.wallStone} attach="material" />
        </mesh>
        {[-2.3, 2.3].map((bz) => (
          <mesh key={bz} position={[0, 0.92, bz]} castShadow>
            <boxGeometry args={[11.4, 0.65, 0.35]} />
            <primitive object={materials.wallStone} attach="material" />
          </mesh>
        ))}
      </group>

      {/* 50m Wall Maria Gatehouse & Masonry Wings */}
      <GlbAsset model="wallGatehouse" position={[0, 0, 18]} />
      <mesh geometry={wallWingGeo} material={materials.wallStone} position={[-66, 25, 18]} castShadow receiveShadow />
      <mesh geometry={wallWingGeo} material={materials.wallStone} position={[66, 25, 18]} castShadow receiveShadow />

      {/* Wall-top Cannons */}
      {[-34, -18, 18, 34].map((cx) => (
        <GlbAsset key={cx} model="wallCannon" position={[cx, 50, 15.2]} rotation={[0, Math.PI, 0]} />
      ))}

      {/* District Bell Tower */}
      <GlbAsset model="bellTower" position={[27.5, 0, -18.5]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Half-Timbered Houses across Shiganshina */}
      {houses.map((h, i) => (
        <GlbAsset
          key={i}
          model={h.model}
          position={h.pos}
          rotation={[0, h.rotY, 0]}
          scale={h.scale}
          plasterTint={h.plasterTint}
          roofStyle={h.roofStyle}
        />
      ))}

      {/* Walkable Hero Landmark: Yeager Residence (x = -22, z = -38, facing +Z street) */}
      <group position={[-22, 0, -38]} name="yeager-residence">
        <GlbAsset model="yeagerHouse" position={[0, 0, 0]} />
        {/* Practical Warm Hearth Fireplace Ember Light & Dining Oil Lamp */}
        <pointLight
          ref={hearthLightRef}
          position={[-1.6, 1.3, -2.9]}
          color="#FF8E3C"
          intensity={6.5}
          distance={12}
          decay={2}
        />
        <mesh position={[-1.6, 0.45, -3.3]}>
          <sphereGeometry args={[0.32, 10, 8]} />
          <meshStandardMaterial color="#FF6A1A" emissive="#FF6A1A" emissiveIntensity={3.2} />
        </mesh>
        <mesh position={[1.2, 0.98, -0.4]}>
          <cylinderGeometry args={[0.09, 0.12, 0.24, 10]} />
          <meshStandardMaterial color="#FFD082" emissive="#FFB24D" emissiveIntensity={2.6} />
        </mesh>
      </group>

      {/* Market Square Stalls, Barrels, Lantern Posts & Moving Supply Wagon */}
      <group position={[9.2, 0, -18]}>
        {[0, -7, -14].map((dz, idx) => (
          <group key={dz} position={[0, 0, dz]}>
            <mesh position={[0, 1.35, 0]} rotation={[0, 0, 0.2]} material={idx % 2 === 0 ? materials.awning : materials.awningAlt} castShadow>
              <boxGeometry args={[2.8, 0.08, 3.6]} />
            </mesh>
            <mesh position={[0, 0.48, 0]} material={materials.timber} castShadow>
              <boxGeometry args={[1.4, 0.92, 3.0]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Street Lanterns */}
      {[-7.5, 7.5].map((lx) =>
        [-8, -26, -44].map((lz) => (
          <group key={`${lx}-${lz}`} position={[lx, 0, lz]}>
            <mesh position={[0, 2.0, 0]} material={materials.timber} castShadow>
              <cylinderGeometry args={[0.07, 0.1, 4.0, 8]} />
            </mesh>
            <mesh position={[0, 4.05, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial
                color="#FFD996"
                emissive="#FFAD42"
                emissiveIntensity={isEveningOrNight ? 2.4 : 0.25}
              />
            </mesh>
          </group>
        ))
      )}
      <pointLight
        ref={lanternLightRef}
        position={[0, 4.5, -24]}
        color="#FFB559"
        intensity={isEveningOrNight ? 5.2 : 0.4}
        distance={36}
        decay={2}
      />

      {/* Animated Horse-Drawn Supply Wagon */}
      <group ref={wagonGroupRef} position={[1.2, 0, -22]}>
        <GlbAsset model="marketWagon" position={[0, 0, 0]} />
        {/* Stylized Sculpted Draft Horse in harness */}
        <group position={[0, 0, 3.15]}>
          <mesh position={[0, 1.18, 0]} castShadow>
            <capsuleGeometry args={[0.38, 1.15, 6, 10]} />
            <meshStandardMaterial color="#593B27" roughness={0.78} />
          </mesh>
          <mesh position={[0, 1.58, 0.68]} rotation={[0.55, 0, 0]} castShadow>
            <capsuleGeometry args={[0.18, 0.55, 6, 8]} />
            <meshStandardMaterial color="#593B27" roughness={0.78} />
          </mesh>
          {[-0.22, 0.22].map((hx) =>
            [-0.45, 0.45].map((hz) => (
              <mesh key={`${hx}-${hz}`} position={[hx, 0.55, hz]} castShadow>
                <cylinderGeometry args={[0.08, 0.06, 1.1, 8]} />
                <meshStandardMaterial color="#4A3120" roughness={0.8} />
              </mesh>
            ))
          )}
        </group>
      </group>

      {/* Living Animated Civilians & Patrolling Garrison Soldiers */}
      {npcSpecs.map((npc, idx) => (
        <group
          key={npc.id}
          ref={(el) => {
            npcRefs.current[idx] = el;
          }}
          position={[npc.x ?? 0, npc.y ?? 0, npc.z ?? -20]}
        >
          <mesh position={[0, 0.82, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.85, 6, 10]} />
            <meshStandardMaterial color={npc.coat} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.54, 0]} castShadow>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshStandardMaterial color="#DFBA99" roughness={0.68} />
          </mesh>
        </group>
      ))}

      {/* Surrounding Outer Forest & Courtyard Trees (layered conifer canopies, not round balls) */}
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={t.scale}>
          <mesh position={[0, 3.0, 0]} material={materials.timber} castShadow>
            <cylinderGeometry args={[0.2, 0.38, 6.0, 8]} />
          </mesh>
          <mesh position={[0, 5.8, 0]} castShadow>
            <coneGeometry args={[2.5, 4.4, 8]} />
            <meshStandardMaterial color="#2D4527" roughness={0.92} />
          </mesh>
          <mesh position={[0, 7.8, 0]} castShadow>
            <coneGeometry args={[1.85, 3.8, 8]} />
            <meshStandardMaterial color="#38532F" roughness={0.92} />
          </mesh>
        </group>
      ))}

      {/* Interactive District Landmarks */}
      {!hideOverlays && (
        <>
          <Html position={[-22, 11.4, -33.5]} center zIndexRange={[1, 10]}>
            <button
              type="button"
              onClick={onEnterYeagerHouse}
              className="px-2 py-0.5 bg-[#121311]/92 border border-[#B8965A] text-[#EAE3D2] text-[10px] font-mono tracking-wide uppercase hover:bg-[#B8965A] hover:text-[#121311] transition-colors cursor-pointer whitespace-nowrap"
            >
              Yeager Residence
            </button>
          </Html>
          <Html position={[0, 19.5, 18]} center zIndexRange={[1, 10]}>
            <button
              type="button"
              onClick={() =>
                onSelectLandmark?.(
                  "Wall Maria Inner Gate",
                  "The 50-meter fortified portal shattered by the Armored Titan in Year 845."
                )
              }
              className="px-2 py-0.5 bg-[#121311]/85 border border-[#EAE3D2]/30 text-[#EAE3D2] text-[10px] font-mono tracking-wide uppercase hover:border-[#B8965A] cursor-pointer whitespace-nowrap"
            >
              Wall Maria Gate · 50 m
            </button>
          </Html>
        </>
      )}
    </group>
  );
};
