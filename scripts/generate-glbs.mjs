import fs from "node:fs";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Polyfill FileReader for Node GLTFExporter binary export
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class NodeFileReader {
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          this.onload?.({ target: this });
          this.onloadend?.({ target: this });
        })
        .catch((err) => {
          this.error = err;
          this.onerror?.(err);
        });
    }
    readAsDataURL(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          const b64 = Buffer.from(buf).toString("base64");
          this.result = `data:${blob.type || "application/octet-stream"};base64,${b64}`;
          this.onload?.({ target: this });
          this.onloadend?.({ target: this });
        })
        .catch((err) => {
          this.error = err;
          this.onerror?.(err);
        });
    }
  };
}

const OUT_DIR = path.resolve(process.cwd(), "public", "models");
fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Geometry & World-UV Helpers
// ---------------------------------------------------------------------------

function writeWorldUVs(geo, scale = 0.45) {
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  nonIdx.computeVertexNormals();
  const pos = nonIdx.attributes.position;
  const norm = nonIdx.attributes.normal;
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
  nonIdx.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  // Remove tangent/color mismatches before merging
  nonIdx.deleteAttribute("uv1");
  return nonIdx;
}

function chamferBox(w, h, d, bevel = null, uvScale = 0.45, segs = 1) {
  const minDim = Math.min(w, h, d);
  const r = Math.min(bevel ?? minDim * 0.045, minDim * 0.22);
  const hw = Math.max(0.001, w / 2 - r);
  const hh = Math.max(0.001, h / 2 - r);
  const shape = new THREE.Shape();
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
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: r,
    bevelSize: r,
    bevelSegments: segs,
    curveSegments: segs,
  });
  g.translate(0, 0, -depth / 2);
  return writeWorldUVs(g, uvScale);
}

function place(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const g = geo.clone();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz));
  m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
  g.applyMatrix4(m);
  return g;
}

class MaterialBatcher {
  constructor() {
    this.buckets = new Map();
  }
  add(role, geo) {
    if (!this.buckets.has(role)) this.buckets.set(role, []);
    this.buckets.get(role).push(writeWorldUVs(geo, role === "stone" ? 0.16 : 0.45));
  }
  toGroup(materials) {
    const group = new THREE.Group();
    for (const [role, geos] of this.buckets.entries()) {
      const merged = mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, materials[role]);
      mesh.name = `mat_${role}`;
      mesh.castShadow = role !== "glass";
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    return group;
  }
}

const DEFAULT_MATS = {
  stone: new THREE.MeshStandardMaterial({ name: "stone", color: 0x9b9488, roughness: 0.86, metalness: 0.0 }),
  stoneDark: new THREE.MeshStandardMaterial({ name: "stoneDark", color: 0x676158, roughness: 0.9, metalness: 0.0 }),
  plaster: new THREE.MeshStandardMaterial({ name: "plaster", color: 0xddd2bd, roughness: 0.84, metalness: 0.0 }),
  plasterAlt: new THREE.MeshStandardMaterial({ name: "plasterAlt", color: 0xcabca4, roughness: 0.85, metalness: 0.0 }),
  timber: new THREE.MeshStandardMaterial({ name: "timber", color: 0x563922, roughness: 0.72, metalness: 0.0 }),
  timberLight: new THREE.MeshStandardMaterial({ name: "timberLight", color: 0x8b623b, roughness: 0.68, metalness: 0.0 }),
  roofClay: new THREE.MeshStandardMaterial({ name: "roofClay", color: 0x8e4a38, roughness: 0.78, metalness: 0.0 }),
  roofSlate: new THREE.MeshStandardMaterial({ name: "roofSlate", color: 0x454d54, roughness: 0.66, metalness: 0.05 }),
  metal: new THREE.MeshStandardMaterial({ name: "metal", color: 0x52575c, roughness: 0.36, metalness: 0.92 }),
  brass: new THREE.MeshStandardMaterial({ name: "brass", color: 0xb89352, roughness: 0.32, metalness: 0.94 }),
  glass: new THREE.MeshStandardMaterial({
    name: "glass",
    color: 0x383226,
    emissive: 0xffb360,
    emissiveIntensity: 0.25,
    roughness: 0.2,
    metalness: 0.1,
  }),
  cloth: new THREE.MeshStandardMaterial({ name: "cloth", color: 0xd5cbb8, roughness: 0.92, metalness: 0.0 }),
};

