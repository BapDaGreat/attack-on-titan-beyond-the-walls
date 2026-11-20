"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { TitanSpec } from "@/data/titans";
import {
  createChamferedBox,
  createCurvedArmorShell,
  createSculptedHeadGeometry,
  createSculptedTorsoGeometry,
  createSweptLimbGeometry,
} from "@/engine/geometryBuilders";
import { getSmokePuffTexture, getTitanSurfaceTextures } from "@/engine/textures";
import { createSeededRng } from "@/engine/noise";

interface TitanModel3DProps {
  titan: TitanSpec;
  position?: [number, number, number];
  rotationY?: number;
  heightMeters?: number;
  silhouetteOnly?: boolean;
  xrayMode?: boolean;
  animateIdle?: boolean;
  emitSteam?: boolean;
  doomsdayMode?: boolean;
}

/**
 * Anatomical Sculpted 3D Titan Builder (`1 unit = 1 meter`).
 * Connects every joint cleanly via sculpted pelvis, deltoid, elbow, and patella bridges,
 * contoured `createCurvedArmorShell` dermal plates, radial soft steam puffs, and matte-organic tissue PBR.
 */
export const TitanModel3D: React.FC<TitanModel3DProps> = ({
  titan,
  position = [0, 0, 0],
  rotationY = 0,
  heightMeters,
  silhouetteOnly = false,
  xrayMode = false,
  animateIdle = true,
  emitSteam = true,
  doomsdayMode = false,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const chestRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Points>(null);

  const H = heightMeters ?? titan.heightMeters;
  const sil = titan.silhouette;
  const isQuadruped = Boolean(sil.quadruped);

  const dims = useMemo(() => {
    if (isQuadruped) {
      return {
        legH: H * 0.72,
        torsoH: H * 0.65,
        headH: H * 0.24,
        armH: H * 0.74,
        shoulderHalf: H * 0.30,
        hipHalf: H * 0.24,
      };
    }
    return {
      legH: H * 0.49,
      torsoH: H * 0.34,
      headH: sil.proportionProfile === "colossal" ? H * 0.115 : H * 0.135,
      armH: H * 0.41 * sil.armLengthRatio,
      shoulderHalf: H * 0.138 * sil.shoulderWidthRatio,
      hipHalf: H * 0.072 * sil.legThicknessRatio,
    };
  }, [H, isQuadruped, sil]);

  const geos = useMemo(() => {
    const torso = createSculptedTorsoGeometry(
      dims.torsoH,
      sil.shoulderWidthRatio,
      sil.torsoDepthRatio,
      sil.proportionProfile === "colossal" ? 0.17 : 0.13
    );

    const head = createSculptedHeadGeometry(
      dims.headH,
      sil.proportionProfile === "jaw" || sil.proportionProfile === "pure" ? 0.14 : 0.06
    );

    const legR = H * 0.052 * sil.legThicknessRatio;
    const thighLen = dims.legH * 0.52;
    const calfLen = dims.legH * 0.48;

    const thigh = createSweptLimbGeometry(
      thighLen,
      [
        { t: 0.0, rx: legR * 1.12, rz: legR * 1.15 },
        { t: 0.35, rx: legR * 1.16, rz: legR * 1.2, muscleRibs: 0.05 },
        { t: 0.76, rx: legR * 0.92, rz: legR * 0.96, muscleRibs: 0.04 },
        { t: 1.0, rx: legR * 0.74, rz: legR * 0.78 },
      ],
      18
    );

    const calf = createSweptLimbGeometry(
      calfLen,
      [
        { t: 0.0, rx: legR * 0.74, rz: legR * 0.76 },
        { t: 0.28, rx: legR * 0.88, rz: legR * 0.96, offsetZ: -legR * 0.08, muscleRibs: 0.06 },
        { t: 0.75, rx: legR * 0.58, rz: legR * 0.62 },
        { t: 1.0, rx: legR * 0.52, rz: legR * 0.56 },
      ],
      16
    );

    const armR = H * 0.034 * Math.sqrt(sil.shoulderWidthRatio);
    const upperArmLen = dims.armH * 0.48;
    const forearmLen = dims.armH * 0.52;

    const upperArm = createSweptLimbGeometry(
      upperArmLen,
      [
        { t: 0.0, rx: armR * 1.22, rz: armR * 1.2 },
        { t: 0.45, rx: armR * 1.14, rz: armR * 1.18, muscleRibs: 0.05 },
        { t: 1.0, rx: armR * 0.82, rz: armR * 0.8 },
      ],
      14
    );

    const forearm = createSweptLimbGeometry(
      forearmLen,
      [
        { t: 0.0, rx: armR * 0.86, rz: armR * 0.84 },
        { t: 0.28, rx: armR * 0.98, rz: armR * 0.95, muscleRibs: 0.04 },
        { t: 0.8, rx: armR * 0.64, rz: armR * 0.6 },
        { t: 1.0, rx: armR * 0.72, rz: armR * 0.52 },
      ],
      14
    );

    const foot = createChamferedBox(legR * 1.28, H * 0.036, legR * 2.4, legR * 0.22);

    // Contoured Anatomical Armor Shells (for Armored Titan & Jaw)
    const torsoRx = dims.torsoH * 0.31 * sil.shoulderWidthRatio;
    const torsoRz = dims.torsoH * 0.23 * sil.torsoDepthRatio;
    const armorPec = createCurvedArmorShell(
      torsoRx * 1.12,
      torsoRz * 1.25,
      dims.torsoH * 0.34,
      Math.PI * 0.92,
      H * 0.015,
      1.05,
      0.92
    );
    const armorBack = createCurvedArmorShell(
      torsoRx * 1.1,
      torsoRz * 1.15,
      dims.torsoH * 0.48,
      Math.PI * 0.85,
      H * 0.014,
      1.08,
      0.86
    );
    const armorAbs = createCurvedArmorShell(
      torsoRx * 0.88,
      torsoRz * 1.1,
      dims.torsoH * 0.28,
      Math.PI * 0.72,
      H * 0.012,
      0.98,
      0.88
    );
    const armorShoulder = createCurvedArmorShell(
      armR * 1.55,
      armR * 1.55,
      armR * 2.6,
      Math.PI * 1.25,
      H * 0.012,
      0.95,
      1.08
    );
    const armorShin = createCurvedArmorShell(
      legR * 1.05,
      legR * 1.12,
      calfLen * 0.8,
      Math.PI * 0.95,
      H * 0.011,
      1.04,
      0.78
    );
    const armorThigh = createCurvedArmorShell(
      legR * 1.28,
      legR * 1.32,
      thighLen * 0.74,
      Math.PI * 0.92,
      H * 0.012,
      1.06,
      0.88
    );
    const armorForearm = createCurvedArmorShell(
      armR * 1.08,
      armR * 1.06,
      forearmLen * 0.78,
      Math.PI * 1.05,
      H * 0.009,
      1.05,
      0.76
    );
    const armorFaceplate = createCurvedArmorShell(
      dims.headH * 0.42,
      dims.headH * 0.44,
      dims.headH * 0.72,
      Math.PI * 0.92,
      H * 0.008,
      1.02,
      0.74
    );

    const hammerShaft = new THREE.CylinderGeometry(H * 0.016, H * 0.018, H * 0.52, 10);
    const hammerHead = createChamferedBox(H * 0.08, H * 0.09, H * 0.2, H * 0.015);

    return {
      torso,
      head,
      thigh,
      calf,
      upperArm,
      forearm,
      foot,
      armorPec,
      armorBack,
      armorAbs,
      armorShoulder,
      armorShin,
      armorThigh,
      armorForearm,
      armorFaceplate,
      hammerShaft,
      hammerHead,
      thighLen,
      calfLen,
      upperArmLen,
      forearmLen,
      legR,
      armR,
    };
  }, [dims, H, sil]);

  const materials = useMemo(() => {
    if (silhouetteOnly) {
      const m = new THREE.MeshBasicMaterial({ color: "#1B1D1B" });
      return { skin: m, muscle: m, armor: m, hair: m, eye: m, sclera: m, fur: m };
    }

    const skinTex = getTitanSurfaceTextures(
      sil.proportionProfile === "colossal" ? "muscle" : "skin",
      sil.skinHex,
      4
    );
    const muscleTex = getTitanSurfaceTextures("muscle", sil.muscleHex, 4);
    const armorTex = getTitanSurfaceTextures("armor", sil.armorHex || "#DDD4C1", 4);

    const commonProps = xrayMode
      ? { transparent: true, opacity: 0.36, depthWrite: false }
      : { transparent: false, opacity: 1.0 };

    const skin = new THREE.MeshStandardMaterial({
      map: skinTex.map,
      normalMap: skinTex.normalMap,
      roughnessMap: skinTex.roughnessMap,
      roughness: sil.proportionProfile === "colossal" ? 0.62 : 0.7,
      metalness: 0.0,
      ...commonProps,
    });

    const muscle = new THREE.MeshStandardMaterial({
      map: muscleTex.map,
      normalMap: muscleTex.normalMap,
      roughnessMap: muscleTex.roughnessMap,
      roughness: 0.6,
      metalness: 0.0,
      ...commonProps,
    });

    const armor = new THREE.MeshPhysicalMaterial({
      map: armorTex.map,
      normalMap: armorTex.normalMap,
      roughnessMap: armorTex.roughnessMap,
      roughness: sil.hasCrystalConstruct ? 0.24 : 0.56,
      metalness: 0.0,
      clearcoat: sil.hasCrystalConstruct ? 0.85 : 0.08,
      clearcoatRoughness: 0.25,
      ...commonProps,
    });

    const hair = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sil.hairHex),
      roughness: 0.88,
      metalness: 0.0,
      ...commonProps,
    });

    const sclera = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#E8E2D6"),
      roughness: 0.3,
    });

    const eye = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sil.eyeGlowHex),
      emissive: new THREE.Color(sil.eyeGlowHex),
      emissiveIntensity: 1.35,
      roughness: 0.15,
    });

    const fur = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sil.furHex || "#3A2B22"),
      roughness: 0.94,
      metalness: 0.0,
      ...commonProps,
    });

    return { skin, muscle, armor, hair, eye, sclera, fur };
  }, [sil, silhouetteOnly, xrayMode]);

  const smokeTex = useMemo(() => getSmokePuffTexture(), []);

  const steamParticles = useMemo(() => {
    const count = Math.round(52 * sil.steamLevel);
    if (count <= 0) return null;
    const arr = new Float32Array(count * 3);
    const rng = createSeededRng(H * 100 + titan.name.length * 17);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rng() - 0.5) * H * 0.36;
      arr[i * 3 + 1] = H * (0.3 + rng() * 0.72);
      arr[i * 3 + 2] = (rng() - 0.5) * H * 0.28;
    }
    const g = new THREE.BufferGeometry();
    const attr = new THREE.Float32BufferAttribute(arr, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr);
    return { g, attr, count };
  }, [H, sil.steamLevel, titan.name]);

  const furTufts = useMemo(() => {
    if (!sil.hasFur) return [];
    const rng = createSeededRng(9921);
    const out: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 72; i++) {
      const ang = rng() * Math.PI * 2;
      const t = rng();
      const rad = dims.torsoH * (0.33 - t * 0.08) * sil.torsoDepthRatio;
      out.push({
        pos: [
          Math.cos(ang) * rad * 1.15,
          t * dims.torsoH * 0.9,
          Math.sin(ang) * rad,
        ],
        rot: [Math.sin(ang) * 0.35, ang, Math.cos(ang) * 0.35],
        s: H * (0.04 + rng() * 0.04),
      });
    }
    return out;
  }, [sil.hasFur, sil.torsoDepthRatio, dims.torsoH, H]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const t = clock.elapsedTime;
    if (animateIdle && !doomsdayMode) {
      if (chestRef.current) {
        chestRef.current.rotation.x = Math.sin(t * 1.35) * 0.015;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.65) * 0.06;
        headRef.current.rotation.x = Math.sin(t * 1.1) * 0.02 + 0.03;
      }
      if (leftArmRef.current && rightArmRef.current) {
        leftArmRef.current.rotation.z = -0.09 - Math.sin(t * 1.35) * 0.018;
        rightArmRef.current.rotation.z = 0.09 + Math.sin(t * 1.35) * 0.018;
      }
    }
    if (emitSteam && steamParticles && steamRef.current) {
      const arr = steamParticles.attr.array as Float32Array;
      for (let i = 0; i < steamParticles.count; i++) {
        arr[i * 3 + 1] += dt * H * 0.14;
        arr[i * 3] += Math.sin(t * 1.4 + i) * dt * H * 0.02;
        if (arr[i * 3 + 1] > H * 1.14) {
          arr[i * 3 + 1] = H * 0.32;
        }
      }
      steamParticles.attr.needsUpdate = true;
    }
  });

  if (doomsdayMode) {
    const ribs = 16;
    const boneMat = silhouetteOnly
      ? materials.skin
      : new THREE.MeshStandardMaterial({
          color: "#DDD5C4",
          roughness: 0.72,
          metalness: 0.05,
          transparent: xrayMode,
          opacity: xrayMode ? 0.35 : 1,
        });
    return (
      <group ref={rootRef} position={position} rotation={[0, rotationY, 0]} name="founding-doomsday">
        {Array.from({ length: ribs }).map((_, i) => {
          const z = -H * 0.65 + i * (H * 0.09);
          const archH = Math.sin((i / (ribs - 1)) * Math.PI) * H * 0.86 + H * 0.14;
          const ribW = Math.sin((i / (ribs - 1)) * Math.PI) * H * 0.24 + H * 0.08;
          return (
            <group key={i} position={[0, 0, z]}>
              <mesh position={[0, archH, 0]} material={boneMat} castShadow>
                <boxGeometry args={[H * 0.04, H * 0.045, H * 0.095]} />
              </mesh>
              <mesh position={[-ribW, archH * 0.5, 0]} rotation={[0, 0, 0.22]} material={boneMat} castShadow>
                <cylinderGeometry args={[H * 0.012, H * 0.016, archH * 1.05, 8]} />
              </mesh>
              <mesh position={[ribW, archH * 0.5, 0]} rotation={[0, 0, -0.22]} material={boneMat} castShadow>
                <cylinderGeometry args={[H * 0.012, H * 0.016, archH * 1.05, 8]} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, H * 0.74, H * 0.74]} material={boneMat} castShadow>
          <sphereGeometry args={[H * 0.065, 16, 14]} />
        </mesh>
        <mesh position={[0, H * 0.44, H * 0.7]} material={boneMat} castShadow>
          <cylinderGeometry args={[H * 0.03, H * 0.04, H * 0.55, 10]} />
        </mesh>
      </group>
    );
  }

  if (isQuadruped) {
    return (
      <group ref={rootRef} position={position} rotation={[0, rotationY, 0]} name={`titan-${titan.id}`}>
        <group position={[0, dims.legH * 0.72, 0]}>
          <mesh
            geometry={geos.torso}
            material={materials.skin}
            position={[0, 0, -dims.torsoH * 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          />
          <mesh
            geometry={geos.armorBack}
            material={materials.armor}
            position={[0, H * 0.16, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.8, 0.9, 0.7]}
            castShadow
          />
          <group ref={headRef} position={[0, H * 0.08, dims.torsoH * 0.62]}>
            <mesh geometry={geos.head} material={materials.skin} scale={[0.92, 0.85, 1.65]} castShadow />
            {[-1, 1].map((s) => (
              <mesh
                key={s}
                position={[s * dims.headH * 0.16, dims.headH * 0.06, dims.headH * 0.56]}
                material={materials.eye}
              >
                <sphereGeometry args={[dims.headH * 0.075, 8, 8]} />
              </mesh>
            ))}
          </group>
          {[-1, 1].map((side) => (
            <React.Fragment key={side}>
              <group position={[side * dims.shoulderHalf, 0, dims.torsoH * 0.38]}>
                <mesh geometry={geos.upperArm} material={materials.skin} castShadow />
                <mesh geometry={geos.forearm} material={materials.skin} position={[0, -geos.upperArmLen, 0]} castShadow />
              </group>
              <group position={[side * dims.hipHalf, 0, -dims.torsoH * 0.42]}>
                <mesh geometry={geos.thigh} material={materials.skin} castShadow />
                <mesh geometry={geos.calf} material={materials.skin} position={[0, -geos.thighLen, 0]} castShadow />
              </group>
            </React.Fragment>
          ))}
        </group>
      </group>
    );
  }

  const bodyMat =
    sil.proportionProfile === "colossal"
      ? materials.skin
      : sil.proportionProfile === "warhammer"
      ? materials.armor
      : sil.hasArmorPlates
      ? materials.muscle
      : materials.skin;

  return (
    <group ref={rootRef} position={position} rotation={[0, rotationY, 0]} name={`titan-${titan.id}`}>
      {/* Sleek Pelvis & Iliac Bridge matched to waist width (no protruding tire ring) */}
      <mesh
        position={[0, dims.legH * 0.98, 0]}
        scale={[dims.hipHalf * 1.48, H * 0.046, geos.legR * 1.05]}
        material={bodyMat}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>

      {/* Lower Limbs with Flush Joint Caps & Contoured Armor */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * dims.hipHalf, dims.legH, 0]}>
          {/* Hip ball bridge */}
          <mesh material={bodyMat} scale={[geos.legR * 0.96, geos.legR * 0.94, geos.legR * 0.96]} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh geometry={geos.thigh} material={bodyMat} castShadow receiveShadow />
          {sil.hasArmorPlates && (
            <mesh
              geometry={geos.armorThigh}
              material={materials.armor}
              position={[0, -geos.thighLen * 0.45, 0]}
              castShadow
            />
          )}
          <group position={[0, -geos.thighLen, 0]}>
            {/* Flush knee patella cap */}
            <mesh material={bodyMat} scale={[geos.legR * 0.7, geos.legR * 0.68, geos.legR * 0.72]} castShadow>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
            <mesh geometry={geos.calf} material={bodyMat} castShadow receiveShadow />
            {sil.hasArmorPlates && (
              <mesh
                geometry={geos.armorShin}
                material={materials.armor}
                position={[0, -geos.calfLen * 0.48, 0]}
                castShadow
              />
            )}
            <mesh
              geometry={geos.foot}
              material={bodyMat}
              position={[0, -geos.calfLen + H * 0.018, geos.legR * 0.65]}
              castShadow
              receiveShadow
            />
          </group>
        </group>
      ))}

      {/* Sculpted Torso, Contoured Armor Shells, Fur, Arms & Head */}
      <group ref={chestRef} position={[0, dims.legH * 0.96, 0]}>
        <mesh geometry={geos.torso} material={bodyMat} castShadow receiveShadow />

        {/* Contoured Dermal Armor Shells (Armored Titan / Jaw) */}
        {sil.hasArmorPlates && (
          <>
            <mesh
              geometry={geos.armorPec}
              material={materials.armor}
              position={[0, dims.torsoH * 0.71, 0.01]}
              castShadow
            />
            <mesh
              geometry={geos.armorAbs}
              material={materials.armor}
              position={[0, dims.torsoH * 0.36, 0.01]}
              castShadow
            />
            <mesh
              geometry={geos.armorBack}
              material={materials.armor}
              position={[0, dims.torsoH * 0.62, -0.01]}
              rotation={[0, Math.PI, 0]}
              castShadow
            />
          </>
        )}

        {/* Beast Titan Fur Tufts */}
        {furTufts.map((f, idx) => (
          <mesh key={idx} position={f.pos} rotation={f.rot} material={materials.fur} castShadow>
            <coneGeometry args={[f.s * 0.55, f.s * 1.9, 5]} />
          </mesh>
        ))}

        {/* Neck & Sculpted Cranial Head */}
        <mesh position={[0, dims.torsoH * 1.02, 0]} material={bodyMat} castShadow>
          <cylinderGeometry args={[dims.headH * 0.28, dims.headH * 0.38, dims.headH * 0.55, 14]} />
        </mesh>

        <group ref={headRef} position={[0, dims.torsoH + dims.headH * 0.56, dims.headH * 0.05]}>
          <mesh geometry={geos.head} material={bodyMat} castShadow receiveShadow />

          {/* Armored Titan Contoured Face Mask */}
          {sil.hasArmorPlates && (
            <mesh
              geometry={geos.armorFaceplate}
              material={materials.armor}
              position={[0, -dims.headH * 0.04, 0.02]}
              castShadow
            />
          )}

          {/* Realistic Eye Sclera + Glowing Iris */}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * dims.headH * 0.16, dims.headH * 0.07, dims.headH * 0.4]}>
              <mesh material={materials.sclera}>
                <sphereGeometry args={[dims.headH * 0.055, 10, 10]} />
              </mesh>
              <mesh position={[0, 0, dims.headH * 0.026]} material={materials.eye}>
                <sphereGeometry args={[dims.headH * 0.036, 10, 10]} />
              </mesh>
            </group>
          ))}

          {/* Exposed Multi-Row Titan Teeth */}
          {(sil.proportionProfile === "hero-muscular" ||
            sil.proportionProfile === "colossal" ||
            sil.proportionProfile === "jaw" ||
            sil.proportionProfile === "pure" ||
            sil.proportionProfile === "abnormal") && (
            <mesh position={[0, -dims.headH * 0.21, dims.headH * 0.37]} material={materials.sclera}>
              <boxGeometry args={[dims.headH * 0.3, dims.headH * 0.085, dims.headH * 0.1]} />
            </mesh>
          )}

          {/* Sculpted Hair Crown & Strands */}
          {sil.proportionProfile !== "colossal" && sil.proportionProfile !== "warhammer" && (
            <group>
              <mesh position={[0, dims.headH * 0.24, -dims.headH * 0.05]} material={materials.hair} castShadow>
                <sphereGeometry args={[dims.headH * 0.47, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.64]} />
              </mesh>
              {(sil.proportionProfile === "female" || sil.proportionProfile === "hero-muscular") && (
                <mesh
                  position={[0, -dims.headH * 0.08, -dims.headH * 0.32]}
                  rotation={[0.18, 0, 0]}
                  material={materials.hair}
                  castShadow
                >
                  <coneGeometry args={[dims.headH * 0.38, dims.headH * 0.9, 10]} />
                </mesh>
              )}
            </group>
          )}
        </group>

        {/* Left & Right Arms with Flush Deltoid & Elbow Joint Caps */}
        <group
          ref={leftArmRef}
          position={[-dims.shoulderHalf * 1.0, dims.torsoH * 0.87, 0]}
          rotation={[0, 0, -0.08]}
        >
          <mesh material={bodyMat} scale={[geos.armR * 1.08, geos.armR * 1.05, geos.armR * 1.06]} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh geometry={geos.upperArm} material={bodyMat} castShadow />
          {sil.hasArmorPlates && (
            <mesh
              geometry={geos.armorShoulder}
              material={materials.armor}
              position={[-geos.armR * 0.12, -geos.armR * 0.4, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              castShadow
            />
          )}
          <group position={[0, -geos.upperArmLen, 0]} rotation={[-0.2, 0, 0.04]}>
            <mesh material={bodyMat} scale={[geos.armR * 0.76, geos.armR * 0.76, geos.armR * 0.76]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh geometry={geos.forearm} material={bodyMat} castShadow />
            {sil.hasArmorPlates && (
              <mesh
                geometry={geos.armorForearm}
                material={materials.armor}
                position={[0, -geos.forearmLen * 0.44, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                castShadow
              />
            )}
          </group>
        </group>

        <group
          ref={rightArmRef}
          position={[dims.shoulderHalf * 1.0, dims.torsoH * 0.87, 0]}
          rotation={[0, 0, 0.08]}
        >
          <mesh material={bodyMat} scale={[geos.armR * 1.08, geos.armR * 1.05, geos.armR * 1.06]} castShadow>
            <sphereGeometry args={[1, 12, 10]} />
          </mesh>
          <mesh geometry={geos.upperArm} material={bodyMat} castShadow />
          {sil.hasArmorPlates && (
            <mesh
              geometry={geos.armorShoulder}
              material={materials.armor}
              position={[geos.armR * 0.12, -geos.armR * 0.4, 0]}
              rotation={[0, Math.PI / 2, 0]}
              castShadow
            />
          )}
          <group position={[0, -geos.upperArmLen, 0]} rotation={[-0.24, 0, -0.04]}>
            <mesh material={bodyMat} scale={[geos.armR * 0.76, geos.armR * 0.76, geos.armR * 0.76]} castShadow>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh geometry={geos.forearm} material={bodyMat} castShadow />
            {sil.hasArmorPlates && (
              <mesh
                geometry={geos.armorForearm}
                material={materials.armor}
                position={[0, -geos.forearmLen * 0.44, 0]}
                rotation={[0, Math.PI / 2, 0]}
                castShadow
              />
            )}
            {sil.proportionProfile === "warhammer" && (
              <group position={[0, -geos.forearmLen * 0.92, H * 0.04]} rotation={[1.35, 0, 0]}>
                <mesh geometry={geos.hammerShaft} material={materials.armor} castShadow />
                <mesh geometry={geos.hammerHead} material={materials.armor} position={[0, H * 0.25, 0]} castShadow />
              </group>
            )}
          </group>
        </group>
      </group>

      {/* Soft Radial Steam Puff Sprites (NO square pixel blobs!) */}
      {emitSteam && steamParticles && !silhouetteOnly && (
        <points ref={steamRef} geometry={steamParticles.g}>
          <pointsMaterial
            map={smokeTex}
            color="#ebeef2"
            size={H * 0.18}
            transparent
            opacity={0.22}
            alphaTest={0.01}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
};
