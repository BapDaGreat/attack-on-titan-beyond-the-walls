"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AtmosphereState,
  QUALITY_CONFIGS,
  QualityPreset,
  TIME_PRESETS,
  TimeOfDay,
  WEATHER_MODIFIERS,
  WeatherMode,
  buildStudioMetalEnvironment,
  cloneAtmosphere,
  lerpAtmosphere,
  sunVectorFromAngles,
} from "@/engine/environment";
import { SKY_DOME_FRAG, SKY_DOME_VERT } from "@/engine/shaders";
import { createSeededRng } from "@/engine/noise";

interface WorldAtmosphereProps {
  timeOfDay: TimeOfDay;
  weather: WeatherMode;
  quality: QualityPreset;
  reducedMotion: boolean;
  cameraDistanceScale?: number;
}

export const WorldAtmosphere: React.FC<WorldAtmosphereProps> = ({
  timeOfDay,
  weather,
  quality,
  reducedMotion,
  cameraDistanceScale = 1,
}) => {
  const { scene, gl, camera } = useThree();
  const qCfg = QUALITY_CONFIGS[quality];

  // Smooth atmosphere interpolation state (never snaps mid-transition per `threejs-landscape`)
  const interpRef = useRef<{
    from: AtmosphereState;
    to: AtmosphereState;
    current: AtmosphereState;
    progress: number;
    lastTimeKey: TimeOfDay;
  }>({
    from: cloneAtmosphere(TIME_PRESETS[timeOfDay]),
    to: cloneAtmosphere(TIME_PRESETS[timeOfDay]),
    current: cloneAtmosphere(TIME_PRESETS[timeOfDay]),
    progress: 1,
    lastTimeKey: timeOfDay,
  });

  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const skyMeshRef = useRef<THREE.Mesh>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const lightningLightRef = useRef<THREE.DirectionalLight>(null);
  const starPointsRef = useRef<THREE.Points>(null);
  const rainRef = useRef<THREE.LineSegments>(null);

  const lightningState = useRef({ timer: 3.5, intensity: 0 });

  // Bind HDR PMREM studio/outdoor reflection map once
  useEffect(() => {
    const envTex = buildStudioMetalEnvironment(gl);
    scene.environment = envTex;
    return () => {
      if (scene.environment === envTex) scene.environment = null;
      envTex.dispose();
    };
  }, [gl, scene]);

  // Trigger smooth cross-fade when timeOfDay changes
  useEffect(() => {
    const st = interpRef.current;
    if (st.lastTimeKey !== timeOfDay) {
      st.from = cloneAtmosphere(st.current);
      st.to = cloneAtmosphere(TIME_PRESETS[timeOfDay]);
      st.progress = reducedMotion ? 1 : 0;
      st.lastTimeKey = timeOfDay;
    }
  }, [timeOfDay, reducedMotion]);

  // Configure fog on scene mount
  useEffect(() => {
    const fog = new THREE.FogExp2(TIME_PRESETS[timeOfDay].fogColor.getHex(), 0.0018);
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  // Sky uniforms
  const skyUniforms = useMemo(
    () => ({
      uSky0: { value: TIME_PRESETS[timeOfDay].skyStops[0].clone() },
      uSky1: { value: TIME_PRESETS[timeOfDay].skyStops[1].clone() },
      uSky2: { value: TIME_PRESETS[timeOfDay].skyStops[2].clone() },
      uSky3: { value: TIME_PRESETS[timeOfDay].skyStops[3].clone() },
      uSky4: { value: TIME_PRESETS[timeOfDay].skyStops[4].clone() },
      uSky5: { value: TIME_PRESETS[timeOfDay].skyStops[5].clone() },
      uSunDir: { value: new THREE.Vector3(0.4, 0.5, 0.7) },
      uSunColor: { value: TIME_PRESETS[timeOfDay].sunColor.clone() },
      uSunGlow: { value: 1.0 },
      uCloudStrength: { value: 0.45 },
      uTime: { value: 0 },
    }),
    []
  );

  // Starfield restricted to upper visible sky hemisphere (`threejs-landscape` rule)
  const starGeometry = useMemo(() => {
    const count = 4200;
    const pos = new Float32Array(count * 3);
    const rng = createSeededRng(104850);
    for (let i = 0; i < count; i++) {
      const az = rng() * Math.PI * 2;
      const elev = 0.04 + Math.pow(rng(), 0.72) * (Math.PI * 0.48);
      const r = 1850;
      pos[i * 3] = Math.cos(elev) * Math.cos(az) * r;
      pos[i * 3 + 1] = Math.sin(elev) * r;
      pos[i * 3 + 2] = Math.cos(elev) * Math.sin(az) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // Frustum-anchored rain pool (`threejs-weather`: allocate max pool once, vary drawRange)
  const rainPool = useMemo(() => {
    const maxDrops = 1600;
    const arr = new Float32Array(maxDrops * 6);
    const speeds = new Float32Array(maxDrops);
    const rng = createSeededRng(84501);
    for (let i = 0; i < maxDrops; i++) {
      const x = (rng() - 0.5) * 48;
      const y = rng() * 34;
      const z = (rng() - 0.5) * 48;
      speeds[i] = 24 + rng() * 14;
      const base = i * 6;
      arr[base] = x;
      arr[base + 1] = y;
      arr[base + 2] = z;
      arr[base + 3] = x - 0.18;
      arr[base + 4] = y + 1.15;
      arr[base + 5] = z - 0.1;
    }
    const geo = new THREE.BufferGeometry();
    const attr = new THREE.Float32BufferAttribute(arr, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", attr);
    return { geo, attr, speeds, maxDrops };
  }, []);

  useEffect(() => {
    return () => {
      starGeometry.dispose();
      rainPool.geo.dispose();
    };
  }, [starGeometry, rainPool]);

  const forwardVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const st = interpRef.current;
    const wMod = WEATHER_MODIFIERS[weather];

    if (st.progress < 1) {
      st.progress = reducedMotion ? 1 : Math.min(1, st.progress + dt * 0.9);
    }
    const ease = st.progress * st.progress * (3 - 2 * st.progress);
    lerpAtmosphere(st.current, st.from, st.to, ease, wMod);

    const cur = st.current;
    const sunVec = sunVectorFromAngles(cur.sunElevationDeg, cur.sunAzimuthDeg, 160 * cameraDistanceScale);

    // Keep sky dome centered on camera so horizon never exhibits parallax
    if (skyMeshRef.current) {
      skyMeshRef.current.position.copy(camera.position);
    }
    if (starPointsRef.current) {
      starPointsRef.current.position.copy(camera.position);
      const mat = starPointsRef.current.material as THREE.PointsMaterial;
      mat.opacity = cur.starOpacity;
      mat.size = 1.9 * Math.min(window.devicePixelRatio || 1, 2);
      starPointsRef.current.visible = cur.starOpacity > 0.02;
    }

    if (skyMatRef.current) {
      const u = skyMatRef.current.uniforms;
      for (let i = 0; i < 6; i++) {
        u[`uSky${i}`].value.copy(cur.skyStops[i]);
      }
      u.uSunDir.value.copy(sunVec).normalize();
      u.uSunColor.value.copy(cur.sunColor);
      u.uSunGlow.value = cur.sunGlow;
      u.uCloudStrength.value = cur.cloudStrength;
      if (!reducedMotion) u.uTime.value += dt;
    }

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunVec);
      sunLightRef.current.color.copy(cur.sunColor);
      sunLightRef.current.intensity = cur.sunIntensity;
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(cur.hemiSky);
      hemiLightRef.current.groundColor.copy(cur.hemiGround);
      hemiLightRef.current.intensity = cur.hemiIntensity;
    }
    if (scene.fog && (scene.fog as THREE.FogExp2).isFogExp2) {
      const fog = scene.fog as THREE.FogExp2;
      fog.color.copy(cur.fogColor);
      fog.density = cur.fogDensity / Math.max(0.6, cameraDistanceScale);
    }

    gl.toneMappingExposure = cur.exposure;
    scene.environmentIntensity = cur.envIntensity;

    // Storm lightning independent directional light (`threejs-weather`)
    if (lightningLightRef.current) {
      if (wMod.hasLightning && !reducedMotion) {
        lightningState.current.timer -= dt;
        if (lightningState.current.timer <= 0) {
          lightningState.current.intensity = 4.5 + Math.random() * 2.5;
          lightningState.current.timer = 4.2 + Math.random() * 5.8;
          const angle = Math.random() * Math.PI * 2;
          lightningLightRef.current.position.set(Math.cos(angle) * 120, 95, Math.sin(angle) * 120);
        }
        lightningState.current.intensity *= Math.exp(-dt * 11);
        lightningLightRef.current.intensity = lightningState.current.intensity;
      } else {
        lightningLightRef.current.intensity = 0;
      }
    }

    // Frustum-anchored rain updates (`threejs-weather` rule: write to attr.array, scale drawRange)
    if (rainRef.current) {
      const activeCount = Math.floor(rainPool.maxDrops * wMod.rainDensity);
      rainRef.current.visible = activeCount > 0;
      rainPool.geo.setDrawRange(0, activeCount * 2);

      if (activeCount > 0 && !reducedMotion) {
        camera.getWorldDirection(forwardVec);
        rainRef.current.position.set(
          camera.position.x + forwardVec.x * 22,
          Math.max(0, camera.position.y - 12),
          camera.position.z + forwardVec.z * 22
        );
        const arr = rainPool.attr.array as Float32Array;
        const speedMult = weather === "storm" ? 1.45 : 1.0;
        const slant = weather === "storm" ? 0.42 : 0.16;

        for (let i = 0; i < activeCount; i++) {
          const base = i * 6;
          const dy = rainPool.speeds[i] * speedMult * dt;
          arr[base + 1] -= dy;
          arr[base] -= slant * dy;
          if (arr[base + 1] < -4) {
            arr[base + 1] = 30;
            arr[base] = ((i * 73) % 48) - 24;
          }
          arr[base + 3] = arr[base] - slant * 1.1;
          arr[base + 4] = arr[base + 1] + (weather === "storm" ? 1.55 : 1.05);
          arr[base + 5] = arr[base + 2] - 0.1;
        }
        rainPool.attr.needsUpdate = true;
      }
    }
  });

  const shadowBounds = 95 * cameraDistanceScale;

  return (
    <group name="atmosphere-root">
      {/* Surrounding Atmospheric Sky Dome */}
      <mesh ref={skyMeshRef} name="sky-dome" frustumCulled={false} renderOrder={-10}>
        <sphereGeometry args={[2100, 32, 20]} />
        <shaderMaterial
          ref={skyMatRef}
          vertexShader={SKY_DOME_VERT}
          fragmentShader={SKY_DOME_FRAG}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* DPR-scaled visible night stars */}
      <points ref={starPointsRef} geometry={starGeometry} frustumCulled={false}>
        <pointsMaterial
          color="#e5ecfa"
          size={1.9}
          sizeAttenuation={false}
          transparent
          opacity={0}
          depthWrite={false}
          fog={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Primary Key Sunlight */}
      <directionalLight
        ref={sunLightRef}
        castShadow={qCfg.shadowMapSize > 0}
        shadow-mapSize-width={qCfg.shadowMapSize || 512}
        shadow-mapSize-height={qCfg.shadowMapSize || 512}
        shadow-camera-near={10}
        shadow-camera-far={480 * cameraDistanceScale}
        shadow-camera-left={-shadowBounds}
        shadow-camera-right={shadowBounds}
        shadow-camera-top={shadowBounds}
        shadow-camera-bottom={-shadowBounds}
        shadow-bias={-0.00035}
        shadow-normalBias={0.025}
      />

      {/* Atmospheric Fill Hemisphere */}
      <hemisphereLight ref={hemiLightRef} intensity={0.65} />

      {/* Storm Lightning Bolt Light */}
      <directionalLight ref={lightningLightRef} color="#d9e7ff" intensity={0} />

      {/* Frustum-anchored Rain Volume */}
      <lineSegments ref={rainRef} geometry={rainPool.geo} frustumCulled={false} visible={false}>
        <lineBasicMaterial color="#b4c2cb" transparent opacity={0.38} depthWrite={false} />
      </lineSegments>
    </group>
  );
};
