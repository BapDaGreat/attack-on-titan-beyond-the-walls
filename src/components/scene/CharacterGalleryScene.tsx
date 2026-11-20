"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { CharacterSpec } from "@/data/characters";
import { getCobblestoneTextures, getWallMasonryTextures } from "@/engine/textures";
import { CharacterModel3D } from "./CharacterModel3D";

interface CharacterGallerySceneProps {
  character: CharacterSpec;
  autoTurn: boolean;
  hideOverlays: boolean;
  reducedMotion: boolean;
}

/**
 * Character Showcase Stage (`build-3d-character-selector` lighting & staging recipe):
 * - Warm key + soft cool fill + narrow grazing rim highlight for leather, cloth & steel blades
 * - Full-body grounded on dark slate turntable pedestal with gentle idle turn
 */
export const CharacterGalleryScene: React.FC<CharacterGallerySceneProps> = ({
  character,
  autoTurn,
  hideOverlays,
  reducedMotion,
}) => {
  const turntableRef = useRef<THREE.Group>(null);

  const materials = useMemo(() => {
    const cobble = getCobblestoneTextures(8);
    cobble.map.repeat.set(32, 32);
    cobble.normalMap.repeat.set(32, 32);
    const stone = getWallMasonryTextures(8);
    return {
      floor: new THREE.MeshStandardMaterial({
        map: cobble.map,
        normalMap: cobble.normalMap,
        color: new THREE.Color("#43413B"),
        roughness: 0.88,
      }),
      pedestal: new THREE.MeshStandardMaterial({
        map: stone.map,
        normalMap: stone.normalMap,
        color: new THREE.Color("#333632"),
        roughness: 0.72,
      }),
    };
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    if (turntableRef.current && autoTurn && !reducedMotion) {
      turntableRef.current.rotation.y += dt * 0.24;
    }
  });

  return (
    <group name="character-gallery-stage">
      {/* Ground Slate Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} material={materials.floor} receiveShadow>
        <planeGeometry args={[120, 120]} />
      </mesh>

      {/* Dark Stone Turntable Plinth */}
      <mesh position={[0, -0.09, 0]} material={materials.pedestal} receiveShadow castShadow>
        <cylinderGeometry args={[1.35, 1.48, 0.18, 36]} />
      </mesh>

      {/* Grazing Stage Rim Lights (`build-3d-character-selector` recipe) */}
      <spotLight position={[2.8, 3.2, 3.5]} intensity={16} angle={0.55} penumbra={0.6} color="#FFE5C2" castShadow />
      <pointLight position={[-3.2, 2.2, 2.4]} intensity={4.5} color="#8BAED6" distance={10} />
      <pointLight position={[0.4, 2.5, -2.8]} intensity={7.5} color="#FFD39B" distance={8} />

      <group ref={turntableRef}>
        <CharacterModel3D character={character} animateIdle={!reducedMotion} />
      </group>

      {!hideOverlays && (
        <Html position={[0, character.heightMeters + 0.38, 0]} center zIndexRange={[1, 10]}>
          <div className="px-2.5 py-1 bg-[#121311]/90 border border-[#B8965A] text-[#EAE3D2] text-[11px] font-mono whitespace-nowrap">
            {character.name} · {character.heightMeters.toFixed(2)} m
          </div>
        </Html>
      )}
    </group>
  );
};
