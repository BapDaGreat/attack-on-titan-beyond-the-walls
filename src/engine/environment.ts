import * as THREE from "three";

export type TimeOfDay = "morning" | "midday" | "sunset" | "night";
export type WeatherMode = "clear" | "overcast" | "rain" | "storm";
export type QualityPreset = "ultra" | "high" | "medium" | "low";

export interface AtmosphereState {
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  envIntensity: number;
  fogColor: THREE.Color;
  fogDensity: number;
  skyStops: [THREE.Color, THREE.Color, THREE.Color, THREE.Color, THREE.Color, THREE.Color];
  sunGlow: number;
  starOpacity: number;
  cloudStrength: number;
  exposure: number;
}

export const TIME_PRESETS: Record<TimeOfDay, AtmosphereState> = {
  morning: {
    sunElevationDeg: 22,
    sunAzimuthDeg: 42,
    sunColor: new THREE.Color("#FFE0B5"),
    sunIntensity: 2.6,
    hemiSky: new THREE.Color("#B8CBE0"),
    hemiGround: new THREE.Color("#4B4639"),
    hemiIntensity: 0.65,
    envIntensity: 0.55,
    fogColor: new THREE.Color("#C7B9A5"),
    fogDensity: 0.0022,
    skyStops: [
      new THREE.Color("#8B8174"),
      new THREE.Color("#D4B99B"),
      new THREE.Color("#B4C6D9"),
      new THREE.Color("#7397BC"),
      new THREE.Color("#466D9B"),
      new THREE.Color("#294772"),
    ],
    sunGlow: 1.15,
    starOpacity: 0,
    cloudStrength: 0.45,
    exposure: 1.02,
  },
  midday: {
    sunElevationDeg: 58,
    sunAzimuthDeg: 28,
    sunColor: new THREE.Color("#FFF4DF"),
    sunIntensity: 3.1,
    hemiSky: new THREE.Color("#CDE1F5"),
    hemiGround: new THREE.Color("#56503F"),
    hemiIntensity: 0.72,
    envIntensity: 0.65,
    fogColor: new THREE.Color("#C2CED6"),
    fogDensity: 0.0017,
    skyStops: [
      new THREE.Color("#7C888F"),
      new THREE.Color("#C6D1D8"),
      new THREE.Color("#9BBAD4"),
      new THREE.Color("#5A8BBF"),
      new THREE.Color("#3366A1"),
      new THREE.Color("#1E457A"),
    ],
    sunGlow: 0.95,
    starOpacity: 0,
    cloudStrength: 0.38,
    exposure: 1.0,
  },
  sunset: {
    sunElevationDeg: 8.5,
    sunAzimuthDeg: -56,
    sunColor: new THREE.Color("#FF8F49"),
    sunIntensity: 2.45,
    hemiSky: new THREE.Color("#B3796B"),
    hemiGround: new THREE.Color("#352822"),
    hemiIntensity: 0.58,
    envIntensity: 0.48,
    fogColor: new THREE.Color("#8E6254"),
    fogDensity: 0.0028,
    skyStops: [
      new THREE.Color("#4D352E"),
      new THREE.Color("#B56D4E"),
      new THREE.Color("#A65B4C"),
      new THREE.Color("#63495D"),
      new THREE.Color("#343452"),
      new THREE.Color("#191D33"),
    ],
    sunGlow: 1.35,
    starOpacity: 0.14,
    cloudStrength: 0.52,
    exposure: 1.05,
  },
  night: {
    sunElevationDeg: 28,
    sunAzimuthDeg: -135,
    sunColor: new THREE.Color("#96B4DC"), // crisp moonlight key
    sunIntensity: 0.92,
    hemiSky: new THREE.Color("#29384D"),
    hemiGround: new THREE.Color("#131715"),
    hemiIntensity: 0.42,
    envIntensity: 0.28,
    fogColor: new THREE.Color("#151C26"),
    fogDensity: 0.0034,
    skyStops: [
      new THREE.Color("#0B0F14"),
      new THREE.Color("#17202C"),
      new THREE.Color("#152030"),
      new THREE.Color("#0F1826"),
      new THREE.Color("#09101A"),
      new THREE.Color("#05080F"),
    ],
    sunGlow: 0.42,
    starOpacity: 0.95,
    cloudStrength: 0.24,
    exposure: 0.96,
  },
};

