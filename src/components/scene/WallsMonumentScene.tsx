"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { TITANS } from "@/data/titans";
import { createChamferedBox, writeWorldUVs } from "@/engine/geometryBuilders";
import { createWallSurveyScanMaterial } from "@/engine/shaders";
import { getWallMasonryTextures } from "@/engine/textures";
import { localShiganshinaHeight } from "@/engine/noise";
import { GlbAsset } from "./GlbAsset";
import { TitanModel3D } from "./TitanModel3D";

interface WallsMonumentSceneProps {
  xrayActive: boolean;
  showColossalPeering: boolean;
  hideOverlays: boolean;
  reducedMotion: boolean;
}

/**
 * 1:1 Meter Monumental Recreation of Wall Maria, Wall Rose, and Wall Sina Horizon (`1 unit = 1 meter`).
 * - Exact 50.0 m vertical masonry height & 10.6 m thickness
 * - Arched Gatehouse (`wall-gatehouse.glb`) + Rail-mounted Cannon Batteries (`wall-cannon.glb`)
 * - Survey Scan X-Ray Cutaway (`3d-survey-scan`) revealing rows of 50m Wall Titans embedded in stone
 * - 1.70 m Scout reference at the base + toggleable 60m Colossal Titan peering above the parapet
 */
export const WallsMonumentScene: React.FC<WallsMonumentSceneProps> = ({
  xrayActive,
  showColossalPeering,
  hideOverlays,
  reducedMotion,
}) => {
  const buttressRef = useRef<THREE.InstancedMesh>(null);
  const scanRef = useRef({ progress: 0, xrayWeight: 0 });

  // Ground terrain with outer meadow elevation
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(520, 520, 120, 120);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const grass = new THREE.Color("#4A5D38");
    const path = new THREE.Color("#736B5D");
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = localShiganshinaHeight(x, z);
      pos.setY(i, y);
      const road = Math.exp(-Math.pow(x / 10, 2));
      tmp.copy(grass).lerp(path, road * 0.75);
      cols[i * 3] = tmp.r;
      cols[i * 3 + 1] = tmp.g;
      cols[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Survey-Scan X-ray Wall Masonry Material (`3d-survey-scan`)
  const wallScan = useMemo(() => {
    const tex = getWallMasonryTextures(8);
    tex.map.repeat.set(3, 2);
    tex.normalMap.repeat.set(3, 2);
    tex.roughnessMap.repeat.set(3, 2);

    const base = new THREE.MeshStandardMaterial({
      map: tex.map,
      normalMap: tex.normalMap,
      roughnessMap: tex.roughnessMap,
      color: new THREE.Color("#B4AA99"),
      roughness: 0.87,
      metalness: 0.0,
    });
    return createWallSurveyScanMaterial(base);
  }, []);

  // Beveled Wall Maria Masonry Wings + Battlements
  const wallWingGeo = useMemo(() => {
    const g = createChamferedBox(108, 50, 10.6, 0.25, 2, 0.08);
    return writeWorldUVs(g, 0.08);
  }, []);

  const buttressGeo = useMemo(() => createChamferedBox(1.8, 50, 1.8, 0.14, 1, 0.1), []);

  // Place 16 monumental buttresses along both faces of Wall Maria
  useEffect(() => {
    if (!buttressRef.current) return;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (const sideZ of [-5.8, 5.8]) {
      for (let x = -110; x <= 110; x += 20) {
        if (Math.abs(x) < 14) continue;
        dummy.position.set(x, 25, 18 + sideZ);
        dummy.updateMatrix();
        buttressRef.current.setMatrixAt(idx++, dummy.matrix);
      }
    }
    buttressRef.current.count = idx;
    buttressRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  // Wall Titans sealed inside Wall Maria core (only rendered/visible in X-Ray mode for performance)
  const colossalSpec = useMemo(() => TITANS.find((t) => t.id === "colossal")!, []);
  const wallTitanOffsets = useMemo(() => [-82, -62, -42, -22, 22, 42, 62, 82], []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const st = scanRef.current;
    const targetWeight = xrayActive ? 1 : 0;
    st.xrayWeight = THREE.MathUtils.lerp(
      st.xrayWeight,
      targetWeight,
      reducedMotion ? 1 : 1 - Math.exp(-5.0 * dt)
    );
    if (xrayActive) {
      st.progress = reducedMotion ? 1.15 : Math.max(0.45, Math.min(1.28, st.progress + dt * 0.72));
    } else {
      st.progress = Math.max(0, st.progress - dt * 1.1);
    }
    wallScan.uniforms.uXrayMode.value = st.xrayWeight;
    wallScan.uniforms.uScanProgress.value = st.progress;
  });

  useEffect(() => {
    return () => {
      terrainGeo.dispose();
      wallWingGeo.dispose();
      buttressGeo.dispose();
      wallScan.material.dispose();
    };
  }, [terrainGeo, wallWingGeo, buttressGeo, wallScan]);

  return (
    <group name="walls-monument-1to1">
      {/* Ground Terrain */}
      <mesh geometry={terrainGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Main Arched Wall Maria Gatehouse (centered at x=0, z=18) */}
      <GlbAsset
        model="wallGatehouse"
        position={[0, 0, 18]}
        wallScanUniforms={wallScan.uniforms}
      />

      {/* Left & Right 50m Wall Maria Masonry Wings */}
      <mesh
        geometry={wallWingGeo}
        material={wallScan.material}
        position={[-65, 25, 18]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={wallWingGeo}
        material={wallScan.material}
        position={[65, 25, 18]}
        castShadow
        receiveShadow
      />

      {/* Instanced Structural Buttresses */}
      <instancedMesh
        ref={buttressRef}
        args={[buttressGeo, wallScan.material, 40]}
        castShadow
        receiveShadow
      />

      {/* Wall-Top Parapet Rail Cannons (at y = 50m) */}
      {[-38, -18, 18, 38].map((cx) => (
        <GlbAsset
          key={cx}
          model="wallCannon"
          position={[cx, 50, 20.6]}
          rotation={[0, 0, 0]}
        />
      ))}

      {/* Dormant 50m Wall Titans inside Wall Maria Core (visible when X-Ray survey scan is active) */}
      {xrayActive && (
        <group name="wall-titans-interior">
          {wallTitanOffsets.map((tx) => (
            <TitanModel3D
              key={tx}
              titan={colossalSpec}
              position={[tx, 0, 18]}
              heightMeters={47.5}
              animateIdle={false}
              emitSteam={false}
            />
          ))}
        </group>
      )}

      {/* Optional 60m Colossal Titan peering over Wall Maria (`x = -16, z = 9`, facing +Z) */}
      {showColossalPeering && !xrayActive && (
        <TitanModel3D
          titan={colossalSpec}
          position={[-16, 0, 9]}
          rotationY={0}
          heightMeters={64}
          emitSteam
        />
      )}

      {/* Distant Wall Rose (z = -170m) & Wall Sina (z = -310m) Horizon Silhouettes */}
      <mesh position={[0, 25, -170]} receiveShadow>
        <boxGeometry args={[720, 50, 12]} />
        <meshStandardMaterial color="#8F887D" roughness={0.9} />
      </mesh>
      <mesh position={[0, 25, -310]} receiveShadow>
        <boxGeometry args={[920, 50, 12]} />
        <meshStandardMaterial color="#7D7872" roughness={0.92} />
      </mesh>

      {/* 1.70m Human Scale Reference at Wall Maria Base */}
      <group position={[11, 0, 34]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.22, 1.15, 6, 12]} />
          <meshStandardMaterial color="#3E5641" roughness={0.75} />
        </mesh>
        {!hideOverlays && (
          <Html position={[0, 2.3, 0]} center zIndexRange={[1, 10]}>
            <div className="px-2 py-0.5 bg-[#121311]/90 border border-[#B8965A]/60 text-[#EAE3D2] text-[10px] font-mono whitespace-nowrap">
              Human · 1.70 m
            </div>
          </Html>
        )}
      </group>

      {!hideOverlays && (
        <Html position={[-34, 52.5, 18]} center zIndexRange={[1, 10]}>
          <div className="px-2.5 py-1 bg-[#121311]/90 border border-[#EAE3D2]/30 text-[#EAE3D2] text-[11px] font-mono whitespace-nowrap">
            Wall Maria Parapet · 50.0 m
          </div>
        </Html>
      )}
    </group>
  );
};
