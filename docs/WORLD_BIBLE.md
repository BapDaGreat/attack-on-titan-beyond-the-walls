# World Bible & Production Ledgers — Attack on Titan: Beyond the Walls

> Authored before major scene implementation in accordance with `@MengTo/Skills`:
> `build-threejs-scroll-worlds`, `3d-kasumidera-ultra-realism`, `3d-modular-buildings`,
> `3d-high-poly-models`, `3d-high-resolution-textures`, `3d-ultra-realistic-water`,
> `3d-sky-background`, `3d-sky-rays`, `3d-survey-scan`, `3d-wood-material`,
> `3d-cloth-material`, `3d-metal-material`, `threejs-landscape`, `threejs-weather`,
> `3d-virtual-tour`, `build-ultra-realistic-game-interiors`, `build-3d-character-selector`,
> `no-ai-design-slop`, `sylva-field-guide-layout`, and `iterate-until-verified`.

## 1. World Sentence & Interaction Contract

- **World sentence:** Descend from the sunlit ocean horizon above Paradis Island through the three 50-meter concentric masonry walls into the living cobblestone avenues of Shiganshina District, Yeager Residence's hearth-lit interior, the towering Forest of Giant Trees, and a 1:1 metric Scale & Anatomy archive of the Nine Titans.
- **Interaction contract:** Guided narrative tours, direct mode/chapter switching, and free exploration share one authoritative camera rig and persistent WebGL world; pointer, keyboard, and touch move locally without breaking continuity, and every 3D interactive landmark has an accessible DOM counterpart.

## 2. Scale & Coordinate Contract

| Domain | Unit Convention | Ground / Datum | Notes |
| --- | --- | --- | --- |
| Primary 3D Zones (Walls, Shiganshina, Districts, Interior, Titan Lab, Characters, Beyond the Walls) | **1 Three.js unit = 1.0 meter** | `y = 0` street/plaza datum | Exact metric fidelity for human `1.70 m`, Eren `1.70 / 1.83 m`, 3–17 m Titans, 50 m Walls, 60 m Colossal Titan, and 240+ m Founding Titan silhouette |
| Paradis Island Macro Globe / Aerial Overview | **1 Three.js unit = 1.0 km** (annotated clearly as Strategic 1:1000 Island Relief) | `y = 0` sea level | Prevents WebGL float32 precision jitter across the ~960 km island diameter; clicking any district smoothly descends through atmospheric clouds into its 1:1 m zone |

## 3. Visual Bible — Palette & Typography

| Role | Hex | Application |
| --- | --- | --- |
| Charcoal Ink | `#121311` | Primary archival dark surface, shadow scrims (never flat pure `#000000`) |
| Warm Stone Slate | `#1E211D` | Panel framing and architectural ground shadow tint |
| Weathered Parchment | `#EAE3D2` | Primary editorial typography and historical survey labels |
| Muted Ash | `#A49D8E` | Secondary telemetry, metadata, captions |
| Survey Moss | `#3E5641` | Survey Corps accent, active chapter markers |
| Tarnished Brass | `#B8965A` | Monumental borders, Wall markers, compass graduation |
| Flare Crimson | `#9E2B25` | Titan signal / Wall breach annotations / active warning accents |

- **Typography:** `Cinzel` (monumental display headings), `Plus Jakarta Sans` (body prose and controls), `JetBrains Mono` (metric rulers, wall radii, elevation telemetry).
- **Anti-slop stance:** No purple-blue gradients, no glowing neon boxes, no glassmorphism cards stacked in bentos, no generic Inter defaults, no unmotivated particle flares.

## 4. Zone & Chapter Ledger

