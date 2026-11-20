import * as THREE from "three";

/**
 * Custom GLSL Shaders implementing @MengTo/Skills recipes:
 * 1. 6-stop seamless sky & horizon atmosphere (`threejs-landscape` + `3d-sky-background`)
 * 2. Deep-water Gerstner ocean with analytic derivatives & footprint fade (`3d-ultra-realistic-water`)
 * 3. Wall Survey Scan X-ray pulse (`3d-survey-scan`)
 * 4. Volumetric forest sun shafts (`3d-sky-rays`)
 */

export const SKY_DOME_VERT = /* glsl */ `
varying vec3 vWorldDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldDir = normalize(position);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const SKY_DOME_FRAG = /* glsl */ `
uniform vec3 uSky0; // nadir / below horizon
uniform vec3 uSky1; // horizon haze
uniform vec3 uSky2; // lower band
uniform vec3 uSky3; // mid sky
uniform vec3 uSky4; // upper sky
uniform vec3 uSky5; // zenith
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunGlow;
uniform float uCloudStrength;
uniform float uTime;

varying vec3 vWorldDir;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vWorldDir);
  float y = dir.y;

  // 6-stop vertical atmospheric gradient (horizon placed slightly below y=0 to match fog seamlessly)
  vec3 col = uSky0;
  col = mix(col, uSky1, smoothstep(-0.08, 0.01, y));
  col = mix(col, uSky2, smoothstep(0.01, 0.14, y));
  col = mix(col, uSky3, smoothstep(0.14, 0.36, y));
  col = mix(col, uSky4, smoothstep(0.36, 0.68, y));
  col = mix(col, uSky5, smoothstep(0.68, 0.98, y));

  // Sun disk + Mie scattering halo
  float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
  float broadHalo = pow(sunDot, 6.0) * 0.28 * uSunGlow;
  float tightGlow = pow(sunDot, 64.0) * 0.85 * uSunGlow;
  float disk = smoothstep(0.9991, 0.99965, sunDot) * 2.4 * uSunGlow;
  col += uSunColor * (broadHalo + tightGlow + disk);

  // Subtle planar-projected cloud deck above horizon
  if (y > 0.02 && uCloudStrength > 0.01) {
    vec2 cloudUV = dir.xz / (y + 0.16) * 1.45 + vec2(uTime * 0.0045, uTime * 0.002);
    float c1 = fbm(cloudUV);
    float c2 = fbm(cloudUV * 2.2 - vec2(uTime * 0.003, 0.0));
    float cloudMask = smoothstep(0.46, 0.78, c1 * 0.7 + c2 * 0.3) * smoothstep(0.02, 0.22, y);
    vec3 cloudLit = mix(uSky2 * 1.15, uSunColor * 0.95 + uSky1 * 0.4, pow(sunDot, 2.0) * 0.65);
    col = mix(col, cloudLit, cloudMask * uCloudStrength * 0.55);
  }

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * Gerstner deep-water ocean shader inspired by `3d-ultra-realistic-water`:
 * - Multi-wave Gerstner sum with analytic pixel derivatives
 * - Footprint fade per wave prevents moiré boiling toward the horizon
 * - Clamped reflection vector (`abs(R.y) + 0.002`) eliminates pale wave-back smears
 * - Blends directly into the sky horizon colour at distance
 */
