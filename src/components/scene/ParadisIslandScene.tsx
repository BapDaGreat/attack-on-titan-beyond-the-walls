"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { DISTRICTS, DistrictSpec, WALL_SPECS } from "@/data/world";
import { fbm2D, paradisMacroHeight, smoothstep, createSeededRng } from "@/engine/noise";
import { OCEAN_FRAG, OCEAN_VERT } from "@/engine/shaders";
import { TIME_PRESETS, TimeOfDay, sunVectorFromAngles } from "@/engine/environment";
import { getWallMasonryTextures } from "@/engine/textures";

interface ParadisIslandSceneProps {
  timeOfDay: TimeOfDay;
  selectedDistrictId: string;
  onSelectDistrict: (district: DistrictSpec) => void;
  reducedMotion: boolean;
  hideOverlays: boolean;
}

/**
 * Strategic Macro 3D World of Paradis Island (`1 unit = 1 km`).
 * Features domain-warped terrain with slope/moisture vertex coloration,
 * Gerstner deep-water ocean surrounding the coast, all three concentric 50m Wall rings
 * (Maria, Rose, Sina) with protruding salient districts, forests, and interactive pins.
 */
export const ParadisIslandScene: React.FC<ParadisIslandSceneProps> = ({
  timeOfDay,
  selectedDistrictId,
  onSelectDistrict,
  reducedMotion,
  hideOverlays,
}) => {
  const oceanMatRef = useRef<THREE.ShaderMaterial>(null);
  const forestRef = useRef<THREE.InstancedMesh>(null);

  // Domain-warped Paradis Island high-res vertex-colored terrain mesh
  const terrainGeo = useMemo(() => {
    const size = 560;
    const segs = 210;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, paradisMacroHeight(x, z));
    }
    geo.computeVertexNormals();

    // Slope + moisture + altitude procedural ground coloration (`threejs-landscape` recipe)
    const norm = geo.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const colGrass = new THREE.Color("#455A38");
    const colMeadow = new THREE.Color("#637043");
    const colRock = new THREE.Color("#5D584F");
    const colSand = new THREE.Color("#B4A281");
    const colSnow = new THREE.Color("#C9D1D4");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ny = norm.getY(i);
      const slope = 1 - ny;

      const noiseTint = fbm2D(x * 0.03, z * 0.03, 2) * 0.5 + 0.5;
      const moist = smoothstep(-1, 14, 14 - y);

      tmp.copy(colGrass).lerp(colMeadow, noiseTint * 0.65 + (1 - moist) * 0.35);
      tmp.lerp(colRock, smoothstep(0.14, 0.36, slope));
      if (y < 1.2) {
        tmp.lerp(colSand, smoothstep(1.2, -0.6, y));
      }
      if (y > 23) {
        tmp.lerp(colSnow, smoothstep(23, 32, y) * (1 - slope * 1.4));
      }
      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Ocean uniforms
  const oceanUniforms = useMemo(() => {
    const preset = TIME_PRESETS[timeOfDay];
    return {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector2(0.75, 0.65).normalize() },
      uWaveScale: { value: 0.25 }, // Km-scale coastal ripples instead of giant horizon stripes
      uSunDir: { value: sunVectorFromAngles(preset.sunElevationDeg, preset.sunAzimuthDeg, 1).normalize() },
      uSunColor: { value: preset.sunColor.clone() },
      uHorizonColor: { value: preset.skyStops[1].clone() },
      uZenithColor: { value: preset.skyStops[4].clone() },
      uDeepColor: { value: new THREE.Color(0.012, 0.042, 0.062) },
      uScatterColor: { value: new THREE.Color(0.04, 0.24, 0.22) },
      uSunGlow: { value: preset.sunGlow },
    };
  }, []);

  // Concentric Wall Ring Geometries resting directly on terrain elevation
  const wallMaterial = useMemo(() => {
    const tex = getWallMasonryTextures(4);
    return new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      color: new THREE.Color("#C9BFA9"),
      roughness: 0.85,
      metalness: 0.02,
    });
  }, []);

  const wallMeshes = useMemo(() => {
    return WALL_SPECS.map((w) => {
      const segs = 160;
      const geo = new THREE.CylinderGeometry(w.macroRadiusUnits, w.macroRadiusUnits + 1.0, 5.2, segs, 1, true);
      // Sample terrain underneath each vertex so the concentric wall hugs Paradis relief cleanly
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ground = Math.max(0.5, paradisMacroHeight(x, z));
        pos.setY(i, y > 0 ? ground + 4.4 : ground - 1.5);
      }
      geo.computeVertexNormals();
      return { spec: w, geo };
    });
  }, []);

  // Instanced Forest Canopies (multi-hue conifer & woodland stands)
  const treeInstances = useMemo(() => {
    const rng = createSeededRng(74301);
    const mats: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const dummy = new THREE.Object3D();
    const palette = [new THREE.Color("#2A4225"), new THREE.Color("#36512B"), new THREE.Color("#425A30")];
    for (let i = 0; i < 1600; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = 16 + Math.pow(rng(), 0.78) * 168;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      const h = paradisMacroHeight(x, z);
      if (h < 1.2 || h > 21) continue;
      const d = Math.hypot(x, z);
      if (Math.abs(d - 165) < 4.5 || Math.abs(d - 126) < 4.5 || Math.abs(d - 82) < 4.5) continue;

      const s = 0.52 + rng() * 0.68;
      dummy.position.set(x, h + 1.4 * s, z);
      dummy.scale.set(s * 0.9, s * (1.4 + rng() * 0.6), s * 0.9);
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
      cols.push(palette[Math.floor(rng() * palette.length)]);
    }
    return { mats, cols };
  }, []);

  useEffect(() => {
    if (!forestRef.current) return;
    treeInstances.mats.forEach((m, i) => {
      forestRef.current!.setMatrixAt(i, m);
      forestRef.current!.setColorAt(i, treeInstances.cols[i]);
    });
    forestRef.current.instanceMatrix.needsUpdate = true;
    if (forestRef.current.instanceColor) forestRef.current.instanceColor.needsUpdate = true;
  }, [treeInstances]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const preset = TIME_PRESETS[timeOfDay];

    if (oceanMatRef.current) {
      const u = oceanMatRef.current.uniforms;
      if (!reducedMotion) u.uTime.value += dt * 1.1;
      u.uSunDir.value.copy(sunVectorFromAngles(preset.sunElevationDeg, preset.sunAzimuthDeg, 1)).normalize();
      u.uSunColor.value.lerp(preset.sunColor, 0.12);
      u.uHorizonColor.value.lerp(preset.skyStops[1], 0.12);
      u.uZenithColor.value.lerp(preset.skyStops[4], 0.12);
      u.uSunGlow.value = THREE.MathUtils.lerp(u.uSunGlow.value, preset.sunGlow, 0.12);
    }
  });

  useEffect(() => {
    return () => {
      terrainGeo.dispose();
      wallMeshes.forEach((w) => w.geo.dispose());
    };
  }, [terrainGeo, wallMeshes]);

  return (
    <group name="paradis-macro-world">
      {/* Gerstner Deep-Water Paradis Ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[2800, 2800, 180, 180]} />
        <shaderMaterial
          ref={oceanMatRef}
          vertexShader={OCEAN_VERT}
          fragmentShader={OCEAN_FRAG}
          uniforms={oceanUniforms}
        />
      </mesh>

      {/* Paradis Island Terrain Relief */}
      <mesh geometry={terrainGeo} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.9} metalness={0.02} />
      </mesh>

      {/* Three Concentric Walls (Maria, Rose, Sina) */}
      {wallMeshes.map(({ spec, geo }) => (
        <mesh key={spec.id} geometry={geo} material={wallMaterial} castShadow receiveShadow>
          <meshStandardMaterial
            map={wallMaterial.map}
            normalMap={wallMaterial.normalMap}
            roughnessMap={wallMaterial.roughnessMap}
            color="#C9BFA9"
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Instanced Conifer & Woodland Canopies */}
      <instancedMesh
        ref={forestRef}
        args={[undefined, undefined, treeInstances.mats.length]}
        castShadow
        receiveShadow
      >
        <coneGeometry args={[1.25, 3.2, 6]} />
        <meshStandardMaterial roughness={0.92} />
      </instancedMesh>

      {/* Interactive District Beacons & Salient Outposts */}
      {DISTRICTS.map((dist) => {
        const y = Math.max(1.5, paradisMacroHeight(dist.macroPos[0], dist.macroPos[2]));
        const isSelected = dist.id === selectedDistrictId;
        return (
          <group key={dist.id} position={[dist.macroPos[0], y, dist.macroPos[2]]}>
            {/* Stone salient outpost base */}
            <mesh position={[0, 1.5, 0]} castShadow receiveShadow onClick={() => onSelectDistrict(dist)}>
              <cylinderGeometry args={[4.4, 5.2, 3.8, 12]} />
              <meshStandardMaterial
                color={isSelected ? "#B8965A" : "#A69E8E"}
                roughness={0.8}
              />
            </mesh>
            {/* Interactive Brass Survey Pillar */}
            <mesh position={[0, 5.5, 0]} onClick={() => onSelectDistrict(dist)}>
              <cylinderGeometry args={[0.28, 0.48, 6.2, 8]} />
              <meshStandardMaterial
                color={isSelected ? "#D7AF69" : "#9E2B25"}
                emissive={isSelected ? "#B8965A" : "#5A1815"}
                emissiveIntensity={isSelected ? 0.9 : 0.35}
                roughness={0.35}
              />
            </mesh>

            {!hideOverlays && (
              <Html position={[0, 10.5, 0]} center distanceFactor={165} zIndexRange={[1, 10]}>
                <button
                  type="button"
                  onClick={() => onSelectDistrict(dist)}
                  className={`px-2.5 py-1 text-[11px] font-mono tracking-wider uppercase border transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#121311]/95 text-[#EAE3D2] border-[#B8965A]"
                      : "bg-[#121311]/80 text-[#EAE3D2]/85 border-[#EAE3D2]/25 hover:border-[#B8965A]"
                  }`}
                >
                  {dist.name}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
