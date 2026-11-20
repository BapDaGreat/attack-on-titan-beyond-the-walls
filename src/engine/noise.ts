/**
 * Deterministic arithmetic hashing & domain-warped terrain noise.
 * Avoids `sin(x) * 43758` Metal/GPU precision artifacts per MengTo/Skills rules.
 */

export function hash2(x: number, y: number): number {
  let px = Math.imul(Math.floor(x) ^ 0x9e3779b9, 0x85ebca6b);
  let py = Math.imul(Math.floor(y) ^ 0xc2b2ae35, 0x27d4eb2f);
  let h = px ^ ((py << 13) | (py >>> 19));
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function createSeededRng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function valueNoise2D(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const u = fade(xf);
  const v = fade(yf);

  const n00 = hash2(xi, yi);
  const n10 = hash2(xi + 1, yi);
  const n01 = hash2(xi, yi + 1);
  const n11 = hash2(xi + 1, yi + 1);

  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v) * 2 - 1;
}

export function fbm2D(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * freq, y * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export function ridged2D(x: number, y: number, octaves = 3): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise2D(x * freq, y * freq));
    sum += n * n * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.11;
  }
  return sum / norm;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Domain-warped Paradis Island macro elevation (in km-scale units).
 * Sea level = 0. Interior walled territory stays elevated above coastal cliffs.
 */
export function paradisMacroHeight(x: number, z: number): number {
  const dist = Math.hypot(x, z);
  // Paradis elongated island mask (subtle coastal peninsula & southern harbor bay)
  const coastWarp = fbm2D(x * 0.0085 + 7.1, z * 0.0085 - 3.4, 3) * 32;
  const effectiveDist = Math.hypot(x * 1.08, (z + 8) * 0.92) + coastWarp;

  const islandMask = 1 - smoothstep(192, 232, effectiveDist);
  if (islandMask <= 0.001) return -4.5;

  const wx = x + fbm2D(x * 0.011, z * 0.011, 3) * 28;
  const wz = z + fbm2D(x * 0.011 + 41, z * 0.011 - 17, 3) * 28;

  let h = 2.6;
  // Northern highlands (Utopia / Orvud ridge chain)
  const northBias = smoothstep(-25, -160, z);
  h += northBias * (ridged2D(wx * 0.018, wz * 0.018, 3) * 22 + 5.5);

  // Rolling central plateaus (Mitras center & Wall Rose farmlands)
  h += (fbm2D(wx * 0.014, wz * 0.014, 4) * 0.5 + 0.5) * 6.5;

  // Flatten slightly inside the three Wall bands so concentric rings sit cleanly
  const wallMariaFactor = Math.exp(-Math.pow((dist - 165) / 8, 2));
  const wallRoseFactor = Math.exp(-Math.pow((dist - 126) / 7, 2));
  const wallSinaFactor = Math.exp(-Math.pow((dist - 82) / 7, 2));
  const wallFlatten = Math.max(wallMariaFactor, wallRoseFactor, wallSinaFactor);
  h = lerp(h, 3.8 + northBias * 3.0, wallFlatten * 0.65);

  // Carve main river valley draining south past Shiganshina to the sea
  const riverCenter = Math.sin(z * 0.018) * 18 - 6;
  const riverDist = Math.abs(x - riverCenter);
  const inRiverZone = smoothstep(-50, 210, z);
  const riverCarve = (1 - smoothstep(3, 12, riverDist)) * inRiverZone * 2.8;
  h -= riverCarve;

  // Coastal cliffs tapering to sea
  const cliffProfile = smoothstep(182, 218, effectiveDist);
  h = h * islandMask - cliffProfile * 2.5 - (1 - islandMask) * 4.5;
  return h;
}

/**
 * 1:1 Meter local Shiganshina / Wall terrain elevation.
 * Keeps street corridor & plaza flat at y = 0 while rolling meadows rise outside Wall Maria (z > 40).
 */
export function localShiganshinaHeight(x: number, z: number): number {
  // Inner district streets & Yeager block (z <= 8) stay flush at 0 for accurate building seating
  if (z <= 12 && Math.abs(x) < 110) {
    // Canal depression running along x in [-36, -24]
    if (x > -34 && x < -22 && z < 8) {
      const edge = smoothstep(4.5, 6.2, Math.abs(x + 28));
      return -2.4 * (1 - edge);
    }
    return 0;
  }

  // Smooth transition out into outer meadows beyond the wall (z > 12)
  const blend = smoothstep(12, 34, z);
  const wx = x + fbm2D(x * 0.015, z * 0.015, 2) * 14;
  const wz = z + fbm2D(x * 0.015 + 19, z * 0.015 - 23, 2) * 14;
  const meadow =
    fbm2D(wx * 0.012, wz * 0.012, 3) * 3.2 +
    ridged2D(wx * 0.025, wz * 0.025, 2) * 2.2;

  // Distant foothills beyond 150m
  const distFade = smoothstep(110, 320, Math.hypot(x, z));
  const ridgeBoost = distFade * ridged2D(wx * 0.009, wz * 0.009, 3) * 28;
  return (meadow + ridgeBoost) * blend;
}
