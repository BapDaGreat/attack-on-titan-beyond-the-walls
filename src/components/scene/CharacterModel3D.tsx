"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CharacterSpec } from "@/data/characters";
import {
  createChamferedBox,
  createSculptedHeadGeometry,
  createSculptedTorsoGeometry,
  createSweptLimbGeometry,
} from "@/engine/geometryBuilders";
import {
  getBrushedMetalTextures,
  getTitanSurfaceTextures,
  getWovenClothTextures,
} from "@/engine/textures";
import { GlbAsset } from "./GlbAsset";

interface CharacterModel3DProps {
  character: CharacterSpec;
  position?: [number, number, number];
  rotationY?: number;
  silhouetteOnly?: boolean;
  animateIdle?: boolean;
}

/**
 * 1:1 Meter Articulated Character Builder (`1 unit = 1 meter`).
 * Connects hip/shoulder/elbow/knee joints cleanly, drapes woven Survey Corps cloaks,
 * mounts snug hip-profile ODM gear (`odm-gear.glb`), and angles blades cleanly outside the silhouette.
 */
export const CharacterModel3D: React.FC<CharacterModel3DProps> = ({
  character,
  position = [0, 0, 0],
  rotationY = 0,
  silhouetteOnly = false,
  animateIdle = true,
}) => {
  const chestRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const cloakRef = useRef<THREE.Mesh>(null);

  const H = character.heightMeters;
  const v = character.visual;
  const bScale = v.buildScale;

  const dims = useMemo(
    () => ({
      legH: H * 0.49,
      torsoH: H * 0.32,
      headH: H * 0.135,
      armH: H * 0.37,
      shoulderHalf: H * 0.118 * bScale,
      hipHalf: H * 0.064 * bScale,
    }),
    [H, bScale]
  );

  const geos = useMemo(() => {
    const torso = createSculptedTorsoGeometry(dims.torsoH, bScale, 0.9 * bScale, 0.075);
    const head = createSculptedHeadGeometry(dims.headH, 0.03);
    const thighLen = dims.legH * 0.51;
    const calfLen = dims.legH * 0.49;
    const legR = H * 0.034 * bScale;

    const thigh = createSweptLimbGeometry(
      thighLen,
      [
        { t: 0, rx: legR * 1.15, rz: legR * 1.15 },
        { t: 0.45, rx: legR * 1.05, rz: legR * 1.08 },
        { t: 1, rx: legR * 0.82, rz: legR * 0.82 },
      ],
      14
    );
    const boot = createSweptLimbGeometry(
      calfLen,
      [
        { t: 0, rx: legR * 0.85, rz: legR * 0.88 },
        { t: 0.32, rx: legR * 0.92, rz: legR * 0.96 },
        { t: 0.88, rx: legR * 0.65, rz: legR * 0.68 },
        { t: 1, rx: legR * 0.72, rz: legR * 0.78 },
      ],
      14
    );
    const armR = H * 0.025 * bScale;
    const upperArm = createSweptLimbGeometry(
      dims.armH * 0.48,
      [
        { t: 0, rx: armR * 1.18, rz: armR * 1.18 },
        { t: 1, rx: armR * 0.86, rz: armR * 0.86 },
      ],
      12
    );
    const forearm = createSweptLimbGeometry(
      dims.armH * 0.52,
      [
        { t: 0, rx: armR * 0.88, rz: armR * 0.88 },
        { t: 0.78, rx: armR * 0.72, rz: armR * 0.72 },
        { t: 1, rx: armR * 0.76, rz: armR * 0.55 },
      ],
      12
    );
    const shoe = createChamferedBox(legR * 1.4, H * 0.035, legR * 2.55, 0.008);

    const cloakGeo = new THREE.CylinderGeometry(
      dims.shoulderHalf * 1.08,
      dims.shoulderHalf * 1.62,
      H * 0.48,
      20,
      4,
      true,
      Math.PI * 0.52,
      Math.PI * 0.96
    );
    const cp = cloakGeo.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i);
      const y = cp.getY(i);
      const z = cp.getZ(i);
      const t = 1 - (y + H * 0.24) / (H * 0.48);
      const wave = Math.sin(x * 16) * 0.02 * t;
      cp.setZ(i, z - wave - t * 0.06);
    }
    cloakGeo.computeVertexNormals();

    return { torso, head, thigh, boot, upperArm, forearm, shoe, cloakGeo, thighLen, calfLen, legR, armR };
  }, [dims, H, bScale]);

  const mats = useMemo(() => {
    if (silhouetteOnly) {
      const m = new THREE.MeshBasicMaterial({ color: "#191B18" });
      return { skin: m, jacket: m, pants: m, boots: m, cloak: m, hair: m, scarf: m, metal: m, eye: m, sclera: m };
    }
    const skinTex = getTitanSurfaceTextures("skin", v.skinHex, 4);
    const jacketTex = getWovenClothTextures(v.jacketHex, 4);
    const cloakTex = getWovenClothTextures(v.cloakHex || "#2D4735", 4);
    const pantsTex = getWovenClothTextures("#E5DEC9", 4);
    const metalTex = getBrushedMetalTextures(4);

    return {
      skin: new THREE.MeshStandardMaterial({
        map: skinTex.map,
        normalMap: skinTex.normalMap,
        roughness: 0.64,
      }),
      jacket: new THREE.MeshPhysicalMaterial({
        map: jacketTex.map,
        normalMap: jacketTex.normalMap,
        roughness: 0.74,
        sheen: 0.35,
        sheenRoughness: 0.75,
        sheenColor: new THREE.Color("#A28466"),
      }),
      pants: new THREE.MeshPhysicalMaterial({
        map: pantsTex.map,
        normalMap: pantsTex.normalMap,
        roughness: 0.85,
        sheen: 0.4,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#F4EFE2"),
      }),
      boots: new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2D2119"),
        roughness: 0.58,
        metalness: 0.04,
      }),
      cloak: new THREE.MeshPhysicalMaterial({
        map: cloakTex.map,
        normalMap: cloakTex.normalMap,
        roughnessMap: cloakTex.roughnessMap,
        roughness: 0.88,
        sheen: 0.72,
        sheenRoughness: 0.72,
        sheenColor: new THREE.Color("#698C72"),
        side: THREE.DoubleSide,
      }),
      hair: new THREE.MeshStandardMaterial({
        color: new THREE.Color(v.hairHex),
        roughness: 0.78,
      }),
      scarf: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(v.scarfHex || "#EAE4D6"),
        roughness: 0.86,
        sheen: 0.65,
        sheenColor: new THREE.Color("#D47872"),
      }),
      metal: new THREE.MeshPhysicalMaterial({
        map: metalTex.map,
        normalMap: metalTex.normalMap,
        color: new THREE.Color("#4B5158"),
        metalness: 0.72,
        roughness: 0.42,
        anisotropy: 0.5,
        envMapIntensity: 0.55,
      }),
      sclera: new THREE.MeshStandardMaterial({ color: "#F2EFE9", roughness: 0.3 }),
      eye: new THREE.MeshStandardMaterial({
        color: new THREE.Color(v.eyeHex),
        roughness: 0.22,
      }),
    };
  }, [v, silhouetteOnly]);

  // Balanced combat & parade poses keeping arms & blades naturally outward (left = -Z, right = +Z)
  const pose = useMemo(() => {
    switch (v.pose) {
      case "salute":
        return { lArm: [0.06, 0, -0.14], lFore: [-0.15, 0, 0], rArm: [-1.1, -0.45, 0.18], rFore: [-1.35, -0.65, -0.45] };
      case "ready-blades":
        return { lArm: [-0.22, -0.15, -0.34], lFore: [-0.62, -0.12, -0.08], rArm: [-0.28, 0.15, 0.34], rFore: [-0.68, 0.12, 0.08] };
      case "command":
        return { lArm: [0.06, 0, -0.12], lFore: [-0.15, 0, 0], rArm: [-0.55, 0.15, 0.24], rFore: [-0.85, 0, -0.12] };
      case "warrior-guard":
        return { lArm: [-0.45, -0.18, -0.24], lFore: [-0.95, 0, 0.15], rArm: [-0.3, 0.15, 0.24], rFore: [-0.95, 0, -0.15] };
      default:
        return { lArm: [0.04, 0, -0.12], lFore: [-0.12, 0, 0], rArm: [0.04, 0, 0.12], rFore: [-0.12, 0, 0] };
    }
  }, [v.pose]);

  useFrame(({ clock }) => {
    if (!animateIdle) return;
    const t = clock.elapsedTime;
    if (chestRef.current) chestRef.current.rotation.x = Math.sin(t * 1.6) * 0.01;
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.7) * 0.07;
    if (cloakRef.current) cloakRef.current.rotation.x = 0.06 + Math.sin(t * 2.1) * 0.022;
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]} name={`character-${character.id}`}>
      {/* Slim Anatomical Hip / Waist Bridge */}
      <mesh
        position={[0, dims.legH * 0.98, 0]}
        scale={[dims.hipHalf * 1.38, H * 0.036, dims.hipHalf * 0.92]}
        material={mats.pants}
        castShadow
      >
        <sphereGeometry args={[1, 14, 12]} />
      </mesh>

      {/* Boots & Jodhpurs */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * dims.hipHalf, dims.legH, 0]}>
          <mesh geometry={geos.thigh} material={mats.pants} castShadow />
          <group position={[0, -geos.thighLen, 0]}>
            <mesh material={mats.boots} scale={[geos.legR * 0.8, geos.legR * 0.8, geos.legR * 0.8]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh geometry={geos.boot} material={mats.boots} castShadow />
            <mesh
              geometry={geos.shoe}
              material={mats.boots}
              position={[0, -geos.calfLen + H * 0.016, geos.legR * 0.55]}
              castShadow
            />
          </group>
        </group>
      ))}

      {/* Upper Body & Equipment */}
      <group ref={chestRef} position={[0, dims.legH * 0.96, 0]}>
        <mesh geometry={geos.torso} material={mats.jacket} castShadow receiveShadow />

        {/* Leather chest & hip harness straps */}
        <mesh position={[0, dims.torsoH * 0.06, 0]} material={mats.boots} castShadow>
          <cylinderGeometry args={[dims.hipHalf * 1.68, dims.hipHalf * 1.72, H * 0.045, 14]} />
        </mesh>

        {/* Neck + Sculpted Head + Detailed Eyes/Brows/Hair */}
        <mesh position={[0, dims.torsoH * 1.02, 0]} material={mats.skin}>
          <cylinderGeometry args={[dims.headH * 0.22, dims.headH * 0.26, dims.headH * 0.45, 12]} />
        </mesh>

        <group ref={headRef} position={[0, dims.torsoH + dims.headH * 0.58, 0.01]}>
          <mesh geometry={geos.head} material={mats.skin} castShadow />

          {/* Detailed Eyes & Brows seated clearly above cheekbone socket */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * dims.headH * 0.145, dims.headH * 0.045, dims.headH * 0.454]}>
              <mesh material={mats.sclera}>
                <sphereGeometry args={[dims.headH * 0.045, 10, 8]} />
              </mesh>
              <mesh position={[0, 0, dims.headH * 0.028]} material={mats.eye}>
                <sphereGeometry args={[dims.headH * 0.029, 10, 8]} />
              </mesh>
              <mesh position={[0, dims.headH * 0.068, dims.headH * 0.015]} rotation={[0, 0, s * -0.14]} material={mats.hair}>
                <boxGeometry args={[dims.headH * 0.115, dims.headH * 0.018, dims.headH * 0.022]} />
              </mesh>
            </group>
          ))}

          {/* Subtle Nose Tip, Mouth Shadow & Ears */}
          <mesh position={[0, -dims.headH * 0.06, dims.headH * 0.49]} material={mats.skin} castShadow>
            <sphereGeometry args={[dims.headH * 0.042, 8, 8]} />
          </mesh>
          <mesh position={[0, -dims.headH * 0.21, dims.headH * 0.44]} material={mats.hair}>
            <boxGeometry args={[dims.headH * 0.12, dims.headH * 0.012, dims.headH * 0.02]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * dims.headH * 0.425, dims.headH * 0.02, 0]} scale={[0.45, 1, 0.7]} material={mats.skin}>
              <sphereGeometry args={[dims.headH * 0.07, 8, 8]} />
            </mesh>
          ))}

          {/* Tilted Hair Crown keeping forehead & eyes completely clear */}
          <mesh
            position={[0, dims.headH * 0.17, -dims.headH * 0.05]}
            rotation={[-0.36, 0, 0]}
            material={mats.hair}
            castShadow
          >
            <sphereGeometry args={[dims.headH * 0.465, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
          </mesh>

          {/* Character Hair Silhouettes */}
          {v.hairStyle === "levi-undercut" && (
            <group>
              {[-0.14, 0.14].map((hx, idx) => (
                <mesh
                  key={idx}
                  position={[hx * dims.headH * 1.4, dims.headH * 0.26, dims.headH * 0.35]}
                  rotation={[0.35, hx * 1.2, hx * -1.4]}
                  material={mats.hair}
                >
                  <coneGeometry args={[dims.headH * 0.11, dims.headH * 0.26, 6]} />
                </mesh>
              ))}
            </group>
          )}
          {v.hairStyle === "historia-long" && (
            <mesh position={[0, -dims.headH * 0.4, -dims.headH * 0.22]} material={mats.hair} castShadow>
              <coneGeometry args={[dims.headH * 0.36, dims.headH * 1.35, 10]} />
            </mesh>
          )}
          {v.hairStyle === "hange-ponytail" && (
            <mesh position={[0, dims.headH * 0.1, -dims.headH * 0.46]} rotation={[0.45, 0, 0]} material={mats.hair} castShadow>
              <coneGeometry args={[dims.headH * 0.2, dims.headH * 0.85, 8]} />
            </mesh>
          )}
          {v.hairStyle === "annie-bun" && (
            <mesh position={[0, dims.headH * 0.3, -dims.headH * 0.4]} material={mats.hair} castShadow>
              <sphereGeometry args={[dims.headH * 0.22, 10, 10]} />
            </mesh>
          )}
          {v.hairStyle === "mikasa-bob" && (
            <mesh position={[0, -dims.headH * 0.08, -dims.headH * 0.14]} material={mats.hair} castShadow>
              <cylinderGeometry args={[dims.headH * 0.46, dims.headH * 0.42, dims.headH * 0.52, 12, 1, true, Math.PI * 0.4, Math.PI * 1.2]} />
            </mesh>
          )}
          {v.hairStyle === "zeke-beard" && (
            <mesh position={[0, -dims.headH * 0.22, dims.headH * 0.22]} material={mats.hair} castShadow>
              <sphereGeometry args={[dims.headH * 0.26, 10, 8]} />
            </mesh>
          )}

          {(v.goggles || v.glasses) && (
            <group position={[0, dims.headH * (v.goggles ? 0.32 : 0.06), dims.headH * 0.42]}>
              {[-1, 1].map((s) => (
                <mesh key={s} position={[s * dims.headH * 0.15, 0, 0]} material={mats.metal}>
                  <torusGeometry args={[dims.headH * (v.goggles ? 0.095 : 0.068), 0.008, 8, 16]} />
                </mesh>
              ))}
            </group>
          )}
        </group>

        {(v.scarfHex || v.cravat) && (
          <mesh
            position={[0, dims.torsoH * 0.96, 0.02]}
            rotation={[0.1, 0, 0]}
            material={mats.scarf}
            castShadow
          >
            <torusGeometry args={[dims.headH * 0.34, dims.headH * (v.scarfHex ? 0.15 : 0.085), 10, 18]} />
          </mesh>
        )}

        {v.cloakHex && (
          <mesh
            ref={cloakRef}
            geometry={geos.cloakGeo}
            material={mats.cloak}
            position={[0, dims.torsoH * 0.38, -0.02]}
            castShadow
          />
        )}

        {v.hasOdm && !silhouetteOnly && (
          <GlbAsset model="odmGear" position={[0, -dims.legH * 0.88, 0]} scale={H / 1.7} />
        )}

        {/* Arms with Flush Deltoid Caps, Elbow Spheres, & Angled Outward Steel Blades */}
        <group
          position={[-dims.shoulderHalf * 1.0, dims.torsoH * 0.87, 0]}
          rotation={pose.lArm as [number, number, number]}
        >
          <mesh material={mats.jacket} scale={[geos.armR * 1.05, geos.armR * 1.05, geos.armR * 1.05]} castShadow>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh geometry={geos.upperArm} material={mats.jacket} castShadow />
          <group position={[0, -dims.armH * 0.48, 0]} rotation={pose.lFore as [number, number, number]}>
            <mesh material={mats.jacket} scale={[geos.armR * 0.78, geos.armR * 0.78, geos.armR * 0.78]} castShadow>
              <sphereGeometry args={[1, 8, 8]} />
            </mesh>
            <mesh geometry={geos.forearm} material={mats.jacket} castShadow />
            {v.hasOdm && v.pose === "ready-blades" && (
              <group position={[-0.08, -dims.armH * 0.45, 0.3]} rotation={[0.35, -0.45, 0]}>
                <mesh material={mats.metal} castShadow>
                  <boxGeometry args={[0.008, 0.024, 0.6]} />
                </mesh>
                <mesh position={[0, 0, -0.26]} material={mats.boots}>
                  <boxGeometry args={[0.022, 0.036, 0.14]} />
                </mesh>
              </group>
            )}
          </group>
        </group>

        <group
          position={[dims.shoulderHalf * 1.0, dims.torsoH * 0.87, 0]}
          rotation={pose.rArm as [number, number, number]}
        >
          <mesh material={mats.jacket} scale={[geos.armR * 1.05, geos.armR * 1.05, geos.armR * 1.05]} castShadow>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          <mesh geometry={geos.upperArm} material={mats.jacket} castShadow />
          <group position={[0, -dims.armH * 0.48, 0]} rotation={pose.rFore as [number, number, number]}>
            <mesh material={mats.jacket} scale={[geos.armR * 0.78, geos.armR * 0.78, geos.armR * 0.78]} castShadow>
              <sphereGeometry args={[1, 8, 8]} />
            </mesh>
            <mesh geometry={geos.forearm} material={mats.jacket} castShadow />
            {v.hasOdm && v.pose === "ready-blades" && (
              <group position={[0.08, -dims.armH * 0.45, 0.3]} rotation={[0.35, 0.45, 0]}>
                <mesh material={mats.metal} castShadow>
                  <boxGeometry args={[0.008, 0.024, 0.6]} />
                </mesh>
                <mesh position={[0, 0, -0.26]} material={mats.boots}>
                  <boxGeometry args={[0.022, 0.036, 0.14]} />
                </mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};