| Mode / Zone | Landmark | Camera Archetype | Lighting / Fog |
| --- | --- | --- | --- |
| `paradis` | Full Paradis Island coastline, concentric Wall Maria (480 km), Rose (380 km), Sina (250 km), mountain ridges, rivers, ocean horizon | High aerial orbit (`fov: 42`) | Crisp sky dome + Gerstner ocean + valley fog |
| `walls` | Monumental 50m Wall Maria outer face, buttresses, battlements, rail cannons, gates, Wall Rose & Wall Sina distance arc, **X-Ray Wall Titan Cutaway** | Ground-to-summit crane & wall-top promenade | Raking directional sunlight casting 50m shadows across meadows |
| `shiganshina` | Flagship 1:1 m district: radial stone avenues, canal & masonry bridges, half-timbered houses (procedural bays + beveled joinery), marketplace, church spire, Survey Corps stables, **walkable Yeager Residence interior**, animated NPCs & horse carts | Street-level free walk/fly + orbit + interior entry | Warm directional key, practical oil/lantern point lights, chimney smoke |
| `districts` | Interactive switcher across Shiganshina, Trost (Wall Rose gate + HQ), Stohess (Wall Sina noble spire plaza), Mitras (Royal Capital), Orvud, Karanes, Utopia, Ehrmich, and Survey Corps HQ | Smooth district transitions | District-matched fog & architectural tone |
| `titans` | All Nine Titans + Pure & Abnormal Titans with sculpted anatomical musculature/armor/fur/crystalline constructs, steam emission, **Transformation Lightning Sequence** | 360° Museum Stage + close-up inspection | Dramatic key + cool fill + warm rim + ember/steam VFX |
| `scale` | Side-by-side 1:1 m **Scale Comparison Laboratory** backed by the 50m Wall Maria facade, laser metric rulers (`1m` to `350m`), human eye (`1.7m`) camera switch, silhouette & X-ray overlay modes | Ground-level human-eye perspective + wide metric framing | Crisp studio-outdoor raking light |
| `characters` | 11 major characters in Survey Corps / Regiment gear with sculpted ODM harness, steel blades, woven cloaks, idle breathing & pose presets | Full-body 360° inspection stage | Warm key, cool shadow fill, grazing hair/steel rim |
| `beyond` | Forest of Giant Trees (70m swept trunks, alpha-tested leaf canopies, volumetric sun rays), rural village ruins, Utgard watchtower | Canopy-to-forest-floor & watchtower approach | God rays (`3d-sky-rays`), drifting leaves, atmospheric mist |

## 5. Material, Texture & Asset Ledger

| Asset / Material | Pipeline & Color Space | Resolution / Geometry Strategy |
| --- | --- | --- |
| Wall Cyclopean Masonry | Procedural 1024px PBR (Albedo `SRGBColorSpace`, Normal/Roughness/AO `NoColorSpace`), world-unit UV tiling | Instanced beveled ashlar courses + buttresses + GLB gatehouse/cannon (`public/models/*.glb`) |
| Timber Framing & Planks | `3d-wood-material` shader/bake (radial growth rings, pores, end-grain darkening, bevel arris) | Procedural GLB modular beams & chamfered boxes |
| Slate & Clay Roof Tiles | Procedural 1024px staggered tile normal + roughness variation + moss crevice AO | Instanced roof slope rows + ridge caps + dormer gables |
| Survey Corps Cloth & Market Awnings | `3d-cloth-material` (woven warp/weft normal, restrained sheen, hem thickness, thread wear) | Draped capes, awnings, banners |
| ODM Steel Blades & Cannons | `3d-metal-material` (`metalness: 1.0`, linear F0 `0.56, 0.57, 0.58`, brushed streak roughness + HDR reflection scene) | Procedural GLB blade scabbards, rail cannons, gates |
| Paradis Ocean & Canal Water | Gerstner wave spectrum (`3d-ultra-realistic-water`), analytic per-pixel normals, footprint fade, sky reflection, crest foam | Polar/ring water mesh around Paradis + canal water shader |
| Modular Houses, Gatehouse, Yeager House, Titan/Character Base Meshes | Build-time Node `GLTFExporter` -> `public/models/*.glb` + procedural parametric anatomical/architectural sub-assemblies | Distinct silhouettes, chamfered bevels, LOD levels, shared materials |

> **Honest Asset Provenance Note:** Every `.glb` mesh and PBR map in this project is procedurally engineered and exported in TypeScript/Node using Three.js `GLTFExporter` and procedural noise/canvas/shader pipelines (no unverified ripped anime assets and no external paid API dependencies). Architectural and anatomical sculpts follow strict 1:1 m canon proportions; if bespoke ZBrush-scanned artist character/Titan `.glb` models are supplied later, `src/engine/assetManifest.ts` supports drop-in replacement by model ID.

## 6. Performance Budget & Quality Tiers

| Preset | Max DPR | Shadow Map | Postprocessing | Foliage / NPC Density | Target Frame Time |
| --- | --- | --- | --- | --- | --- |
| Ultra | `2.0` | `2048` PCFSoft | N8AO + Selective Bloom + DoF + Vignette/ACES | 100% | `<= 16.7 ms` |
| High (Default Desktop) | `1.75` | `2048` PCFSoft | N8AO + Selective Bloom + ACES | 85% | `<= 16.7 ms` |
| Medium (Default Mobile) | `1.35` | `1024` PCFSoft | Selective Bloom + ACES | 55% | `<= 25 ms` |
| Low | `1.0` | `0` (Baked/Hemi) | ACES ToneMapping only | 30% | `<= 25 ms` |
