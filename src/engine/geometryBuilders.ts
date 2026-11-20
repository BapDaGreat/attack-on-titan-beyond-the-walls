import * as THREE from "three";

/**
 * Architectural & Anatomical Procedural Geometry Builders.
 * Follows @MengTo/Skills (`3d-towers`, `3d-high-poly-models`, `3d-wood-material`):
 * - Every sharp edge has beveled arrises so directional light catches highlights.
 * - UVs are rewritten in real world meters so small trim & large beams match texel density.
 * - Anatomical segments are lofted along smooth elliptical cross-sections with muscle swells.
 */

export function writeWorldUVs(
  geometry: THREE.BufferGeometry,
  scale = 0.5
): THREE.BufferGeometry {
  const pos = geometry.attributes.position;
  const norm = geometry.attributes.normal;
  if (!pos || !norm) return geometry;

  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const nz = Math.abs(norm.getZ(i));

    if (ny >= nx && ny >= nz) {
      uvs[i * 2] = x * scale;
      uvs[i * 2 + 1] = z * scale;
    } else if (nx >= nz) {
      uvs[i * 2] = z * scale;
      uvs[i * 2 + 1] = y * scale;
    } else {
      uvs[i * 2] = x * scale;
      uvs[i * 2 + 1] = y * scale;
    }
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("uv2", new THREE.BufferAttribute(uvs.slice(), 2));
  return geometry;
}

/**
 * Chamfered architectural timber/stone block with beveled edges for specular catch.
 */
export function createChamferedBox(
  w: number,
  h: number,
  d: number,
  bevel?: number,
  segments = 2,
  uvScale = 0.45
): THREE.BufferGeometry {
  const minDim = Math.min(w, h, d);
  const r = Math.min(bevel ?? minDim * 0.045, minDim * 0.22);

  const shape = new THREE.Shape();
  const hw = Math.max(0.001, w / 2 - r);
  const hh = Math.max(0.001, h / 2 - r);
  shape.moveTo(-hw, -hh - r);
  shape.lineTo(hw, -hh - r);
  shape.quadraticCurveTo(hw + r, -hh - r, hw + r, -hh);
  shape.lineTo(hw + r, hh);
  shape.quadraticCurveTo(hw + r, hh + r, hw, hh + r);
  shape.lineTo(-hw, hh + r);
  shape.quadraticCurveTo(-hw - r, hh + r, -hw - r, hh);
  shape.lineTo(-hw - r, -hh);
  shape.quadraticCurveTo(-hw - r, -hh - r, -hw, -hh - r);

  const depth = Math.max(0.002, d - r * 2);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: segments,
    curveSegments: segments + 1,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return writeWorldUVs(geo, uvScale);
}

/**
 * Lofted anatomical muscle / limb geometry with multi-ring sculptural contour.
 * t in [0, 1] maps from proximal origin (y = 0) to distal end (y = -length).
 */
export interface LimbRingProfile {
  t: number;
  rx: number;
  rz: number;
  offsetX?: number;
  offsetZ?: number;
  muscleRibs?: number;
}