export interface WeatherModifier {
  sunMult: number;
  fogMult: number;
  cloudAdd: number;
  fogTint: THREE.Color;
  fogTintMix: number;
  rainDensity: number;
  hasLightning: boolean;
}

export const WEATHER_MODIFIERS: Record<WeatherMode, WeatherModifier> = {
  clear: {
    sunMult: 1.0,
    fogMult: 1.0,
    cloudAdd: 0,
    fogTint: new THREE.Color("#889094"),
    fogTintMix: 0,
    rainDensity: 0,
    hasLightning: false,
  },
  overcast: {
    sunMult: 0.52,
    fogMult: 1.65,
    cloudAdd: 0.42,
    fogTint: new THREE.Color("#8B918E"),
    fogTintMix: 0.55,
    rainDensity: 0,
    hasLightning: false,
  },
  rain: {
    sunMult: 0.36,
    fogMult: 2.15,
    cloudAdd: 0.55,
    fogTint: new THREE.Color("#5D666A"),
    fogTintMix: 0.72,
    rainDensity: 0.65,
    hasLightning: false,
  },
  storm: {
    sunMult: 0.22,
    fogMult: 2.6,
    cloudAdd: 0.65,
    fogTint: new THREE.Color("#3D454B"),
    fogTintMix: 0.82,
    rainDensity: 1.0,
    hasLightning: true,
  },
};

export interface QualityConfig {
  label: string;
  maxDpr: number;
  shadowMapSize: number;
  enableAO: boolean;
  enableBloom: boolean;
  enableDoF: boolean;
  npcDensity: number;
  foliageDensity: number;
}

export const QUALITY_CONFIGS: Record<QualityPreset, QualityConfig> = {
  ultra: {
    label: "Ultra (200% Retina)",
    maxDpr: 2.0,
    shadowMapSize: 2048,
    enableAO: true,
    enableBloom: true,
    enableDoF: true,
    npcDensity: 1.0,
    foliageDensity: 1.0,
  },
  high: {
    label: "High",
    maxDpr: 1.75,
    shadowMapSize: 2048,
    enableAO: true,
    enableBloom: true,
    enableDoF: false,
    npcDensity: 0.85,
    foliageDensity: 0.85,
  },
  medium: {
    label: "Medium",
    maxDpr: 1.35,
    shadowMapSize: 1024,
    enableAO: false,
    enableBloom: true,
    enableDoF: false,
    npcDensity: 0.55,
    foliageDensity: 0.55,
  },
  low: {
    label: "Low",
    maxDpr: 1.0,
    shadowMapSize: 0,
    enableAO: false,
    enableBloom: false,
    enableDoF: false,
    npcDensity: 0.3,
    foliageDensity: 0.35,
  },
};

export function cloneAtmosphere(src: AtmosphereState): AtmosphereState {
  return {
    ...src,
    sunColor: src.sunColor.clone(),
    hemiSky: src.hemiSky.clone(),
    hemiGround: src.hemiGround.clone(),
    fogColor: src.fogColor.clone(),
    skyStops: [
      src.skyStops[0].clone(),
      src.skyStops[1].clone(),
      src.skyStops[2].clone(),
      src.skyStops[3].clone(),
      src.skyStops[4].clone(),
      src.skyStops[5].clone(),
    ],
  };
}

