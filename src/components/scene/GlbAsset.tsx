"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { MODEL_PATHS, ModelKey } from "@/engine/assetLoader";
import {
  getBrushedMetalTextures,
  getPlasterTextures,
  getRoofTileTextures,
  getTimberTextures,
  getWallMasonryTextures,
  getWovenClothTextures,
} from "@/engine/textures";

interface GlbAssetProps {
  model: ModelKey;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  plasterTint?: string;
  roofStyle?: "clay" | "slate";
  castShadow?: boolean;
  receiveShadow?: boolean;
  wallScanUniforms?: {
    uScanProgress: { value: number };
    uScanOrigin: { value: THREE.Vector3 };
    uMaxRadius: { value: number };
    uXrayMode: { value: number };
  };
}

/**
 * Loads binary `.glb` assets generated under `public/models/` via Drei `useGLTF`
 * and assigns high-resolution procedural PBR maps (sRGB albedo + linear normal/roughness)
 * matched to each architectural surface role (`mat_stone`, `mat_timber`, `mat_plaster`, `mat_roof*`, `mat_metal`).
 */
export const GlbAsset: React.FC<GlbAssetProps> = ({
  model,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  plasterTint = "#DDD3BE",
  roofStyle,
  castShadow = true,
  receiveShadow = true,
  wallScanUniforms,
}) => {
  const path = MODEL_PATHS[model];
  const gltf = useGLTF(path);

  const clonedScene = useMemo(() => {
    const stone = getWallMasonryTextures(8);
    const plaster = getPlasterTextures(plasterTint, 4);
    const timber = getTimberTextures("dark-beam", 6);
    const timberLight = getTimberTextures("oak", 6);
    const roofClay = getRoofTileTextures("clay", 8);
    const roofSlate = getRoofTileTextures("slate", 8);
    const metal = getBrushedMetalTextures(8);
    const cloth = getWovenClothTextures("#D5CBB8", 4);

    const root = gltf.scene.clone(true);
    root.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
      mesh.frustumCulled = true;

      const matName = (mesh.material as THREE.Material)?.name || mesh.name;

      if (matName.includes("stone")) {
        const isDark = matName.includes("stoneDark");
        const baseStone = new THREE.MeshStandardMaterial({
          map: stone.map,
          normalMap: stone.normalMap,
          roughnessMap: stone.roughnessMap,
          color: new THREE.Color(isDark ? "#736C62" : "#A9A195"),
          roughness: isDark ? 0.9 : 0.86,
          metalness: 0.0,
        });
        if (wallScanUniforms) {
          baseStone.transparent = true;
          baseStone.customProgramCacheKey = () => `aot-wall-gatehouse-scan-${isDark ? "dark" : "light"}`;
          baseStone.onBeforeCompile = (shader) => {
            shader.uniforms.uScanProgress = wallScanUniforms.uScanProgress;
            shader.uniforms.uScanOrigin = wallScanUniforms.uScanOrigin;
            shader.uniforms.uMaxRadius = wallScanUniforms.uMaxRadius;
            shader.uniforms.uXrayMode = wallScanUniforms.uXrayMode;
            shader.vertexShader =
              `varying vec3 vSurveyWorldPos;\n` +
              shader.vertexShader.replace(
                "#include <worldpos_vertex>",
                `#include <worldpos_vertex>
                 vSurveyWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`
              );
            shader.fragmentShader =
              `uniform float uScanProgress;
               uniform vec3 uScanOrigin;
               uniform float uMaxRadius;
               uniform float uXrayMode;
               varying vec3 vSurveyWorldPos;\n` +
              shader.fragmentShader.replace(
                "#include <dithering_fragment>",
                `#include <dithering_fragment>
                 if (uXrayMode > 0.01) {
                   float activeRadius = uScanProgress * uMaxRadius;
                   float d = (length(vSurveyWorldPos - uScanOrigin) - activeRadius) / 4.2;
                   float rim = exp(-d * d * 2.4);
                   float behind = 1.0 - smoothstep(-1.5, 0.25, d);
                   gl_FragColor.rgb += vec3(0.24, 0.85, 0.88) * rim * 1.35 * uXrayMode;
                   gl_FragColor.a *= mix(1.0, 0.16, behind * uXrayMode);
                 }`
              );
          };
        }
        mesh.material = baseStone;
      } else if (matName.includes("plaster")) {
        mesh.material = new THREE.MeshStandardMaterial({
          map: plaster.map,
          normalMap: plaster.normalMap,
          roughnessMap: plaster.roughnessMap,
          roughness: 0.88,
          metalness: 0.0,
        });
      } else if (matName.includes("timberLight")) {
        mesh.material = new THREE.MeshStandardMaterial({
          map: timberLight.map,
          normalMap: timberLight.normalMap,
          roughnessMap: timberLight.roughnessMap,
          roughness: 0.68,
          metalness: 0.0,
        });
      } else if (matName.includes("timber")) {
        mesh.material = new THREE.MeshStandardMaterial({
          map: timber.map,
          normalMap: timber.normalMap,
          roughnessMap: timber.roughnessMap,
          roughness: 0.72,
          metalness: 0.0,
        });
      } else if (matName.includes("roof")) {
        const useSlate = roofStyle ? roofStyle === "slate" : matName.includes("Slate");
        const set = useSlate ? roofSlate : roofClay;
        mesh.material = new THREE.MeshStandardMaterial({
          map: set.map,
          normalMap: set.normalMap,
          roughnessMap: set.roughnessMap,
          roughness: useSlate ? 0.64 : 0.78,
          metalness: useSlate ? 0.06 : 0.0,
        });
      } else if (matName.includes("brass")) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          map: metal.map,
          normalMap: metal.normalMap,
          roughnessMap: metal.roughnessMap,
          color: new THREE.Color().setRGB(0.89, 0.72, 0.36, THREE.LinearSRGBColorSpace),
          metalness: 1.0,
          roughness: 0.28,
          envMapIntensity: 1.0,
        });
      } else if (matName.includes("metal")) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          map: metal.map,
          normalMap: metal.normalMap,
          roughnessMap: metal.roughnessMap,
          color: new THREE.Color().setRGB(0.56, 0.57, 0.58, THREE.LinearSRGBColorSpace),
          metalness: 1.0,
          roughness: 0.32,
          anisotropy: 0.65,
          envMapIntensity: 1.0,
        });
      } else if (matName.includes("cloth")) {
        mesh.material = new THREE.MeshPhysicalMaterial({
          map: cloth.map,
          normalMap: cloth.normalMap,
          roughnessMap: cloth.roughnessMap,
          roughness: 0.9,
          sheen: 0.5,
          sheenRoughness: 0.65,
          sheenColor: new THREE.Color("#EAE3D2"),
        });
      } else if (matName.includes("glass")) {
        mesh.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#2D2A24"),
          emissive: new THREE.Color("#FFAA52"),
          emissiveIntensity: 0.45,
          roughness: 0.18,
          metalness: 0.15,
        });
      }
    });

    return root;
  }, [gltf.scene, plasterTint, roofStyle, castShadow, receiveShadow, wallScanUniforms]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
};