// ---------------------------------------------------------------------------
// 1. Modular Half-Timbered House Builder
// ---------------------------------------------------------------------------

function buildModularHouse({
  width = 6.4,
  depth = 7.4,
  plinthH = 1.15,
  groundH = 2.8,
  upperH = 2.9,
  roofH = 3.2,
  roofRole = "roofClay",
  plasterRole = "plaster",
  hasDormer = true,
  jetty = 0.28,
}) {
  const b = new MaterialBatcher();

  // Stone foundation plinth + corner quoins
  b.add("stone", place(chamferBox(width + 0.18, plinthH, depth + 0.18, 0.05), 0, plinthH / 2, 0));
  // Front stone step stoop
  b.add("stoneDark", place(chamferBox(1.8, 0.22, 0.9, 0.03), 0, 0.11, depth / 2 + 0.45));
  b.add("stoneDark", place(chamferBox(1.5, 0.22, 0.55, 0.03), 0, 0.33, depth / 2 + 0.28));

  // Ground floor masonry/plaster core
  const gfY = plinthH + groundH / 2;
  b.add(plasterRole, place(chamferBox(width, groundH, depth, 0.03), 0, gfY, 0));

  // Upper floor overhanging timber-framed jetty
  const uw = width + jetty * 2;
  const ud = depth + jetty * 2;
  const ufY = plinthH + groundH + upperH / 2;
  b.add(plasterRole, place(chamferBox(uw, upperH, ud, 0.03), 0, ufY, 0));

  // Jetty support corbel brackets under front & rear eaves
  const corbelCount = 4;
  for (let i = 0; i < corbelCount; i++) {
    const cx = -width / 2 + 0.55 + (i / (corbelCount - 1)) * (width - 1.1);
    b.add("timber", place(chamferBox(0.2, 0.34, 0.42, 0.02), cx, plinthH + groundH - 0.15, depth / 2 + 0.16, 0.3, 0, 0));
    b.add("timber", place(chamferBox(0.2, 0.34, 0.42, 0.02), cx, plinthH + groundH - 0.15, -depth / 2 - 0.16, -0.3, 0, 0));
  }

  // Timber bressummer bands & corner posts (Ground & Upper)
  const beamT = 0.22;
  const addTimberFrame = (w, h, d, yBase) => {
    // Horizontal ring beams top & bottom
    for (const yOff of [0.1, h - 0.1]) {
      b.add("timber", place(chamferBox(w + 0.08, beamT, beamT, 0.02), 0, yBase + yOff, d / 2));
      b.add("timber", place(chamferBox(w + 0.08, beamT, beamT, 0.02), 0, yBase + yOff, -d / 2));
      b.add("timber", place(chamferBox(beamT, beamT, d + 0.08, 0.02), -w / 2, yBase + yOff, 0));
      b.add("timber", place(chamferBox(beamT, beamT, d + 0.08, 0.02), w / 2, yBase + yOff, 0));
    }
    // Vertical posts along facades
    const cols = 3;
    for (let i = 0; i <= cols; i++) {
      const px = -w / 2 + (i / cols) * w;
      b.add("timber", place(chamferBox(beamT, h, beamT, 0.02), px, yBase + h / 2, d / 2));
      b.add("timber", place(chamferBox(beamT, h, beamT, 0.02), px, yBase + h / 2, -d / 2));
    }
    for (let j = 1; j < 3; j++) {
      const pz = -d / 2 + (j / 3) * d;
      b.add("timber", place(chamferBox(beamT, h, beamT, 0.02), -w / 2, yBase + h / 2, pz));
      b.add("timber", place(chamferBox(beamT, h, beamT, 0.02), w / 2, yBase + h / 2, pz));
    }
    // Diagonal timber braces on front/back corners
    for (const sign of [-1, 1]) {
      b.add(
        "timber",
        place(chamferBox(0.14, h * 0.9, 0.14, 0.015), sign * (w / 2 - w / 6), yBase + h / 2, d / 2 + 0.02, 0, 0, sign * 0.56)
      );
    }
  };

  addTimberFrame(width, groundH, depth, plinthH);
  addTimberFrame(uw, upperH, ud, plinthH + groundH);

  // Recessed Doorway on Ground Front
  b.add("timber", place(chamferBox(1.36, 2.25, 0.24, 0.02), 0, plinthH + 1.12, depth / 2 + 0.04));
  b.add("timberLight", place(chamferBox(1.06, 2.08, 0.12, 0.015), 0, plinthH + 1.04, depth / 2 + 0.05));
  b.add("brass", place(chamferBox(0.08, 0.16, 0.1, 0.01), 0.36, plinthH + 1.0, depth / 2 + 0.13));

  // Window bays with frames, sills, mullions, shutters, and recessed glass
  const addWindow = (wx, wy, wz, rotY = 0, w = 1.02, h = 1.32) => {
    const gList = [];
    // Outer frame & sill
    const addLocal = (role, g, lx, ly, lz, rx = 0, ry = 0, rz = 0) => {
      const worldG = place(g, lx, ly, lz, rx, ry, rz);
      b.add(role, place(worldG, wx, wy, wz, 0, rotY, 0));
    };
    addLocal("timber", chamferBox(w + 0.18, h + 0.18, 0.14, 0.015), 0, 0, 0.03);
    addLocal("stoneDark", chamferBox(w + 0.28, 0.12, 0.24, 0.02), 0, -h / 2 - 0.06, 0.07);
    addLocal("glass", chamferBox(w - 0.14, h - 0.14, 0.04, 0.005), 0, 0, 0.06);
    // Cross mullions
    addLocal("timberLight", chamferBox(0.06, h - 0.08, 0.06, 0.008), 0, 0, 0.09);
    addLocal("timberLight", chamferBox(w - 0.08, 0.06, 0.06, 0.008), 0, 0.08, 0.09);
    // Open side shutters
    addLocal("timberLight", chamferBox(w * 0.42, h, 0.07, 0.01), -w / 2 - w * 0.25, 0, 0.08, 0, 0.18, 0);
    addLocal("timberLight", chamferBox(w * 0.42, h, 0.07, 0.01), w / 2 + w * 0.25, 0, 0.08, 0, -0.18, 0);
  };

  // Front windows (upper floor + side ground bays)
  addWindow(-uw * 0.28, plinthH + groundH + upperH * 0.52, ud / 2 + 0.01, 0);
  addWindow(uw * 0.28, plinthH + groundH + upperH * 0.52, ud / 2 + 0.01, 0);
  addWindow(-width * 0.31, plinthH + groundH * 0.54, depth / 2 + 0.01, 0, 0.9, 1.15);
  addWindow(width * 0.31, plinthH + groundH * 0.54, depth / 2 + 0.01, 0, 0.9, 1.15);
  // Side windows
  addWindow(-uw / 2 - 0.01, plinthH + groundH + upperH * 0.52, 0, -Math.PI / 2);
  addWindow(uw / 2 + 0.01, plinthH + groundH + upperH * 0.52, 0, Math.PI / 2);

  // Pitched Gable Roof with Overhanging Eaves, Rafter Tails, & Timber Gables
  const roofBaseY = plinthH + groundH + upperH;
  const eaveOverhang = 0.55;
  const gableLen = ud + eaveOverhang * 2;
  const halfSpan = uw / 2 + eaveOverhang;
  const slopeLen = Math.hypot(halfSpan, roofH);
  const pitchAngle = Math.atan2(roofH, halfSpan);

  // Triangular plaster gable walls front & back
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-uw / 2, 0);
  gableShape.lineTo(uw / 2, 0);
  gableShape.lineTo(0, roofH);
  gableShape.closePath();
  const gableGeo = writeWorldUVs(
    new THREE.ExtrudeGeometry(gableShape, { depth: ud, bevelEnabled: false }),
    0.45
  );
  b.add(plasterRole, place(gableGeo, 0, roofBaseY, -ud / 2));

  // Left & Right roof slopes
  for (const side of [-1, 1]) {
    const cx = side * (halfSpan / 2);
    const cy = roofBaseY + roofH / 2 - 0.08;
    b.add(
      roofRole,
      place(chamferBox(slopeLen + 0.14, 0.2, gableLen, 0.03), cx, cy, 0, 0, 0, -side * pitchAngle)
    );
    // Exposed rafter tails beneath the eaves (seen from eye-level walking!)
    const rafterCount = 7;
    for (let i = 0; i < rafterCount; i++) {
      const rz = -gableLen / 2 + 0.35 + (i / (rafterCount - 1)) * (gableLen - 0.7);
      b.add(
        "timber",
        place(
          chamferBox(slopeLen * 0.96, 0.16, 0.14, 0.015),
          cx,
          cy - 0.15,
          rz,
          0,
          0,
          -side * pitchAngle
        )
      );
    }
  }

  // Crown Ridge Cap Beam
  b.add("stoneDark", place(chamferBox(0.32, 0.28, gableLen + 0.18, 0.04), 0, roofBaseY + roofH + 0.02, 0));

  // Stone Chimney Stack with Chimney Pot
  const chimX = uw * 0.26;
  const chimZ = -ud * 0.18;
  b.add("stoneDark", place(chamferBox(0.88, roofH + 1.45, 0.88, 0.04), chimX, roofBaseY + (roofH + 1.1) / 2, chimZ));
  b.add("stone", place(chamferBox(1.06, 0.22, 1.06, 0.03), chimX, roofBaseY + roofH + 1.25, chimZ));
  b.add("roofClay", place(new THREE.CylinderGeometry(0.16, 0.21, 0.45, 10), chimX, roofBaseY + roofH + 1.55, chimZ));

  // Optional Roof Dormer
  if (hasDormer) {
    const dY = roofBaseY + roofH * 0.46;
    const dX = -uw * 0.24;
    b.add(plasterRole, place(chamferBox(1.3, 1.25, 1.6, 0.02), dX, dY, 0));
    b.add("glass", place(chamferBox(0.75, 0.8, 0.08, 0.01), dX - 0.65, dY, 0, 0, -Math.PI / 2));
    b.add(roofRole, place(chamferBox(1.7, 0.16, 1.1, 0.02), dX - 0.15, dY + 0.76, -0.35, 0.55, 0, 0));
    b.add(roofRole, place(chamferBox(1.7, 0.16, 1.1, 0.02), dX - 0.15, dY + 0.76, 0.35, -0.55, 0, 0));
  }

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// 2. Yeager Residence (Hero Walkable House with Openable Interior Cavity)
// ---------------------------------------------------------------------------

