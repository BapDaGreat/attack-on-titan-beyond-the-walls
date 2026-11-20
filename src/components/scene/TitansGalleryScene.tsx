"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { TitanSpec } from "@/data/titans";
import { CHARACTERS } from "@/data/characters";
import { getCobblestoneTextures, getWallMasonryTextures } from "@/engine/textures";
import { TitanModel3D } from "./TitanModel3D";
import { CharacterModel3D } from "./CharacterModel3D";

interface TitansGallerySceneProps {
  titan: TitanSpec;
  showHumanForm: boolean;
  transformSeqKey: number;
  hideOverlays: boolean;
  reducedMotion: boolean;
  doomsdayVariant: boolean;
}

/**
 * Nine Titans & Pure/Abnormal Showcase Stage (`1 unit = 1 meter`).
 * Supports 360° anatomical inspection, optional human inheritor scale comparison,
 * and an animated golden lightning + shockwave transformation sequence.
 */
export const TitansGalleryScene: React.FC<TitansGallerySceneProps> = ({
  titan,
  showHumanForm,
  transformSeqKey,
  hideOverlays,
  reducedMotion,
  doomsdayVariant,
}) => {
  const lightningGroupRef = useRef<THREE.Group>(null);
  const boltLightRef = useRef<THREE.PointLight>(null);
  const shockRingRef = useRef<THREE.Mesh>(null);
  const seqRef = useRef({ elapsed: 99, active: false });

  useEffect(() => {
    if (transformSeqKey > 0 && !reducedMotion) {
      seqRef.current = { elapsed: 0, active: true };
    }
  }, [transformSeqKey, reducedMotion]);

  const materials = useMemo(() => {
    const stone = getWallMasonryTextures(8);
    const cobble = getCobblestoneTextures(8);
    cobble.map.repeat.set(92, 92);
    cobble.normalMap.repeat.set(92, 92);
    cobble.roughnessMap.repeat.set(92, 92);

    return {
      floor: new THREE.MeshStandardMaterial({
        map: cobble.map,
        normalMap: cobble.normalMap,
        roughnessMap: cobble.roughnessMap,
        color: new THREE.Color("#7E776B"),
        roughness: 0.85,
      }),
      plinth: new THREE.MeshStandardMaterial({
        map: stone.map,
        normalMap: stone.normalMap,
        roughnessMap: stone.roughnessMap,
        color: new THREE.Color("#5D584F"),
        roughness: 0.85,
      }),
    };
  }, []);

  const displayHeight =
    titan.id === "founding" && doomsdayVariant ? 62 : titan.heightMeters;
  const plinthRadius = Math.max(4.5, displayHeight * 0.28);

  // Match an inheritor character for optional human-vs-Titan visual scale pairing
  const inheritorChar = useMemo(() => {
    const lower = titan.inheritors.join(" ").toLowerCase();
    return (
      CHARACTERS.find((c) => lower.includes(c.name.toLowerCase())) ||
      CHARACTERS[0]
    );
  }, [titan]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const st = seqRef.current;

    if (st.active) {
      st.elapsed += dt;
      const t = st.elapsed;
      // Smooth single-pulse bio-lightning decay (WCAG safe: no rapid strobe!)
      const flash = Math.exp(-t * 2.8) * Math.sin(Math.min(1, t * 4) * Math.PI * 0.5);

      if (boltLightRef.current) {
        boltLightRef.current.intensity = flash * 140;
      }
      if (lightningGroupRef.current) {
        lightningGroupRef.current.visible = t < 1.35;
        lightningGroupRef.current.scale.set(1 + t * 0.5, 1, 1 + t * 0.5);
      }
      if (shockRingRef.current) {
        shockRingRef.current.visible = t < 1.6;
        const rad = 1 + t * displayHeight * 1.1;
        shockRingRef.current.scale.set(rad, rad, 1);
        (shockRingRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.72 * (1 - t / 1.6));
      }

      if (t > 1.8) {
        st.active = false;
      }
    } else {
      if (boltLightRef.current) boltLightRef.current.intensity = 0;
      if (lightningGroupRef.current) lightningGroupRef.current.visible = false;
      if (shockRingRef.current) shockRingRef.current.visible = false;
    }
  });

  return (
    <group name="titans-gallery-stage">
      {/* Stage Warm Key + Cool Fill + Grazing Rim for Anatomical Relief */}
      <directionalLight position={[-18, 12, 22]} intensity={0.85} color="#A6C2E8" />
      <directionalLight position={[12, 16, -24]} intensity={1.15} color="#FFE0B2" />

      {/* Ground Arena */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={materials.floor} receiveShadow>
        <planeGeometry args={[380, 380]} />
      </mesh>

      {/* Sculpted Stone Pedestal */}
      <mesh position={[0, -0.35, 0]} material={materials.plinth} receiveShadow castShadow>
        <cylinderGeometry args={[plinthRadius, plinthRadius * 1.08, 0.7, 36]} />
      </mesh>

      {/* Titan Model (1:1m scaled cleanly) */}
      <TitanModel3D
        titan={titan}
        position={[0, 0, 0]}
        heightMeters={displayHeight}
        doomsdayMode={titan.id === "founding" && doomsdayVariant}
        animateIdle={!reducedMotion}
        emitSteam
      />

      {/* Optional Inheritor in Human Form beside Titan Foot */}
      {showHumanForm && (
        <group position={[Math.max(2.6, plinthRadius * 0.65), 0, Math.max(2.2, plinthRadius * 0.45)]}>
          <CharacterModel3D character={inheritorChar} animateIdle={!reducedMotion} />
          {!hideOverlays && (
            <Html position={[0, inheritorChar.heightMeters + 0.55, 0]} center zIndexRange={[1, 10]}>
              <div className="px-2 py-0.5 bg-[#121311]/90 border border-[#B8965A] text-[#EAE3D2] text-[10px] font-mono whitespace-nowrap">
                {inheritorChar.name} · {inheritorChar.heightMeters.toFixed(2)} m
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Golden Bio-Lightning Transformation Pillar & Ground Shockwave */}
      <group ref={lightningGroupRef} visible={false}>
        <mesh position={[0, displayHeight * 0.9, 0]}>
          <cylinderGeometry args={[0.35, 1.4, displayHeight * 1.9, 10]} />
          <meshBasicMaterial
            color="#FFC857"
            transparent
            opacity={0.75}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0.45, displayHeight * 0.95, 0.25]} rotation={[0, 0, 0.08]}>
          <cylinderGeometry args={[0.14, 0.65, displayHeight * 2.0, 8]} />
          <meshBasicMaterial
            color="#FFF0B8"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <pointLight
        ref={boltLightRef}
        position={[0, displayHeight * 0.65, displayHeight * 0.25]}
        color="#FFBE4D"
        intensity={0}
        distance={displayHeight * 3}
        decay={1.5}
      />

      <mesh ref={shockRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]} visible={false}>
        <ringGeometry args={[0.8, 1.0, 48]} />
        <meshBasicMaterial
          color="#FFCB6B"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {!hideOverlays && (
        <Html position={[0, displayHeight + Math.max(1.2, displayHeight * 0.08), 0]} center zIndexRange={[1, 10]}>
          <div className="px-2.5 py-1 bg-[#121311]/92 border border-[#EAE3D2]/30 text-[#EAE3D2] text-[11px] font-mono whitespace-nowrap">
            {titan.name} · {displayHeight.toFixed(1)} m
          </div>
        </Html>
      )}
    </group>
  );
};