export function lerpAtmosphere(
  out: AtmosphereState,
  a: AtmosphereState,
  b: AtmosphereState,
  t: number,
  weather: WeatherModifier
): void {
  const k = Math.max(0, Math.min(1, t));
  out.sunElevationDeg = THREE.MathUtils.lerp(a.sunElevationDeg, b.sunElevationDeg, k);
  out.sunAzimuthDeg = THREE.MathUtils.lerp(a.sunAzimuthDeg, b.sunAzimuthDeg, k);
  out.sunColor.copy(a.sunColor).lerp(b.sunColor, k);
  out.sunIntensity = THREE.MathUtils.lerp(a.sunIntensity, b.sunIntensity, k) * weather.sunMult;
  out.hemiSky.copy(a.hemiSky).lerp(b.hemiSky, k);
  out.hemiGround.copy(a.hemiGround).lerp(b.hemiGround, k);
  out.hemiIntensity = THREE.MathUtils.lerp(a.hemiIntensity, b.hemiIntensity, k);
  out.envIntensity = THREE.MathUtils.lerp(a.envIntensity, b.envIntensity, k);
  out.fogColor
    .copy(a.fogColor)
    .lerp(b.fogColor, k)
    .lerp(weather.fogTint, weather.fogTintMix * 0.65);
  out.fogDensity = THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, k) * weather.fogMult;
  out.sunGlow = THREE.MathUtils.lerp(a.sunGlow, b.sunGlow, k) * (0.4 + 0.6 * weather.sunMult);
  out.starOpacity = THREE.MathUtils.lerp(a.starOpacity, b.starOpacity, k) * (1 - weather.cloudAdd * 0.9);
  out.cloudStrength = Math.min(1, THREE.MathUtils.lerp(a.cloudStrength, b.cloudStrength, k) + weather.cloudAdd);
  out.exposure = THREE.MathUtils.lerp(a.exposure, b.exposure, k);

  for (let i = 0; i < 6; i++) {
    out.skyStops[i]
      .copy(a.skyStops[i])
      .lerp(b.skyStops[i], k)
      .lerp(weather.fogTint, weather.fogTintMix * 0.58);
  }
}

export function sunVectorFromAngles(elevDeg: number, azimDeg: number, radius = 140): THREE.Vector3 {
  const elev = THREE.MathUtils.degToRad(elevDeg);
  const azim = THREE.MathUtils.degToRad(azimDeg);
  return new THREE.Vector3(
    Math.cos(elev) * Math.sin(azim) * radius,
    Math.sin(elev) * radius,
    Math.cos(elev) * Math.cos(azim) * radius
  );
}

/**
 * Generates a real contrasty studio/outdoor HDR-style PMREM environment texture
 * following `3d-metal-material` so ODM steel blades & Armored plates catch crisp speculars.
 */
export function buildStudioMetalEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0b0e12);

  // High-luminance window/sky light cards (toneMapped: false for >1 radiance)
  const makeCard = (
    w: number,
    h: number,
    pos: [number, number, number],
    lookAt: [number, number, number],
    color: [number, number, number]
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setRGB(color[0], color[1], color[2], THREE.LinearSRGBColorSpace),
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.lookAt(...lookAt);
    envScene.add(m);
  };

  // Warm sun sky panel
  makeCard(14, 9, [18, 16, 14], [0, 0, 0], [3.4, 3.0, 2.4]);
  // Cool atmospheric fill strip
  makeCard(16, 12, [-22, 10, 8], [0, 0, 0], [0.55, 0.72, 1.05]);
  // Crisp rim panel
  makeCard(10, 14, [6, 14, -20], [0, 0, 0], [1.8, 1.5, 1.1]);
  // Warm stone ground bounce
  makeCard(28, 28, [0, -14, 0], [0, 0, 0], [0.22, 0.18, 0.14]);

  const rt = pmrem.fromScene(envScene, 0.015);
  pmrem.dispose();
  envScene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
  return rt.texture;
}