export const OCEAN_VERT = /* glsl */ `
uniform float uTime;
uniform vec2 uWindDir;
uniform float uWaveScale;
varying vec3 vWorldPos;
varying vec2 vXZ;
varying float vWaveCrest;

void gerstnerWave(
  vec2 pos, vec2 dir, float wavelength, float amp, float steepness,
  inout vec3 disp, inout float crest
) {
  float k = 6.2831853 / wavelength;
  float c = sqrt(9.81 / k);
  vec2 d = normalize(dir);
  float f = k * (dot(d, pos) - c * uTime);
  float s = sin(f);
  float co = cos(f);
  float q = steepness / (k * amp * 4.0 + 0.0001);
  disp.x += d.x * (q * amp * co);
  disp.z += d.y * (q * amp * co);
  disp.y += amp * s;
  crest += max(0.0, s) * amp;
}

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec2 xz = wp.xz;
  float dist = length(xz);
  float nearFade = 1.0 - smoothstep(220.0, 560.0, dist);
  float ws = max(0.15, uWaveScale);

  vec3 disp = vec3(0.0);
  float crest = 0.0;
  gerstnerWave(xz, uWindDir, 44.0 * ws, 0.42 * nearFade * ws, 0.24, disp, crest);
  gerstnerWave(xz, vec2(uWindDir.x * 0.9 - uWindDir.y * 0.42, uWindDir.x * 0.42 + uWindDir.y * 0.9), 27.0 * ws, 0.24 * nearFade * ws, 0.20, disp, crest);
  gerstnerWave(xz, vec2(uWindDir.x * 0.8 + uWindDir.y * 0.6, -uWindDir.x * 0.6 + uWindDir.y * 0.8), 16.0 * ws, 0.12 * nearFade * ws, 0.16, disp, crest);

  wp.xyz += disp;
  vWorldPos = wp.xyz;
  vXZ = xz;
  vWaveCrest = crest;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const OCEAN_FRAG = /* glsl */ `
uniform float uTime;
uniform vec2 uWindDir;
uniform float uWaveScale;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uHorizonColor;
uniform vec3 uZenithColor;
uniform vec3 uDeepColor;
uniform vec3 uScatterColor;
uniform float uSunGlow;

varying vec3 vWorldPos;
varying vec2 vXZ;
varying float vWaveCrest;

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void waveGrad(vec2 pos, vec2 dir, float L, float A, float footprint, inout vec2 grad, inout float jacobian) {
  float fade = 1.0 - smoothstep(0.18 * L, 0.5 * L, footprint);
  if (fade <= 0.001) return;
  float k = 6.2831853 / L;
  float c = sqrt(9.81 / k);
  vec2 d = normalize(dir);
  float f = k * (dot(d, pos) - c * uTime);
  float s = sin(f);
  float co = cos(f);
  grad += d * (k * A * co * fade);
  jacobian -= 0.26 * s * fade;
}

void main() {
  vec3 V = normalize(cameraPosition - vWorldPos);
  float dist = length(cameraPosition - vWorldPos);
  float footprint = max(0.05, 2.0 * (length(dFdx(vXZ)) + length(dFdy(vXZ))));

  vec2 grad = vec2(0.0);
  float jacobian = 1.0;
  float ws = max(0.15, uWaveScale);

  waveGrad(vXZ, uWindDir, 44.0 * ws, 0.42 * ws, footprint, grad, jacobian);
  waveGrad(vXZ, vec2(uWindDir.x * 0.9 - uWindDir.y * 0.42, uWindDir.x * 0.42 + uWindDir.y * 0.9), 27.0 * ws, 0.26 * ws, footprint, grad, jacobian);
  waveGrad(vXZ, vec2(uWindDir.x * 0.8 + uWindDir.y * 0.6, -uWindDir.x * 0.6 + uWindDir.y * 0.8), 15.0 * ws, 0.14 * ws, footprint, grad, jacobian);
  waveGrad(vXZ, vec2(-uWindDir.y, uWindDir.x), 7.8 * ws, 0.06 * ws, footprint, grad, jacobian);
  waveGrad(vXZ, normalize(uWindDir + vec2(0.35, -0.5)), 4.1 * ws, 0.03 * ws, footprint, grad, jacobian);

  // Subtle baked-like micro ripple faded at distance
  float microFade = exp(-dist / 420.0);
  float m1 = noise(vXZ * (0.55 / ws) + uTime * vec2(0.32, 0.18));
  float m2 = noise(vXZ * (1.15 / ws) - uTime * vec2(0.16, 0.29));
  grad += vec2(m1 - 0.5, m2 - 0.5) * 0.14 * microFade;

  vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));
  vec3 L = normalize(uSunDir);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y) + 0.002; // Prevent downward pale grey reflection smear

  float NoV = max(dot(N, V), 0.001);
  float fresnel = 0.02 + 0.98 * pow(1.0 - NoV, 5.0);

  vec3 skyRefl = mix(uHorizonColor, uZenithColor, pow(clamp(R.y, 0.0, 1.0), 0.62));
  float towardSun = max(dot(-V, L), 0.0);
  vec3 waterBody = uDeepColor + uScatterColor * (pow(towardSun, 2.0) * (0.28 + 1.8 * (1.0 - N.y)) * clamp(vWaveCrest + 0.25, 0.0, 1.4));

  vec3 col = mix(waterBody, skyRefl, fresnel);

  // Sun glitter path
  float specTight = pow(max(dot(R, L), 0.0), 320.0) * 6.5;
  float specBroad = pow(max(dot(R, L), 0.0), 42.0) * 0.35;
  col += uSunColor * (specTight + specBroad) * uSunGlow;

  // Jacobian lace crest foam
  float foamMask = smoothstep(0.68, 0.38, jacobian) * (1.0 - smoothstep(220.0, 560.0, dist));
  float lace = noise(vXZ * 0.55 + vec2(uTime * 0.12));
  float foam = smoothstep(0.55 - foamMask * 0.35, 0.85, lace) * foamMask;
  col = mix(col, mix(uHorizonColor, vec3(0.92, 0.94, 0.95), 0.65), foam * 0.55);

  // Seamless sky-horizon aerial fog blend
  float horizonFog = pow(1.0 - exp(-dist * 0.00145), 1.4);
  col = mix(col, uHorizonColor, clamp(horizonFog, 0.0, 1.0));

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * World-space Survey Scan X-Ray Cutaway Shader (`3d-survey-scan` recipe)
 * Sweeps a bright cyan-emerald tomography wave across Wall Maria to reveal the 50m Wall Titans inside.
 */
