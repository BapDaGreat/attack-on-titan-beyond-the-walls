"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { TITANS } from "@/data/titans";
import { createSeededRng, fbm2D } from "@/engine/noise";
import { createSweptLimbGeometry } from "@/engine/geometryBuilders";
import { getFoliageLeafTexture, getTimberTextures, getWallMasonryTextures } from "@/engine/textures";
import { QualityPreset, QUALITY_CONFIGS, TimeOfDay, TIME_PRESETS, sunVectorFromAngles } from "@/engine/environment";
import { TitanModel3D } from "./TitanModel3D";

interface BeyondTheWallsSceneProps {
  timeOfDay: TimeOfDay;
  quality: QualityPreset;
  reducedMotion: boolean;
  hideOverlays: boolean;
}

/**
 * Exterior Territory Beyond the Walls (`1 unit = 1 meter`).
 * - Forest of Giant Trees: 70m–80m towering hardwood trunks with root flares & wide canopies
 * - Volumetric Crepuscular Sky Rays (`3d-sky-rays` aesthetic aligned to sun vector)
 * - Instanced Tumbling Autumn/Forest Leaves (`3d-falling-leaves`)
 * - Utgard Ruined Watchtower & Roaming Pure / Abnormal Titans in the mist
 */
export const BeyondTheWallsScene: React.FC<BeyondTheWallsSceneProps> = ({
  timeOfDay,
  quality,
  reducedMotion,
  hideOverlays,
}) => {
  const qCfg = QUALITY_CONFIGS[quality];
  const leavesRef = useRef<THREE.InstancedMesh>(null);
  const raysRef = useRef<THREE.Group>(null);

  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(420, 420, 110, 110);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const moss = new THREE.Color("#2D3D24");
    const soil = new THREE.Color("#493D2D");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = fbm2D(x * 0.015, z * 0.015, 3) * 4.5 + Math.exp(-Math.pow(x / 18, 2)) * -0.5;
      pos.setY(i, h);
      const path = Math.exp(-Math.pow(x / 11, 2));
      tmp.copy(moss).lerp(soil, path * 0.72);
      cols[i * 3] = tmp.r;
      cols[i * 3 + 1] = tmp.g;
      cols[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Swept Giant Tree Trunk Geometry (75m tall with buttress root flare — `3d-high-poly-models`)
  const giantTrunkGeo = useMemo(() => {
    const trunk = createSweptLimbGeometry(
      76,
      [
        { t: 0.0, rx: 2.3, rz: 2.3 },
        { t: 0.2, rx: 2.45, rz: 2.5 },
        { t: 0.55, rx: 2.8, rz: 2.85 },
        { t: 0.88, rx: 3.4, rz: 3.5 },
        { t: 0.96, rx: 4.9, rz: 4.8 },
        { t: 1.0, rx: 6.2, rz: 6.1 },
      ],
      18
    );
    trunk.translate(0, 76, 0);
    return trunk;
  }, []);

  const materials = useMemo(() => {
    const bark = getTimberTextures("dark-beam", 6);
    bark.map.repeat.set(3, 18);
    bark.normalMap.repeat.set(3, 18);

    const leafTex = getFoliageLeafTexture();
    const stone = getWallMasonryTextures(6);

    return {
      bark: new THREE.MeshStandardMaterial({
        map: bark.map,
        normalMap: bark.normalMap,
        color: new THREE.Color("#4B3A2C"),
        roughness: 0.92,
      }),
      leafCard: new THREE.MeshStandardMaterial({
        map: leafTex,
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.82,
      }),
      ruinStone: new THREE.MeshStandardMaterial({
        map: stone.map,
        normalMap: stone.normalMap,
        roughnessMap: stone.roughnessMap,
        color: new THREE.Color("#7B766B"),
        roughness: 0.9,
      }),
    };
  }, []);

  // Giant Tree Positions forming an expedition avenue
  const giantTrees = useMemo(() => {
    const rng = createSeededRng(57085);
    const list: { pos: [number, number, number]; scale: number; rot: number }[] = [];
    for (let i = 0; i < 28; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (16 + rng() * 58);
      const z = -95 + Math.floor(i / 2) * 14 + (rng() - 0.5) * 6;
      const y = fbm2D(x * 0.015, z * 0.015, 3) * 4.5 - 1.2;
      list.push({ pos: [x, y, z], scale: 0.85 + rng() * 0.3, rot: rng() * Math.PI * 2 });
    }
    return list;
  }, []);

  // Instanced Tumbling Forest Leaves (`3d-falling-leaves`)
  const leafSeeds = useMemo(() => {
    const count = Math.round(280 * qCfg.foliageDensity);
    const rng = createSeededRng(3301);
    return Array.from({ length: count }, () => ({
      x: (rng() - 0.5) * 84,
      y: 2 + rng() * 48,
      z: (rng() - 0.5) * 90,
      speedY: 1.1 + rng() * 1.4,
      phase: rng() * Math.PI * 2,
      scale: 0.28 + rng() * 0.32,
    }));
  }, [qCfg.foliageDensity]);

  const dummyLeaf = useMemo(() => new THREE.Object3D(), []);
  const pureTitan = useMemo(() => TITANS.find((t) => t.id === "pure-7m")!, []);
  const abnormalTitan = useMemo(() => TITANS.find((t) => t.id === "abnormal-12m")!, []);

  // Soft vertical-and-radial faded sunbeam shader (`3d-sky-rays` aesthetic without hard cone lines)
  const rayMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color("#FFE9C2") },
          uOpacity: { value: 0.14 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vViewPos = -mv.xyz;
            vNormalView = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          void main() {
            float fresnel = pow(abs(dot(normalize(vNormalView), normalize(vViewPos))), 2.2);
            float vFade = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
            float alpha = fresnel * vFade * uOpacity;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = reducedMotion ? 1.4 : clock.elapsedTime;
    if (leavesRef.current) {
      leafSeeds.forEach((l, i) => {
        const y = ((l.y - t * l.speedY) % 48 + 48) % 48 + 0.5;
        const x = l.x + Math.sin(t * 0.9 + l.phase) * 2.5;
        dummyLeaf.position.set(x, y, l.z);
        dummyLeaf.rotation.set(t * 1.4 + l.phase, t * 0.9, l.phase);
        dummyLeaf.scale.setScalar(l.scale);
        dummyLeaf.updateMatrix();
        leavesRef.current!.setMatrixAt(i, dummyLeaf.matrix);
      });
      leavesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (raysRef.current) {
      const preset = TIME_PRESETS[timeOfDay];
      const sunVec = sunVectorFromAngles(preset.sunElevationDeg, preset.sunAzimuthDeg, 1).normalize();
      raysRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunVec);
      rayMaterial.uniforms.uColor.value.set(
        timeOfDay === "sunset" ? "#FFAD6B" : timeOfDay === "night" ? "#7EA0CC" : "#FFF1D0"
      );
      rayMaterial.uniforms.uOpacity.value = timeOfDay === "night" ? 0.05 : 0.14;
    }
  });

  useEffect(() => {
    return () => {
      terrainGeo.dispose();
      giantTrunkGeo.dispose();
      rayMaterial.dispose();
    };
  }, [terrainGeo, giantTrunkGeo, rayMaterial]);

  return (
    <group name="beyond-the-walls-forest">
      {/* Forest Floor */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.94} />
      </mesh>

      {/* 80m Giant Trees */}
      {giantTrees.map((gt, idx) => (
        <group key={idx} position={gt.pos} rotation={[0, gt.rot, 0]} scale={gt.scale}>
          <mesh geometry={giantTrunkGeo} material={materials.bark} castShadow receiveShadow />
          {/* High canopy foliage crown at 65m–80m */}
          <mesh position={[0, 72, 0]} material={materials.leafCard} castShadow>
            <dodecahedronGeometry args={[14.5, 1]} />
          </mesh>
          <mesh position={[6.5, 64, -3]} material={materials.leafCard} castShadow>
            <dodecahedronGeometry args={[10.5, 1]} />
          </mesh>
          <mesh position={[-6.0, 62, 4]} material={materials.leafCard} castShadow>
            <dodecahedronGeometry args={[9.5, 1]} />
          </mesh>
        </group>
      ))}

      {/* Soft Edge-Faded Volumetric Sun Shafts Piercing Canopy Gaps (`3d-sky-rays`) */}
      <group ref={raysRef} position={[0, 38, -10]}>
        {[-12, 4, 18].map((rx, idx) => (
          <mesh key={idx} position={[rx, 0, idx * -14]} material={rayMaterial}>
            <cylinderGeometry args={[3.8, 12.5, 92, 20, 1, true]} />
          </mesh>
        ))}
      </group>

      {/* Instanced Tumbling Leaves with real alpha-tested leaf sprites */}
      <instancedMesh ref={leavesRef} args={[undefined, undefined, leafSeeds.length]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshStandardMaterial
          map={materials.leafCard.map}
          alphaTest={0.35}
          color="#9E8248"
          side={THREE.DoubleSide}
          roughness={0.85}
        />
      </instancedMesh>

      {/* Utgard Ruined Watchtower Keep */}
      <group position={[22, -1, -68]}>
        <mesh position={[0, 13, 0]} material={materials.ruinStone} castShadow receiveShadow>
          <cylinderGeometry args={[6.2, 7.2, 26, 14]} />
        </mesh>
        <mesh position={[0, 26.8, 0]} material={materials.ruinStone} castShadow>
          <cylinderGeometry args={[6.8, 6.4, 2.2, 14]} />
        </mesh>
      </group>

      {/* Stalking Pure & Abnormal Titans among the Giant Trees */}
      <TitanModel3D titan={pureTitan} position={[-8, -0.4, -32]} rotationY={0.4} heightMeters={7} />
      <TitanModel3D titan={abnormalTitan} position={[8.5, -0.4, -52]} rotationY={-0.6} heightMeters={12} />

      {!hideOverlays && (
        <>
          <Html position={[22, 29, -68]} center zIndexRange={[1, 10]}>
            <div className="px-2.5 py-1 bg-[#121311]/88 border border-[#B8965A] text-[#EAE3D2] text-[10px] font-mono whitespace-nowrap">
              Utgard Watchtower Keep
            </div>
          </Html>
          <Html position={[-18, 42, -14]} center zIndexRange={[1, 10]}>
            <div className="px-2.5 py-1 bg-[#121311]/85 border border-[#EAE3D2]/30 text-[#EAE3D2] text-[10px] font-mono whitespace-nowrap">
              Giant Hardwoods · 75–80 m
            </div>
          </Html>
        </>
      )}
    </group>
  );
};
