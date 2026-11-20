import { localShiganshinaHeight, paradisMacroHeight } from "./noise";
import type { ExplorationMode } from "@/data/world";

export interface BoxCollider {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  /** Optional portal door gap allowing player entry inside Yeager Residence */
  walkableInterior?: boolean;
}

/**
 * Authoritative Shiganshina & Wall Maria collision volume registry.
 * Mirrors the exact footprints of Wall Maria masonry, gate pillars, canal edges, and buildings.
 */
export const SHIGANSHINA_COLLIDERS: BoxCollider[] = [
  // Wall Maria Left & Right masonry wings (leaving central arched gate x in [-5.8, 5.8] open!)
  { id: "wall-maria-west", minX: -120, maxX: -5.8, minZ: 13, maxZ: 23, minY: 0, maxY: 50 },
  { id: "wall-maria-east", minX: 5.8, maxX: 120, minZ: 13, maxZ: 23, minY: 0, maxY: 50 },

  // Major Shiganshina Town Blocks (flanking central avenue x in [-8.5, 8.5])
  { id: "block-west-1", minX: -21, maxX: -11, minZ: -16, maxZ: -5, minY: 0, maxY: 13 },
  { id: "block-west-2", minX: -21, maxX: -11, minZ: -31, maxZ: -20, minY: 0, maxY: 13 },
  { id: "block-east-1", minX: 11, maxX: 21, minZ: -16, maxZ: -5, minY: 0, maxY: 13 },
  { id: "block-east-2", minX: 11, maxX: 21, minZ: -31, maxZ: -20, minY: 0, maxY: 13 },
  { id: "block-east-3", minX: 11, maxX: 22, minZ: -48, maxZ: -36, minY: 0, maxY: 15 },
  { id: "bell-tower", minX: 24, maxX: 31, minZ: -22, maxZ: -15, minY: 0, maxY: 32 },

  // Yeager Residence outer walls (footprint x in [-26.5, -17.5], z in [-42.5, -33.5])
  // Leaves front door doorway at x in [-23.1, -20.9], z = -33.5 open for interior exploration!
  { id: "yeager-north-wall", minX: -26.5, maxX: -17.5, minZ: -42.7, maxZ: -42.1, minY: 0, maxY: 9 },
  { id: "yeager-west-wall", minX: -26.7, maxX: -26.1, minZ: -42.5, maxZ: -33.5, minY: 0, maxY: 9 },
  { id: "yeager-east-wall", minX: -17.9, maxX: -17.3, minZ: -42.5, maxZ: -33.5, minY: 0, maxY: 9 },
  { id: "yeager-south-left", minX: -26.5, maxX: -23.1, minZ: -33.8, maxZ: -33.2, minY: 0, maxY: 9 },
  { id: "yeager-south-right", minX: -20.9, maxX: -17.5, minZ: -33.8, maxZ: -33.2, minY: 0, maxY: 9 },
];

export function sampleGroundHeight(mode: ExplorationMode, x: number, z: number): number {
  if (mode === "paradis") {
    return Math.max(0.2, paradisMacroHeight(x, z));
  }
  if (mode === "shiganshina" || mode === "walls" || mode === "districts") {
    // Allow walking atop Wall Maria parapet when within wall bounds
    if (z >= 13.4 && z <= 22.6 && Math.abs(x) <= 115) {
      return 50.0;
    }
    return Math.max(0, localShiganshinaHeight(x, z));
  }
  return 0;
}

/**
 * Resolves circle-vs-AABB collisions for smooth first/third-person walking without wall clipping.
 */
export function resolveWorldCollision(
  mode: ExplorationMode,
  x: number,
  y: number,
  z: number,
  radius = 0.55
): { x: number; y: number; z: number } {
  let rx = x;
  let ry = y;
  let rz = z;

  if (mode === "shiganshina" || mode === "walls") {
    for (const c of SHIGANSHINA_COLLIDERS) {
      if (ry > c.maxY - 0.4 || ry + 1.8 < c.minY) continue;
      const closestX = Math.max(c.minX, Math.min(rx, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(rz, c.maxZ));
      const dx = rx - closestX;
      const dz = rz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        if (distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const push = radius - dist;
          rx += (dx / dist) * push;
          rz += (dz / dist) * push;
        } else {
          // Inside box fallback: push out nearest edge
          const dLeft = Math.abs(rx - c.minX);
          const dRight = Math.abs(c.maxX - rx);
          const dBack = Math.abs(rz - c.minZ);
          const dFront = Math.abs(c.maxZ - rz);
          const m = Math.min(dLeft, dRight, dBack, dFront);
          if (m === dLeft) rx = c.minX - radius;
          else if (m === dRight) rx = c.maxX + radius;
          else if (m === dBack) rz = c.minZ - radius;
          else rz = c.maxZ + radius;
        }
      }
    }
  }

  return { x: rx, y: ry, z: rz };
}