export function createWallSurveyScanMaterial(baseMaterial: THREE.MeshStandardMaterial): {
  material: THREE.MeshStandardMaterial;
  uniforms: {
    uScanProgress: { value: number };
    uScanOrigin: { value: THREE.Vector3 };
    uMaxRadius: { value: number };
    uXrayMode: { value: number };
  };
} {
  const mat = baseMaterial.clone();
  mat.transparent = true;
  mat.customProgramCacheKey = () => "aot-wall-survey-scan";

  const uniforms = {
    uScanProgress: { value: 0 },
    uScanOrigin: { value: new THREE.Vector3(0, 25, 18) },
    uMaxRadius: { value: 165 },
    uXrayMode: { value: 0 },
  };

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uScanProgress = uniforms.uScanProgress;
    shader.uniforms.uScanOrigin = uniforms.uScanOrigin;
    shader.uniforms.uMaxRadius = uniforms.uMaxRadius;
    shader.uniforms.uXrayMode = uniforms.uXrayMode;

    shader.vertexShader =
      `varying vec3 vSurveyWorldPos;\n` +
      shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
         vec4 surveyPos = vec4(transformed, 1.0);
         #ifdef USE_INSTANCING
           surveyPos = instanceMatrix * surveyPos;
         #endif
         vSurveyWorldPos = (modelMatrix * surveyPos).xyz;`
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
           float width = 4.2;
           float d = (length(vSurveyWorldPos - uScanOrigin) - activeRadius) / width;
           float rim = exp(-d * d * 2.4);
           float behind = 1.0 - smoothstep(-1.5, 0.25, d);
           vec3 cyanPulse = vec3(0.24, 0.85, 0.88) * rim * 1.45;
           vec3 stoneGrid = vec3(0.18, 0.58, 0.64) * abs(sin(vSurveyWorldPos.y * 1.6)) * 0.25 * behind;
           gl_FragColor.rgb += (cyanPulse + stoneGrid) * uXrayMode;
           // Cut away outer masonry translucently behind the scan front so Wall Titans shine through
           float cutAlpha = mix(1.0, 0.16, behind * uXrayMode);
           gl_FragColor.a *= cutAlpha;
         }`
      );
  };

  return { material: mat, uniforms };
}
