/**
 * Asset path & GLB model registry.
 * Preserves compatibility across localhost `/` and GitHub Pages `/repo-name/` subpaths.
 */

export function assetPath(relativePath: string): string {
  const clean = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${clean}`;
}

export const MODEL_PATHS = {
  wallGatehouse: assetPath("models/wall-gatehouse.glb"),
  wallCannon: assetPath("models/wall-cannon.glb"),
  houseTimberA: assetPath("models/house-timber-a.glb"),
  houseTimberB: assetPath("models/house-timber-b.glb"),
  houseTownhouse: assetPath("models/house-townhouse.glb"),
  yeagerHouse: assetPath("models/yeager-house.glb"),
  bellTower: assetPath("models/bell-tower.glb"),
  marketWagon: assetPath("models/market-wagon.glb"),
  odmGear: assetPath("models/odm-gear.glb"),
} as const;

export type ModelKey = keyof typeof MODEL_PATHS;
