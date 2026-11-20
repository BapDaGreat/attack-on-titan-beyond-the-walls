import * as THREE from "three";
import { fbm2D, hash2, smoothstep } from "./noise";

export interface PbrTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

const cache = new Map<string, PbrTextureSet>();
const singleTexCache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
  anisotropy = 8
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Converts a scalar height buffer [0..1] into a tangent-space normal map canvas
 * and a roughness canvas simultaneously so surface cracks, mortar, and fibers match in register.
 */
function heightToNormalAndRoughness(
  height: Float32Array,
  size: number,
  strength: number,
  roughBase: number,
  roughAmp: number
): { normalCanvas: HTMLCanvasElement; roughCanvas: HTMLCanvasElement } {
  const [normalCanvas, nCtx] = makeCanvas(size);
  const [roughCanvas, rCtx] = makeCanvas(size);
  const nImg = nCtx.createImageData(size, size);
  const rImg = rCtx.createImageData(size, size);

  const sample = (x: number, y: number) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return height[wy * size + wx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hL = sample(x - 1, y);
      const hR = sample(x + 1, y);
      const hU = sample(x, y - 1);
      const hD = sample(x, y + 1);

      const dx = (hL - hR) * strength;
      const dy = (hU - hD) * strength;
      const dz = 1.0;
      const invLen = 1 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      nImg.data[idx] = Math.round(((dx * invLen) * 0.5 + 0.5) * 255);
      nImg.data[idx + 1] = Math.round(((dy * invLen) * 0.5 + 0.5) * 255);
      nImg.data[idx + 2] = Math.round(((dz * invLen) * 0.5 + 0.5) * 255);
      nImg.data[idx + 3] = 255;

      const hC = sample(x, y);
      // Crevices stay matte & rough; exposed ridges wear slightly smoother
      const rVal = Math.max(
        15,
        Math.min(252, Math.round((roughBase + (1 - hC) * roughAmp) * 255))
      );
      rImg.data[idx] = rVal;
      rImg.data[idx + 1] = rVal;
      rImg.data[idx + 2] = rVal;
      rImg.data[idx + 3] = 255;
    }
  }

  nCtx.putImageData(nImg, 0, 0);
  rCtx.putImageData(rImg, 0, 0);
  return { normalCanvas, roughCanvas };
}

/**
 * 1. Wall Masonry PBR Set (Ashlar stone courses + mortar recesses + vertical rainwater grime + moss)
 */