export function createSweptLimbGeometry(
  length: number,
  profile: LimbRingProfile[],
  radialSegs = 18
): THREE.BufferGeometry {
  const rings = profile.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < rings; i++) {
    const ring = profile[i];
    const y = -ring.t * length;
    const ox = ring.offsetX ?? 0;
    const oz = ring.offsetZ ?? 0;
    const ribs = ring.muscleRibs ?? 0;

    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const ribMod =
        ribs > 0 ? 1 + ribs * Math.pow(Math.abs(Math.sin(theta * 2)), 1.5) : 1;
      const x = ox + Math.cos(theta) * ring.rx * ribMod;
      const z = oz + Math.sin(theta) * ring.rz * ribMod;
      positions.push(x, y, z);
      uvs.push(u, ring.t);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b, b, d, c);
    }
  }

  // Cap top & bottom cleanly
  const topCenterIdx = positions.length / 3;
  positions.push(profile[0].offsetX ?? 0, 0, profile[0].offsetZ ?? 0);
  uvs.push(0.5, 0);
  for (let j = 0; j < radialSegs; j++) {
    indices.push(topCenterIdx, j + 1, j);
  }

  const last = profile[rings - 1];
  const botCenterIdx = positions.length / 3;
  positions.push(last.offsetX ?? 0, -length, last.offsetZ ?? 0);
  uvs.push(0.5, 1);
  const base = (rings - 1) * stride;
  for (let j = 0; j < radialSegs; j++) {
    indices.push(botCenterIdx, base + j, base + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("uv2", new THREE.Float32BufferAttribute(uvs.slice(), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted anatomical torso (pelvis -> waist -> obliques -> ribcage -> broad shoulders -> collar)
 * with pectoral bulge, dorsal spine crease, and serratus tapering.
 */
export function createSculptedTorsoGeometry(
  height: number,
  shoulderScale = 1,
  depthScale = 1,
  pectoralGain = 0.14
): THREE.BufferGeometry {
  const rings = 16;
  const radialSegs = 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i++) {
    const t = i / rings; // 0 = pelvis, 1 = neck base
    const y = t * height;

    // Anatomical coronal (width) & sagittal (depth) envelope
    const widthCurve =
      t < 0.25
        ? 0.72 + (t / 0.25) * 0.04
        : t < 0.65
        ? 0.76 + Math.pow((t - 0.25) / 0.4, 1.15) * 0.46
        : 1.22 - Math.pow((t - 0.65) / 0.35, 1.5) * 0.88;

    const depthCurve =
      t < 0.3
        ? 0.56 + (t / 0.3) * 0.04
        : t < 0.72
        ? 0.6 + Math.sin(((t - 0.3) / 0.42) * Math.PI * 0.85) * 0.24
        : 0.72 - ((t - 0.72) / 0.28) * 0.42;

    const rxBase = height * 0.31 * widthCurve * shoulderScale;
    const rzBase = height * 0.25 * depthCurve * depthScale;

    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Pectoral & abdominal forward sculpt (+Z front)
      let zBias = 0;
      if (sinT > 0.15) {
        const chestBand = Math.exp(-Math.pow((t - 0.68) / 0.16, 2));
        const absBand = Math.exp(-Math.pow((t - 0.38) / 0.16, 2));
        const sternumSplit = 1 - Math.exp(-Math.pow(cosT / 0.2, 2)) * 0.45;
        zBias +=
          sinT *
          height *
          (chestBand * pectoralGain * sternumSplit + absBand * 0.045 * sternumSplit);
      }
      // Dorsal spinal furrow (-Z back)
      if (sinT < -0.25 && Math.abs(cosT) < 0.32) {
        zBias += 0.03 * height * (1 - Math.abs(cosT) / 0.32);
      }

      const x = cosT * rxBase;
      const z = sinT * rzBase + zBias;
      positions.push(x, y, z);
      uvs.push(u, t);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  // Cap pelvis (y = 0, outward -Y) and neck base (y = height, outward +Y)
  const botCenterIdx = positions.length / 3;
  positions.push(0, 0, 0);
  uvs.push(0.5, 0);
  for (let j = 0; j < radialSegs; j++) {
    indices.push(botCenterIdx, j, j + 1);
  }
  const topCenterIdx = positions.length / 3;
  positions.push(0, height, 0);
  uvs.push(0.5, 1);
  const topBase = rings * stride;
  for (let j = 0; j < radialSegs; j++) {
    indices.push(topCenterIdx, topBase + j + 1, topBase + j);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("uv2", new THREE.Float32BufferAttribute(uvs.slice(), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted anatomical cranial head with brow ridge, nose bridge, cheekbones & articulated mandible.
 */
export function createSculptedHeadGeometry(
  height: number,
  jawHeavy = 0.08
): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(height * 0.48, 28, 22);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const ny = y / (height * 0.48); // -1 chin .. +1 crown
    const nz = z / (height * 0.48); // +1 front .. -1 occiput

    // Elongate head vertically into human/titan cranial proportions
    y *= 1.18;
    // Narrow lower jaw & widen parietal cranium
    if (ny < 0) {
      const jawT = Math.abs(ny);
      x *= 1 - jawT * (0.28 - jawHeavy);
      if (nz > 0.1) z *= 1 + jawT * 0.14; // chin projection
    } else {
      x *= 0.88 + Math.sin(ny * Math.PI * 0.6) * 0.08;
      if (nz < 0) z *= 1.06; // occiput depth
    }

    // Brow ridge & nose bridge
    if (nz > 0.45 && ny > 0.05 && ny < 0.35) {
      z += height * 0.045 * Math.exp(-Math.pow((ny - 0.18) / 0.12, 2));
    }
    if (nz > 0.65 && Math.abs(x) < height * 0.1 && ny > -0.18 && ny < 0.15) {
      z += height * 0.055 * (1 - Math.abs(x) / (height * 0.1));
    }
    // Deep eye socket indentation
    if (
      nz > 0.5 &&
      ny > 0.02 &&
      ny < 0.2 &&
      Math.abs(x) > height * 0.07 &&
      Math.abs(x) < height * 0.24
    ) {
      z -= height * 0.032;
    }

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Arched stone wall gate opening constructed with genuine radial arch voussoir blocks
 * so characters and cameras pass cleanly through the real opening.
 */
export function createWallArchPassageGeometry(
  wallThickness: number,
  wallHeight: number,
  archWidth: number,
  archHeight: number,
  segmentWidth: number
): THREE.BufferGeometry {
  const halfSeg = segmentWidth / 2;
  const halfArch = archWidth / 2;
  const springY = archHeight - halfArch;

  const shape = new THREE.Shape();
  shape.moveTo(-halfSeg, 0);
  shape.lineTo(-halfArch, 0);
  shape.lineTo(-halfArch, springY);
  shape.absarc(0, springY, halfArch, Math.PI, 0, true);
  shape.lineTo(halfArch, 0);
  shape.lineTo(halfSeg, 0);
  shape.lineTo(halfSeg, wallHeight);
  shape.lineTo(-halfSeg, wallHeight);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: wallThickness,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.18,
    bevelSegments: 2,
    curveSegments: 20,
  });
  geo.translate(0, 0, -wallThickness / 2);
  geo.computeVertexNormals();
  return writeWorldUVs(geo, 0.14);
}

/**
 * Anatomically curved armor shell (e.g., pectoral, deltoid, shin greave)
 * conforming around cylindrical body surfaces rather than reading as flat cushions.
 */
export function createCurvedArmorShell(
  rx: number,
  rz: number,
  height: number,
  arcAngle: number,
  thickness: number,
  taperTop = 1.0,
  taperBot = 0.85
): THREE.BufferGeometry {
  const segU = 14;
  const segV = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const pushLayer = (scaleR: number, invert = false) => {
    const startIdx = positions.length / 3;
    for (let iv = 0; iv <= segV; iv++) {
      const v = iv / segV;
      const y = (v - 0.5) * height;
      const taper = taperBot + (taperTop - taperBot) * v;
      const dome = Math.sin(v * Math.PI) * 0.12 + 0.92;
      for (let iu = 0; iu <= segU; iu++) {
        const u = iu / segU;
        const ang = (u - 0.5) * arcAngle + Math.PI / 2; // centered around +Z
        const x = Math.cos(ang) * rx * taper * dome * scaleR;
        const z = Math.sin(ang) * rz * taper * dome * scaleR;
        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }
    const stride = segU + 1;
    for (let iv = 0; iv < segV; iv++) {
      for (let iu = 0; iu < segU; iu++) {
        const a = startIdx + iv * stride + iu;
        const b = startIdx + (iv + 1) * stride + iu;
        const c = startIdx + (iv + 1) * stride + (iu + 1);
        const d = startIdx + iv * stride + (iu + 1);
        if (!invert) indices.push(a, b, d, b, c, d);
        else indices.push(a, d, b, b, d, c);
      }
    }
    return startIdx;
  };

  const outerStart = pushLayer(1 + thickness / Math.max(rx, rz), false);
  const innerStart = pushLayer(0.98, true);

  // Stitch perimeter edges so armor shell has solid visible thickness
  const stride = segU + 1;
  for (let iu = 0; iu < segU; iu++) {
    // Bottom rim (normal -Y)
    indices.push(outerStart + iu, outerStart + iu + 1, innerStart + iu);
    indices.push(innerStart + iu, outerStart + iu + 1, innerStart + iu + 1);
    // Top rim (normal +Y)
    const ot = outerStart + segV * stride + iu;
    const it = innerStart + segV * stride + iu;
    indices.push(ot, it, ot + 1, it, it + 1, ot + 1);
  }
  for (let iv = 0; iv < segV; iv++) {
    // Side rims
    const ol = outerStart + iv * stride;
    const il = innerStart + iv * stride;
    indices.push(ol, il, ol + stride, il, il + stride, ol + stride);
    const or = outerStart + iv * stride + segU;
    const ir = innerStart + iv * stride + segU;
    indices.push(or, or + stride, ir, ir, or + stride, ir + stride);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute("uv2", new THREE.Float32BufferAttribute(uvs.slice(), 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
