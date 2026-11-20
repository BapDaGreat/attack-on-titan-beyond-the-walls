import type { ExplorationMode } from "./world";

export interface TourStop {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  mode: ExplorationMode;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  fov: number;
  dwellSeconds: number;
  /** Optional scene-specific toggles driven by this stop */
  presetOptions?: {
    wallXray?: boolean;
    timeOfDay?: "morning" | "midday" | "sunset" | "night";
    titanId?: string;
    scalePair?: [string, string];
    insideHouse?: boolean;
  };
}

export interface GuidedTour {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  stops: TourStop[];
}

export const GUIDED_TOURS: GuidedTour[] = [
  {
    id: "tour-paradis",
    number: "01",
    title: "Welcome to Paradis Island",
    subtitle: "Approach across the outer sea to reveal the landmass and concentric stone rings.",
    stops: [
      {
        id: "paradis-ocean-approach",
        title: "Across the Outer Sea",
        eyebrow: "Tour I · Stop 1",
        description: "Approaching Paradis Island from the southern ocean horizon. For a century, no ship crossed these waters from the Walls.",
        mode: "paradis",
        cameraPos: [0, 75, 290],
        cameraTarget: [0, 8, 25],
        fov: 42,
        dwellSeconds: 7,
        presetOptions: { timeOfDay: "morning" },
      },
      {
        id: "paradis-concentric-rings",
        title: "Three Concentric Bulwarks",
        eyebrow: "Tour I · Stop 2",
        description: "Wall Maria (480 km radius), Wall Rose (380 km), and Wall Sina (250 km) divide humanity into layered territories around Mitras.",
        mode: "paradis",
        cameraPos: [-110, 145, 195],
        cameraTarget: [0, 4, 0],
        fov: 40,
        dwellSeconds: 7,
        presetOptions: { timeOfDay: "midday" },
      },
      {
        id: "paradis-southern-salient",
        title: "Descent to Shiganshina",
        eyebrow: "Tour I · Stop 3",
        description: "Zeroing in on the southern salient of Wall Maria where every outward expedition and breach begins.",
        mode: "paradis",
        cameraPos: [26, 42, 222],
        cameraTarget: [0, 4, 165],
        fov: 38,
        dwellSeconds: 6,
      },
    ],
  },
  {
    id: "tour-walls",
    number: "02",
    title: "Humanity Behind the Walls",
    subtitle: "Feel the 50-meter vertical masonry scale and expose the Titans sleeping inside.",
    stops: [
      {
        id: "walls-ground-shadow",
        title: "At the Base of 50 Meters",
        eyebrow: "Tour II · Stop 1",
        description: "From ground level, Wall Maria's ashlar masonry blocks out half the sky, casting long afternoon shadows across the meadow.",
        mode: "walls",
        cameraPos: [14, 2.2, 68],
        cameraTarget: [0, 26, 0],
        fov: 46,
        dwellSeconds: 7,
        presetOptions: { wallXray: false, timeOfDay: "sunset" },
      },
      {
        id: "walls-xray-titans",
        title: "The Secret Inside the Stone",
        eyebrow: "Tour II · Stop 2",
        description: "The survey scan reveals what Pastor Nick feared most: rows of 50-meter Wall Titans standing shoulder-to-shoulder within the hardened stone.",
        mode: "walls",
        cameraPos: [-28, 25, 58],
        cameraTarget: [0, 25, 0],
        fov: 44,
        dwellSeconds: 8,
        presetOptions: { wallXray: true },
      },
      {
        id: "walls-parapet-walk",
        title: "Crown Rail & Wall Maria → Sina Flight",
        eyebrow: "Tour II · Stop 3",
        description: "Sweeping from the rail-mounted cannons atop Wall Maria across the plains toward Wall Rose and distant Wall Sina.",
        mode: "walls",
        cameraPos: [18, 53.5, 4],
        cameraTarget: [-24, 47, -140],
        fov: 45,
        dwellSeconds: 8,
        presetOptions: { wallXray: false, timeOfDay: "midday" },
      },
    ],
  },
  {
    id: "tour-shiganshina",
    number: "03",
    title: "Explore Shiganshina",
    subtitle: "Descend into cobblestone avenues, river canals, and Eren Yeager's childhood home.",
    stops: [
      {
        id: "shig-gate-boulevard",
        title: "Inner Gate & Radial Boulevard",
        eyebrow: "Tour III · Stop 1",
        description: "Past the iron-shod portcullis lies Shiganshina's main stone avenue flanked by half-timbered shops and Garrison carts.",
        mode: "shiganshina",
        cameraPos: [4, 6.5, 52],
        cameraTarget: [0, 5, -18],
        fov: 45,
        dwellSeconds: 7,
        presetOptions: { insideHouse: false, timeOfDay: "morning" },
      },
      {
        id: "shig-canal-market",
        title: "Canal Bridge & Marketplace",
        eyebrow: "Tour III · Stop 2",
        description: "Merchants display timber crates beneath striped linen awnings alongside the stone river bridge.",
        mode: "shiganshina",
        cameraPos: [-26, 4.2, -6],
        cameraTarget: [8, 4.5, -16],
        fov: 44,
        dwellSeconds: 7,
      },
      {
        id: "shig-yeager-interior",
        title: "Inside the Yeager Residence",
        eyebrow: "Tour III · Stop 3",
        description: "Stepping across the threshold into the Yeager hearth room—table, oil lantern, bookshelves, and the stair leading to Grisha's cellar.",
        mode: "shiganshina",
        cameraPos: [-18.5, 2.0, -34.2],
        cameraTarget: [-22.5, 1.4, -37.8],
        fov: 52,
        dwellSeconds: 8,
        presetOptions: { insideHouse: true, timeOfDay: "sunset" },
      },
    ],
  },
  {
    id: "tour-scale",
    number: "04",
    title: "The Scale of Titans",
    subtitle: "Stand at 1.7 meters eye level beside the Colossal Titan and Wall Maria.",
    stops: [
      {
        id: "scale-overview",
        title: "Humanity Beside the Wall",
        eyebrow: "Tour IV · Stop 1",
        description: "At true 1:1 meter scale, a 15-meter Attack Titan towers over three-story houses while the 60-meter Colossal Titan looks down over the 50-meter wall.",
        mode: "scale",
        cameraPos: [16, 18, 84],
        cameraTarget: [0, 22, 0],
        fov: 46,
        dwellSeconds: 7,
        presetOptions: { scalePair: ["colossal-titan", "wall-maria"] },
      },
      {
        id: "scale-human-eye",
        title: "1.70 m Ground Perspective",
        eyebrow: "Tour IV · Stop 2",
        description: "Looking up from human eye height at the Colossal Titan's crimson knees and sixty-meter silhouette blocking the sun.",
        mode: "scale",
        cameraPos: [-6, 1.7, 36],
        cameraTarget: [3, 36, 0],
        fov: 58,
        dwellSeconds: 8,
        presetOptions: { scalePair: ["average-human", "colossal-titan"] },
      },
    ],
  },
  {
    id: "tour-nine-titans",
    number: "05",
    title: "The Nine Titans",
    subtitle: "Study the distinctive anatomy, armor plates, fur, and steam of Ymir's divided power.",
    stops: [
      {
        id: "nine-attack",
        title: "The Attack Titan (15 m)",
        eyebrow: "Tour V · Stop 1",
        description: "Exposed jaw musculature, pointed ears, and athletic torso engineered for relentless close-range combat.",
        mode: "titans",
        cameraPos: [10, 8, 22],
        cameraTarget: [0, 7.5, 0],
        fov: 42,
        dwellSeconds: 6,
        presetOptions: { titanId: "attack" },
      },
      {
        id: "nine-armored",
        title: "The Armored Titan (15 m)",
        eyebrow: "Tour V · Stop 2",
        description: "Interlocking bone-ivory dermal plates shielding vital shoulders, chest, and shins above crimson muscle joints.",
        mode: "titans",
        cameraPos: [-11, 8, 22],
        cameraTarget: [0, 7.5, 0],
        fov: 42,
        dwellSeconds: 6,
        presetOptions: { titanId: "armored" },
      },
      {
        id: "nine-colossal",
        title: "The Colossal Titan (60 m)",
        eyebrow: "Tour V · Stop 3",
        description: "Flayed musculature, columnar ankles, and thermal steam pressure that dwarfs every other shifter.",
        mode: "titans",
        cameraPos: [26, 26, 78],
        cameraTarget: [0, 28, 0],
        fov: 46,
        dwellSeconds: 7,
        presetOptions: { titanId: "colossal" },
      },
    ],
  },
  {
    id: "tour-beyond",
    number: "06",
    title: "Beyond the Walls",
    subtitle: "Venture into the 80-meter Forest of Giant Trees and moonlit Utgard watchtower ruins.",
    stops: [
      {
        id: "beyond-forest-rays",
        title: "Canopy of the 80m Giants",
        eyebrow: "Tour VI · Stop 1",
        description: "Crepuscular shafts pierce ancient eighty-meter trunks where Survey Corps formations rely entirely on high-altitude ODM cables.",
        mode: "beyond",
        cameraPos: [0, 12, 42],
        cameraTarget: [0, 24, -15],
        fov: 48,
        dwellSeconds: 7,
        presetOptions: { timeOfDay: "morning" },
      },
      {
        id: "beyond-utgard",
        title: "Utgard Watchtower Keep",
        eyebrow: "Tour VI · Stop 2",
        description: "A crumbling stone keep standing amid outer meadows—site of desperate nighttime defense before reinforcements arrived.",
        mode: "beyond",
        cameraPos: [-24, 14, -46],
        cameraTarget: [18, 12, -62],
        fov: 45,
        dwellSeconds: 7,
        presetOptions: { timeOfDay: "sunset" },
      },
    ],
  },
];