export function getWallMasonryTextures(anisotropy = 8): PbrTextureSet {
  const key = `wall-masonry-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);

  const rows = 8;
  const cols = 4;
  const rowH = size / rows;
  const colW = size / cols;

  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / rowH);
    const ry = (y % rowH) / rowH;
    const stagger = (row % 2) * (colW * 0.5);

    for (let x = 0; x < size; x++) {
      const sx = (x + stagger) % size;
      const col = Math.floor(sx / colW);
      const rx = (sx % colW) / colW;

      const blockSeed = hash2(col + row * 17, row * 31 + 7);
      const edgeX = Math.min(rx, 1 - rx) * colW;
      const edgeY = Math.min(ry, 1 - ry) * rowH;
      const mortar = Math.min(1, Math.min(edgeX, edgeY) / 4.5);

      const micro = fbm2D(x * 0.06, y * 0.06, 3) * 0.5 + 0.5;
      const crack = Math.abs(fbm2D(x * 0.035 + 12, y * 0.035 - 5, 3));
      const crackDip = crack < 0.045 ? (0.045 - crack) * 8 : 0;

      const streak = fbm2D(x * 0.09, y * 0.012, 2) * 0.5 + 0.5;
      const h = Math.max(
        0,
        mortar * (0.62 + blockSeed * 0.16 + micro * 0.22) - crackDip * 0.3
      );
      height[y * size + x] = h;

      // Base warm granite/limestone tone (not sterile gray)
      const baseTone = 148 + blockSeed * 26 + (micro - 0.5) * 28 - crackDip * 35;
      const mortarMask = 1 - mortar;
      const moss = smoothstep(0.66, 0.85, streak) * 0.22;

      const r = Math.max(
        24,
        Math.min(
          235,
          baseTone * (1 - mortarMask * 0.42) * (1 - moss * 0.35) + 4
        )
      );
      const g = Math.max(
        24,
        Math.min(
          235,
          (baseTone - 4) * (1 - mortarMask * 0.42) * (1 - moss * 0.12) + 8 * moss
        )
      );
      const b = Math.max(
        22,
        Math.min(
          230,
          (baseTone - 14) * (1 - mortarMask * 0.44) * (1 - moss * 0.45)
        )
      );

      const idx = (y * size + x) * 4;
      cImg.data[idx] = r;
      cImg.data[idx + 1] = g;
      cImg.data[idx + 2] = b;
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    3.6,
    0.72,
    0.24
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 2. Cobblestone Street PBR Set (Staggered medieval granite pavers + damp mortar)
 */
export function getCobblestoneTextures(anisotropy = 8): PbrTextureSet {
  const key = `cobble-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);

  const cells = 12;
  const cellSize = size / cells;

  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / cellSize);
    const ry = (y % cellSize) / cellSize;
    const offset = (row % 2) * (cellSize * 0.5);

    for (let x = 0; x < size; x++) {
      const sx = (x + offset) % size;
      const col = Math.floor(sx / cellSize);
      const rx = (sx % cellSize) / cellSize;

      const jitter = (hash2(col * 7 + row * 13, row * 29) - 0.5) * 0.14;
      const dx = rx - 0.5 + jitter;
      const dy = ry - 0.5;
      const rad = Math.hypot(dx * 1.1, dy * 1.25);
      const dome = Math.max(0, 1 - smoothstep(0.32, 0.54, rad));

      const stoneVar = hash2(col * 19 + row, row * 41 + col);
      const grain = fbm2D(x * 0.11, y * 0.11, 2) * 0.5 + 0.5;
      const h = dome * (0.72 + stoneVar * 0.15 + grain * 0.13);
      height[y * size + x] = h;

      const tone = 82 + stoneVar * 34 + (grain - 0.5) * 18;
      const joint = 1 - dome;
      const idx = (y * size + x) * 4;
      cImg.data[idx] = Math.round(tone * (1 - joint * 0.55) + joint * 38);
      cImg.data[idx + 1] = Math.round((tone - 3) * (1 - joint * 0.55) + joint * 36);
      cImg.data[idx + 2] = Math.round((tone - 9) * (1 - joint * 0.55) + joint * 32);
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    4.2,
    0.58,
    0.34
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 3. Medieval Oak / Cedar Timber PBR Set (`3d-wood-material` principles)
 * Growth-ring bands, vessel pores, longitudinal fibers, end-grain contrast.
 */
export function getTimberTextures(
  variant: "oak" | "dark-beam" | "hinoki" = "oak",
  anisotropy = 8
): PbrTextureSet {
  const key = `timber-${variant}-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);

  const palette =
    variant === "dark-beam"
      ? { pale: [96, 66, 44], dark: [42, 26, 16] }
      : variant === "hinoki"
      ? { pale: [198, 166, 122], dark: [134, 96, 56] }
      : { pale: [148, 106, 66], dark: [78, 48, 26] };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Stretch along X as plank length, growth rings across Y
      const wobble = fbm2D(x * 0.012, y * 0.05, 3) * 1.4;
      const ringDist = (y / size) * 18 + wobble;
      const phase = ringDist - Math.floor(ringDist);
      const late = smoothstep(0.68, 0.88, phase) * (1 - smoothstep(0.92, 1.0, phase));
      const pores = smoothstep(0.55, 0.82, fbm2D(x * 0.04, y * 0.35, 2) * 0.5 + 0.5);
      const fibers = fbm2D(x * 0.02, y * 0.6, 2) * 0.5 + 0.5;

      const tone = Math.min(1, Math.max(0, 0.14 + late * 0.58 + pores * 0.2 - fibers * 0.1));
      height[y * size + x] = 0.72 - pores * 0.35 - late * 0.14 + fibers * 0.12;

      const idx = (y * size + x) * 4;
      cImg.data[idx] = Math.round(palette.pale[0] + (palette.dark[0] - palette.pale[0]) * tone);
      cImg.data[idx + 1] = Math.round(palette.pale[1] + (palette.dark[1] - palette.pale[1]) * tone);
      cImg.data[idx + 2] = Math.round(palette.pale[2] + (palette.dark[2] - palette.pale[2]) * tone);
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    2.4,
    0.58,
    0.28
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 4. Slate / Terracotta Shingled Roof PBR Set
 */
export function getRoofTileTextures(
  style: "clay" | "slate" = "clay",
  anisotropy = 8
): PbrTextureSet {
  const key = `roof-${style}-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);

  const rows = 14;
  const cols = 10;
  const rowH = size / rows;
  const colW = size / cols;

  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / rowH);
    const ry = (y % rowH) / rowH;
    const stagger = (row % 2) * (colW * 0.5);

    for (let x = 0; x < size; x++) {
      const sx = (x + stagger) % size;
      const col = Math.floor(sx / colW);
      const rx = (sx % colW) / colW;

      const seed = hash2(col * 11 + row, row * 23);
      const arch = Math.sin(rx * Math.PI);
      const stepLip = smoothstep(0.0, 0.14, ry);
      const h = (0.35 + arch * 0.45) * stepLip * (0.85 + seed * 0.15);
      height[y * size + x] = h;

      const grit = fbm2D(x * 0.09, y * 0.09, 2) * 0.5 + 0.5;
      const moss = smoothstep(0.68, 0.9, fbm2D(x * 0.03 + 7, y * 0.03 - 9, 3) * 0.5 + 0.5) * 0.35;

      let r: number, g: number, b: number;
      if (style === "clay") {
        r = (146 + seed * 28 + (grit - 0.5) * 18) * (0.72 + stepLip * 0.28) * (1 - moss * 0.45);
        g = (82 + seed * 18 + (grit - 0.5) * 14) * (0.72 + stepLip * 0.28) + moss * 36;
        b = (58 + seed * 14 + (grit - 0.5) * 10) * (0.72 + stepLip * 0.28) * (1 - moss * 0.4);
      } else {
        r = (66 + seed * 18 + (grit - 0.5) * 14) * (0.74 + stepLip * 0.26) * (1 - moss * 0.3);
        g = (72 + seed * 18 + (grit - 0.5) * 14) * (0.74 + stepLip * 0.26) + moss * 26;
        b = (78 + seed * 16 + (grit - 0.5) * 12) * (0.74 + stepLip * 0.26) * (1 - moss * 0.3);
      }

      const idx = (y * size + x) * 4;
      cImg.data[idx] = Math.max(15, Math.min(240, Math.round(r)));
      cImg.data[idx + 1] = Math.max(15, Math.min(240, Math.round(g)));
      cImg.data[idx + 2] = Math.max(15, Math.min(240, Math.round(b)));
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    3.8,
    style === "slate" ? 0.56 : 0.68,
    0.26
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 5. Weathered European Lime Plaster PBR Set
 */
export function getPlasterTextures(tintHex = "#DDD3BE", anisotropy = 4): PbrTextureSet {
  const key = `plaster-${tintHex}-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const baseCol = new THREE.Color(tintHex);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const blotch = fbm2D(x * 0.025, y * 0.025, 3) * 0.5 + 0.5;
      const grit = fbm2D(x * 0.16, y * 0.16, 2) * 0.5 + 0.5;
      const crack = Math.abs(fbm2D(x * 0.045 + 30, y * 0.045 - 11, 3));
      const crackMask = crack < 0.028 ? (0.028 - crack) * 14 : 0;
      const bottomDamp = smoothstep(0.76, 1.0, y / size) * 0.22;

      const h = Math.max(0, 0.55 + (blotch - 0.5) * 0.2 + (grit - 0.5) * 0.18 - crackMask * 0.4);
      height[y * size + x] = h;

      const shade = (0.88 + blotch * 0.16 - crackMask * 0.22 - bottomDamp) * (0.94 + grit * 0.08);
      const idx = (y * size + x) * 4;
      cImg.data[idx] = Math.min(245, Math.round(baseCol.r * 255 * shade));
      cImg.data[idx + 1] = Math.min(245, Math.round(baseCol.g * 255 * shade));
      cImg.data[idx + 2] = Math.min(245, Math.round(baseCol.b * 255 * shade));
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    1.8,
    0.76,
    0.18
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 6. Titan Muscle Fiber / Hardened Armor PBR Set
 */
export function getTitanSurfaceTextures(
  mode: "muscle" | "armor" | "skin",
  baseHex: string,
  anisotropy = 4
): PbrTextureSet {
  const key = `titan-${mode}-${baseHex}-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 512;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const baseCol = new THREE.Color(baseHex);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = 0.5;
      let shade = 1.0;

      if (mode === "muscle") {
        const fiber = Math.sin(x * 0.28 + fbm2D(x * 0.03, y * 0.02, 2) * 4.2) * 0.5 + 0.5;
        const bundle = Math.sin(x * 0.085 + fbm2D(x * 0.015, y * 0.015, 2) * 2.5) * 0.5 + 0.5;
        const fascia = smoothstep(0.62, 0.92, fbm2D(x * 0.04, y * 0.025, 2) * 0.5 + 0.5) * 0.22;
        h = 0.35 + fiber * 0.35 + bundle * 0.3;
        shade = 0.88 + fiber * 0.22 + bundle * 0.18 + fascia;
      } else if (mode === "armor") {
        const crack = Math.abs(fbm2D(x * 0.04, y * 0.04, 3));
        const platePit = fbm2D(x * 0.14, y * 0.14, 2) * 0.5 + 0.5;
        const fissure = crack < 0.04 ? (0.04 - crack) * 14 : 0;
        h = Math.max(0, 0.72 + (platePit - 0.5) * 0.16 - fissure * 0.55);
        shade = 0.94 + (platePit - 0.5) * 0.14 - fissure * 0.32;
      } else {
        const pore = fbm2D(x * 0.18, y * 0.18, 2) * 0.5 + 0.5;
        const vein = Math.abs(fbm2D(x * 0.03 + 7, y * 0.03 - 9, 3));
        h = 0.52 + (pore - 0.5) * 0.14;
        shade = 0.96 + (pore - 0.5) * 0.1 - (vein < 0.035 ? 0.12 : 0);
      }

      height[y * size + x] = h;
      const idx = (y * size + x) * 4;
      cImg.data[idx] = Math.min(250, Math.max(12, Math.round(baseCol.r * 255 * shade)));
      cImg.data[idx + 1] = Math.min(250, Math.max(12, Math.round(baseCol.g * 255 * shade)));
      cImg.data[idx + 2] = Math.min(250, Math.max(12, Math.round(baseCol.b * 255 * shade)));
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    mode === "muscle" ? 2.6 : mode === "armor" ? 3.4 : 1.5,
    mode === "muscle" ? 0.58 : mode === "armor" ? 0.48 : 0.68,
    0.26
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 7. Survey Corps Woven Wool/Linen Cloak PBR Set (`3d-cloth-material`)
 */
export function getWovenClothTextures(
  dyeHex = "#2D4735",
  anisotropy = 4
): PbrTextureSet {
  const key = `cloth-${dyeHex}-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 256;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const baseCol = new THREE.Color(dyeHex);

  const pitch = 8;
  for (let y = 0; y < size; y++) {
    const B = Math.floor(y / pitch);
    const ty = (y % pitch) / pitch;
    for (let x = 0; x < size; x++) {
      const A = Math.floor(x / pitch);
      const tx = (x % pitch) / pitch;
      // Twill 2/1 interlacement
      const warpOver = (A + B) % 3 < 2;
      const threadProfile = warpOver
        ? Math.sin(tx * Math.PI) * 0.7 + 0.3
        : Math.sin(ty * Math.PI) * 0.7 + 0.3;
      const slub = (hash2(A * 13, B * 29) - 0.5) * 0.14;
      const h = Math.max(0.1, Math.min(1, threadProfile + slub));
      height[y * size + x] = h;

      const tone = 0.88 + h * 0.22;
      const idx = (y * size + x) * 4;
      cImg.data[idx] = Math.min(255, Math.round(baseCol.r * 255 * tone));
      cImg.data[idx + 1] = Math.min(255, Math.round(baseCol.g * 255 * tone));
      cImg.data[idx + 2] = Math.min(255, Math.round(baseCol.b * 255 * tone));
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    2.5,
    0.78,
    0.18
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 6, 6, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 6, 6, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 6, 6, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 8. Brushed Steel (`3d-metal-material`) for ODM Blades & Wall Cannons
 */
export function getBrushedMetalTextures(anisotropy = 8): PbrTextureSet {
  const key = `metal-${anisotropy}`;
  if (cache.has(key)) return cache.get(key)!;

  const size = 256;
  const [colCanvas, cCtx] = makeCanvas(size);
  const cImg = cCtx.createImageData(size, size);
  const height = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    const streak = hash2(y * 7, 13) * 0.35;
    for (let x = 0; x < size; x++) {
      const fine = fbm2D(x * 0.04, y * 0.85, 2) * 0.5 + 0.5;
      const smear = fbm2D(x * 0.025, y * 0.025, 2) * 0.5 + 0.5;
      const h = 0.5 + streak * 0.35 + (fine - 0.5) * 0.25;
      height[y * size + x] = h;

      // Linear Steel F0 base ~ (0.56, 0.57, 0.58) mapped cleanly into sRGB
      const v = Math.round((192 + (smear - 0.5) * 26 + (fine - 0.5) * 14));
      const idx = (y * size + x) * 4;
      cImg.data[idx] = v;
      cImg.data[idx + 1] = Math.min(255, v + 2);
      cImg.data[idx + 2] = Math.min(255, v + 6);
      cImg.data[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  const { normalCanvas, roughCanvas } = heightToNormalAndRoughness(
    height,
    size,
    1.4,
    0.18,
    0.28
  );

  const set: PbrTextureSet = {
    map: finalizeTexture(colCanvas, true, 1, 1, anisotropy),
    normalMap: finalizeTexture(normalCanvas, false, 1, 1, anisotropy),
    roughnessMap: finalizeTexture(roughCanvas, false, 1, 1, anisotropy),
  };
  cache.set(key, set);
  return set;
}

/**
 * 9. Alpha-tested Leaf Cluster Atlas (`3d-high-resolution-textures` edge bleed rule)
 */
export function getFoliageLeafTexture(): THREE.CanvasTexture {
  const key = "foliage-leaf-atlas";
  if (singleTexCache.has(key)) return singleTexCache.get(key)!;

  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  // Pre-fill transparent background with deep foliage color to eliminate bright/dark fringe bleed on mipmaps
  ctx.fillStyle = "rgba(42, 64, 34, 0)";
  ctx.fillRect(0, 0, size, size);

  const drawLeaf = (cx: number, cy: number, ang: number, len: number, wid: number, hueShift: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = `rgb(${44 + hueShift}, ${74 + hueShift}, ${38})`;
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.quadraticCurveTo(wid, -len * 0.35, 0, len * 0.25);
    ctx.quadraticCurveTo(-wid, -len * 0.35, 0, -len);
    ctx.fill();
    ctx.strokeStyle = `rgba(${70 + hueShift}, ${100 + hueShift}, 54, 0.7)`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, len * 0.2);
    ctx.lineTo(0, -len * 0.88);
    ctx.stroke();
    ctx.restore();
  };

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 + hash2(i, 3) * 0.4;
    const rad = 22 + hash2(i, 9) * 58;
    const cx = size / 2 + Math.cos(a) * rad;
    const cy = size / 2 + Math.sin(a) * rad;
    drawLeaf(cx, cy, a + 1.1, 32 + hash2(i, 17) * 18, 15 + hash2(i, 21) * 8, Math.round(hash2(i, 5) * 26));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  singleTexCache.set(key, tex);
  return tex;
}

/**
 * 10. Soft Radial Steam / Smoke Puff Sprite Texture (prevents square PointSprites!)
 */
export function getSmokePuffTexture(): THREE.CanvasTexture {
  const key = "smoke-puff-radial";
  if (singleTexCache.has(key)) return singleTexCache.get(key)!;

  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const grd = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  grd.addColorStop(0.0, "rgba(245, 247, 248, 0.92)");
  grd.addColorStop(0.38, "rgba(235, 238, 242, 0.55)");
  grd.addColorStop(0.75, "rgba(220, 226, 232, 0.16)");
  grd.addColorStop(1.0, "rgba(220, 226, 232, 0.0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  singleTexCache.set(key, tex);
  return tex;
}