function buildYeagerHouse() {
  const b = new MaterialBatcher();
  const w = 9.0;
  const d = 9.0;
  const wallH = 3.5;
  const wallT = 0.42;
  const upperH = 3.0;
  const roofH = 3.4;

  // Stone foundation slab & timber plank interior floor
  b.add("stone", place(chamferBox(w + 0.4, 0.45, d + 0.4, 0.04), 0, -0.18, 0));
  b.add("timberLight", place(chamferBox(w - 0.6, 0.12, d - 0.6, 0.01), 0, 0.06, 0));

  // Back, Left, Right Ground Walls
  b.add("plaster", place(chamferBox(w, wallH, wallT, 0.03), 0, wallH / 2, -d / 2 + wallT / 2));
  b.add("plaster", place(chamferBox(wallT, wallH, d, 0.03), -w / 2 + wallT / 2, wallH / 2, 0));
  b.add("plaster", place(chamferBox(wallT, wallH, d, 0.03), w / 2 - wallT / 2, wallH / 2, 0));

  // Front Wall split with 2.2m clear Doorway opening centered at x = 0!
  b.add("plaster", place(chamferBox(3.4, wallH, wallT, 0.03), -2.8, wallH / 2, d / 2 - wallT / 2));
  b.add("plaster", place(chamferBox(3.4, wallH, wallT, 0.03), 2.8, wallH / 2, d / 2 - wallT / 2));
  b.add("plaster", place(chamferBox(2.2, 1.05, wallT, 0.03), 0, wallH - 0.525, d / 2 - wallT / 2));

  // Timber door lintel & open timber front door swung inward
  b.add("timber", place(chamferBox(2.45, 0.24, 0.52, 0.02), 0, 2.52, d / 2 - wallT / 2));
  b.add("timber", place(chamferBox(0.22, 2.5, 0.52, 0.02), -1.12, 1.25, d / 2 - wallT / 2));
  b.add("timber", place(chamferBox(0.22, 2.5, 0.52, 0.02), 1.12, 1.25, d / 2 - wallT / 2));
  b.add("timberLight", place(chamferBox(1.05, 2.38, 0.1, 0.015), -1.05, 1.19, d / 2 - 0.72, 0, 1.12, 0));

  // Interior Stone Hearth Fireplace on Back Wall + Continuous Flue Stack up through Roof
  b.add("stoneDark", place(chamferBox(2.4, 2.4, 1.1, 0.04), -1.6, 1.2, -d / 2 + 0.85));
  b.add("stone", place(chamferBox(2.7, 0.28, 1.3, 0.03), -1.6, 2.42, -d / 2 + 0.85));
  b.add("stoneDark", place(chamferBox(1.2, 6.2, 0.95, 0.04), -1.6, 5.4, -d / 2 + 0.8));

  // Interior Wooden Dining Table & Chairs + Bookshelf + Cellar Trapdoor!
  b.add("timberLight", place(chamferBox(2.2, 0.1, 1.2, 0.02), 1.2, 0.82, -0.4));
  for (const lx of [0.3, 2.1]) {
    for (const lz of [-0.88, 0.08]) {
      b.add("timber", place(chamferBox(0.11, 0.78, 0.11, 0.01), lx, 0.41, lz));
    }
  }
  for (const cx of [0.7, 1.7]) {
    b.add("timberLight", place(chamferBox(0.48, 0.07, 0.46, 0.01), cx, 0.46, 0.55));
    b.add("timber", place(chamferBox(0.48, 0.54, 0.07, 0.01), cx, 0.73, 0.75));
  }
  // Grisha's Cellar Hatch in back-right corner
  b.add("timber", place(chamferBox(1.55, 0.09, 1.55, 0.015), 2.8, 0.13, -3.1));
  b.add("metal", place(chamferBox(1.45, 0.05, 0.12, 0.008), 2.8, 0.18, -3.65));
  b.add("brass", place(chamferBox(0.18, 0.08, 0.18, 0.01), 2.8, 0.2, -2.55));

  // Interior Bookshelf along East Wall
  b.add("timber", place(chamferBox(0.46, 2.3, 1.9, 0.02), w / 2 - 0.65, 1.2, -1.6));

  // Interior Ceiling Beams + Upper Attic Floor
  b.add("timber", place(chamferBox(w - 0.2, 0.24, d - 0.2, 0.02), 0, wallH + 0.08, 0));

  // Upper Story & Roof (so exterior holds up from every angle too!)
  b.add("plasterAlt", place(chamferBox(w + 0.5, upperH, d + 0.5, 0.03), 0, wallH + upperH / 2 + 0.18, 0));
  const roofBase = wallH + upperH + 0.18;
  const span = (w + 1.6) / 2;
  const slopeLen = Math.hypot(span, roofH);
  const ang = Math.atan2(roofH, span);
  for (const s of [-1, 1]) {
    b.add(
      "roofClay",
      place(chamferBox(slopeLen, 0.22, d + 1.4, 0.03), s * (span / 2), roofBase + roofH / 2, 0, 0, 0, -s * ang)
    );
  }
  b.add("stoneDark", place(chamferBox(0.36, 0.3, d + 1.5, 0.03), 0, roofBase + roofH, 0));
  b.add("glass", place(chamferBox(1.1, 1.2, 0.1, 0.01), -2.5, wallH + upperH * 0.55, d / 2 + 0.26));
  b.add("glass", place(chamferBox(1.1, 1.2, 0.1, 0.01), 2.5, wallH + upperH * 0.55, d / 2 + 0.26));

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// 3. Wall Maria Gatehouse (50m-compatible monumental arched bastion)
// ---------------------------------------------------------------------------

function buildWallGatehouse() {
  const b = new MaterialBatcher();
  const thick = 10.6;
  const w = 22;
  const h = 50;
  const archW = 10.8;
  const archH = 15.5;
  const springY = archH - archW / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(-archW / 2, 0);
  shape.lineTo(-archW / 2, springY);
  shape.absarc(0, springY, archW / 2, Math.PI, 0, true);
  shape.lineTo(archW / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, h);
  shape.lineTo(-w / 2, h);
  shape.closePath();

  const body = new THREE.ExtrudeGeometry(shape, {
    depth: thick,
    bevelEnabled: true,
    bevelThickness: 0.25,
    bevelSize: 0.2,
    bevelSegments: 2,
    curveSegments: 18,
  });
  body.translate(0, 0, -thick / 2);
  b.add("stone", body);

  // Flanking vertical buttresses
  for (const sx of [-9.2, -6.2, 6.2, 9.2]) {
    b.add("stoneDark", place(chamferBox(1.5, h, 1.6, 0.12), sx, h / 2, thick / 2 + 0.45));
    b.add("stoneDark", place(chamferBox(1.5, h, 1.6, 0.12), sx, h / 2, -thick / 2 - 0.45));
  }

  // Iron portcullis gate raised cleanly to 7.8 m clearance
  for (let i = -4; i <= 4; i++) {
    b.add("metal", place(chamferBox(0.24, 9.0, 0.24, 0.02), i * 1.15, 11.8, thick / 2 - 1.2));
  }
  for (let y = 8.2; y <= 15.0; y += 1.7) {
    b.add("metal", place(chamferBox(archW - 0.4, 0.22, 0.3, 0.02), 0, y, thick / 2 - 1.2));
  }

  // Crown crenellations / merlons + timber winch shelter on top (y = 50m)
  for (let mx = -w / 2 + 1.1; mx <= w / 2 - 1.1; mx += 2.6) {
    b.add("stoneDark", place(chamferBox(1.4, 1.8, 0.9, 0.08), mx, h + 0.9, thick / 2 - 0.45));
    b.add("stoneDark", place(chamferBox(1.4, 1.8, 0.9, 0.08), mx, h + 0.9, -thick / 2 + 0.45));
  }
  // Winch turret housing centered at top
  b.add("stone", place(chamferBox(6.8, 4.2, 5.4, 0.12), 0, h + 2.1, 0));
  b.add("roofSlate", place(chamferBox(7.6, 0.35, 3.6, 0.06), 0, h + 4.9, 1.5, -0.45, 0, 0));
  b.add("roofSlate", place(chamferBox(7.6, 0.35, 3.6, 0.06), 0, h + 4.9, -1.5, 0.45, 0, 0));

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// 4. Garrison Wall Cannon (Lathe barrel + carriage)
// ---------------------------------------------------------------------------

function buildWallCannon() {
  const b = new MaterialBatcher();
  // Tapered bronze/iron cannon barrel
  const profile = [
    new THREE.Vector2(0.01, -1.35),
    new THREE.Vector2(0.16, -1.35),
    new THREE.Vector2(0.24, -1.1),
    new THREE.Vector2(0.25, -0.35),
    new THREE.Vector2(0.21, 0.5),
    new THREE.Vector2(0.18, 1.25),
    new THREE.Vector2(0.24, 1.4),
    new THREE.Vector2(0.15, 1.42),
    new THREE.Vector2(0.14, 0.6),
  ];
  const barrel = new THREE.LatheGeometry(profile, 18);
  b.add("metal", place(barrel, 0, 1.18, 0.2, Math.PI / 2 - 0.12, 0, 0));

  // Timber carriage cheeks
  b.add("timber", place(chamferBox(0.18, 0.68, 2.2, 0.03), -0.34, 0.78, -0.15));
  b.add("timber", place(chamferBox(0.18, 0.68, 2.2, 0.03), 0.34, 0.78, -0.15));
  b.add("timberLight", place(chamferBox(0.84, 0.22, 1.6, 0.02), 0, 0.56, 0));

  // Iron-shod spoked carriage wheels
  for (const sx of [-0.54, 0.54]) {
    const rim = new THREE.TorusGeometry(0.46, 0.06, 10, 20);
    b.add("metal", place(rim, sx, 0.46, 0.35, 0, Math.PI / 2, 0));
    b.add("timber", place(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 12), sx, 0.46, 0.35, 0, 0, Math.PI / 2));
    for (let s = 0; s < 6; s++) {
      b.add("timberLight", place(chamferBox(0.06, 0.86, 0.06, 0.008), sx, 0.46, 0.35, (s * Math.PI) / 6, 0, 0));
    }
  }
  // Wall parapet iron track rail
  b.add("metal", place(chamferBox(1.8, 0.08, 2.8, 0.01), 0, 0.04, 0));

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// 5. District Bell Tower (Shiganshina / Stohess Skyline Anchor)
// ---------------------------------------------------------------------------

function buildBellTower() {
  const b = new MaterialBatcher();
  // Flared plinth + tall ashlar shaft
  b.add("stoneDark", place(chamferBox(5.8, 2.6, 5.8, 0.12), 0, 1.3, 0));
  b.add("stone", place(chamferBox(4.8, 16.5, 4.8, 0.1), 0, 10.8, 0));
  // Corner stone pilasters
  for (const sx of [-2.25, 2.25]) {
    for (const sz of [-2.25, 2.25]) {
      b.add("stoneDark", place(chamferBox(0.65, 18.8, 0.65, 0.06), sx, 9.6, sz));
    }
  }
  // Clock ring & brass hands
  b.add("brass", place(new THREE.TorusGeometry(1.15, 0.09, 10, 24), 0, 16.2, 2.46));
  b.add("glass", place(new THREE.CylinderGeometry(1.08, 1.08, 0.12, 24), 0, 16.2, 2.4, Math.PI / 2, 0, 0));
  b.add("metal", place(chamferBox(0.08, 0.72, 0.08, 0.01), 0, 16.5, 2.49));
  b.add("metal", place(chamferBox(0.55, 0.08, 0.08, 0.01), 0.25, 16.2, 2.49));

  // Open Belfry Pillars + Hung Bronze Bell
  for (const sx of [-1.75, 1.75]) {
    for (const sz of [-1.75, 1.75]) {
      b.add("stone", place(chamferBox(0.75, 4.2, 0.75, 0.05), sx, 21.1, sz));
    }
  }
  const bellPts = [
    new THREE.Vector2(0.01, 0.7),
    new THREE.Vector2(0.32, 0.66),
    new THREE.Vector2(0.45, 0.2),
    new THREE.Vector2(0.75, -0.45),
    new THREE.Vector2(0.92, -0.7),
    new THREE.Vector2(0.75, -0.7),
  ];
  b.add("brass", place(new THREE.LatheGeometry(bellPts, 18), 0, 21.2, 0));

  // Steep octagonal slate spire
  b.add("roofSlate", place(new THREE.ConeGeometry(3.35, 9.5, 8), 0, 27.9, 0, 0, Math.PI / 8, 0));
  b.add("brass", place(chamferBox(0.18, 1.8, 0.18, 0.02), 0, 33.2, 0));

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// 6. Market Supply Wagon
// ---------------------------------------------------------------------------

function buildMarketWagon() {
  const b = new MaterialBatcher();
  b.add("timber", place(chamferBox(1.55, 0.16, 3.2, 0.02), 0, 0.68, 0));
  b.add("timberLight", place(chamferBox(0.1, 0.75, 3.1, 0.015), -0.72, 1.12, 0));
  b.add("timberLight", place(chamferBox(0.1, 0.75, 3.1, 0.015), 0.72, 1.12, 0));
  b.add("timberLight", place(chamferBox(1.5, 0.75, 0.1, 0.015), 0, 1.12, -1.52));
  // Canopy hoops & linen tarp
  const hoopGeo = new THREE.CylinderGeometry(0.82, 0.82, 3.1, 14, 1, false, 0, Math.PI);
  b.add("cloth", place(hoopGeo, 0, 1.5, 0, Math.PI / 2, 0, -Math.PI / 2));
  // Wooden barrels inside
  const barrelProfile = [
    new THREE.Vector2(0.01, -0.42),
    new THREE.Vector2(0.28, -0.42),
    new THREE.Vector2(0.35, 0),
    new THREE.Vector2(0.28, 0.42),
    new THREE.Vector2(0.01, 0.42),
  ];
  b.add("timber", place(new THREE.LatheGeometry(barrelProfile, 14), -0.3, 1.18, 1.05));
  b.add("timber", place(new THREE.LatheGeometry(barrelProfile, 14), 0.32, 1.18, 0.95));

  // Four spoked wheels
  for (const sx of [-0.9, 0.9]) {
    for (const sz of [-1.05, 1.05]) {
      const r = sz > 0 ? 0.44 : 0.56;
      b.add("metal", place(new THREE.TorusGeometry(r, 0.045, 8, 18), sx, r, sz, 0, Math.PI / 2, 0));
      for (let s = 0; s < 5; s++) {
        b.add("timberLight", place(chamferBox(0.05, r * 1.9, 0.05, 0.006), sx, r, sz, (s * Math.PI) / 5, 0, 0));
      }
    }
  }
  // Front shaft poles
  b.add("timber", place(chamferBox(0.08, 0.08, 1.85, 0.01), -0.42, 0.72, 2.4, 0.08, 0, 0));
  b.add("timber", place(chamferBox(0.08, 0.08, 1.85, 0.01), 0.42, 0.72, 2.4, 0.08, 0, 0));

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// 7. ODM Gear Assembly (Hip Scabbards, Winch Drum, Steel Blades)
// ---------------------------------------------------------------------------

function buildOdmGear() {
  const b = new MaterialBatcher();
  // Dorsal central wire winch drum with twin angled vents
  b.add("metal", place(new THREE.CylinderGeometry(0.085, 0.085, 0.18, 16), 0, 0.96, -0.15, Math.PI / 2, 0, 0));
  b.add("brass", place(new THREE.CylinderGeometry(0.052, 0.052, 0.21, 14), 0, 0.96, -0.15, Math.PI / 2, 0, 0));

  // Snug hip-hugged blade scabbard boxes + compressed gas canisters angled cleanly back-downward
  for (const s of [-1, 1]) {
    b.add(
      "metal",
      place(chamferBox(0.075, 0.11, 0.56, 0.012), s * 0.21, 0.84, -0.02, -0.36, s * 0.08, s * -0.06)
    );
    b.add(
      "metal",
      place(
        new THREE.CylinderGeometry(0.032, 0.032, 0.42, 12),
        s * 0.21,
        0.92,
        -0.02,
        Math.PI / 2 - 0.36,
        0,
        s * 0.08
      )
    );
    b.add("brass", place(chamferBox(0.045, 0.055, 0.1, 0.006), s * 0.23, 0.9, 0.21, -0.36, 0, 0));
  }

  return b.toGroup(DEFAULT_MATS);
}

// ---------------------------------------------------------------------------
// Export All Assets to Binary .glb
// ---------------------------------------------------------------------------

const exporter = new GLTFExporter();

async function exportModel(filename, group) {
  const arrayBuffer = await exporter.parseAsync(group, { binary: true });
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
  console.log(`Generated ${filename} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
  await exportModel(
    "house-timber-a.glb",
    buildModularHouse({ width: 6.2, depth: 7.4, groundH: 2.8, upperH: 2.9, roofH: 3.3, roofRole: "roofClay", plasterRole: "plaster", hasDormer: true })
  );
  await exportModel(
    "house-timber-b.glb",
    buildModularHouse({ width: 5.8, depth: 6.8, groundH: 2.6, upperH: 2.7, roofH: 2.9, roofRole: "roofSlate", plasterRole: "plasterAlt", hasDormer: false })
  );
  await exportModel(
    "house-townhouse.glb",
    buildModularHouse({ width: 7.4, depth: 8.0, groundH: 3.1, upperH: 3.2, roofH: 3.8, roofRole: "roofSlate", plasterRole: "plaster", hasDormer: true, jetty: 0.34 })
  );
  await exportModel("yeager-house.glb", buildYeagerHouse());
  await exportModel("wall-gatehouse.glb", buildWallGatehouse());
  await exportModel("wall-cannon.glb", buildWallCannon());
  await exportModel("bell-tower.glb", buildBellTower());
  await exportModel("market-wagon.glb", buildMarketWagon());
  await exportModel("odm-gear.glb", buildOdmGear());
  console.log("All binary GLB models generated cleanly in public/models/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
