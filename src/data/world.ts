export type ExplorationMode =
  | "paradis"
  | "walls"
  | "shiganshina"
  | "districts"
  | "titans"
  | "scale"
  | "characters"
  | "beyond";

export type DistrictId =
  | "shiganshina"
  | "trost"
  | "stohess"
  | "mitras"
  | "orvud"
  | "karanes"
  | "utopia"
  | "ehrmich"
  | "survey-hq"
  | "forest-giant-trees"
  | "utgard";

export interface WallSpec {
  id: "maria" | "rose" | "sina";
  name: string;
  canonRadiusKm: number;
  canonCircumferenceKm: number;
  macroRadiusUnits: number;
  heightMeters: number;
  thicknessMeters: number;
  builtYear: string;
  status: string;
  summary: string;
  keyDistricts: string[];
  colorAccent: string;
}

export interface DistrictSpec {
  id: DistrictId;
  name: string;
  wall: "Maria" | "Rose" | "Sina" | "Interior" | "Beyond";
  compass: "South" | "East" | "North" | "West" | "Center" | "Outer Wilds";
  canonFidelity: "Canon" | "Canon (Architectural Reconstruction)" | "Reconstructed Exterior";
  /** Position on Paradis Island macro relief (1 unit = 1 km from Mitras center) */
  macroPos: [number, number, number];
  /** Architectural palette & density tuning for the 1:1m district stage */
  biome: "frontier-canal" | "garrison-hub" | "noble-spire" | "royal-citadel" | "highland-fort" | "giant-forest" | "ruined-keep";
  elevationMeters: number;
  wallHeightMeters: number;
  populationEstimate: string;
  architectureNotes: string;
  summary: string;
  highlights: string[];
}

export const WALL_SPECS: WallSpec[] = [
  {
    id: "maria",
    name: "Wall Maria",
    canonRadiusKm: 480,
    canonCircumferenceKm: 3016,
    macroRadiusUnits: 165,
    heightMeters: 50,
    thicknessMeters: 10,
    builtYear: "Year 743 (Official Record — True origin Year 743 pre-memory wipe)",
    status: "Outermost Frontier Perimeter · Breached in Year 845, Reclaimed in Year 850",
    summary:
      "The vast outermost stone bulwark enclosing agricultural plains, frontier forests, and four protruding decoy districts designed to funnel Titan approaches to fortified gates.",
    keyDistricts: ["Shiganshina (South)", "Quinta (West)", "Calaneth (East)", "Yarckel (North)"],
    colorAccent: "#9E2B25",
  },
  {
    id: "rose",
    name: "Wall Rose",
    canonRadiusKm: 380,
    canonCircumferenceKm: 2387,
    macroRadiusUnits: 126,
    heightMeters: 50,
    thicknessMeters: 10,
    builtYear: "107 Years Prior to Fall of Shiganshina",
    status: "Middle Defensive Ring · Primary Garrison & Cadet Corps Stronghold",
    summary:
      "Separating the fertile inner farmlands from the lost Maria territory, Wall Rose houses Trost's boulder-sealed gate, river transport locks, and Survey Corps staging depots.",
    keyDistricts: ["Trost (South)", "Karanes (East)", "Utopia (North)", "Chlorba (West)"],
    colorAccent: "#B8965A",
  },
  {
    id: "sina",
    name: "Wall Sina",
    canonRadiusKm: 250,
    canonCircumferenceKm: 1570,
    macroRadiusUnits: 82,
    heightMeters: 50,
    thicknessMeters: 10,
    builtYear: "107 Years Prior to Fall of Shiganshina",
    status: "Innermost Citadel Ring · Protected by the Military Police & Royal Government",
    summary:
      "The affluent core encircling Mitras, noble stone avenues, subterranean crystal vaults, and high-gabled slate towns spared from direct Titan siege for over a century.",
    keyDistricts: ["Mitras (Capital)", "Stohess (East)", "Orvud (North)", "Ehrmich (South)", "Yarckel-West (Hermiha)"],
    colorAccent: "#3E5641",
  },
];

export const DISTRICTS: DistrictSpec[] = [
  {
    id: "shiganshina",
    name: "Shiganshina District",
    wall: "Maria",
    compass: "South",
    canonFidelity: "Canon",
    macroPos: [0, 3.2, 165],
    biome: "frontier-canal",
    elevationMeters: 14,
    wallHeightMeters: 50,
    populationEstimate: "~45,000 pre-845",
    architectureNotes:
      "Half-timbered stone-plinth townhouses, scalloped clay & slate roofs, central river canal with arched masonry bridges, Outer/Inner Wall Maria gatehouses, and Yeager Residence.",
    summary:
      "A southern protruding decoy town of Wall Maria bisected by a slow river canal. Dominated by the 50-meter southern gate where the Colossal Titan first shattered humanity's illusion of safety.",
    highlights: [
      "50m Outer & Inner Wall Maria Gates",
      "Walkable Yeager Residence & Grisha's Cellar Door",
      "Stone Canal & Timber Marketplace",
      "Wall-Top Rail Cannon Parapets",
    ],
  },
  {
    id: "trost",
    name: "Trost District",
    wall: "Rose",
    compass: "South",
    canonFidelity: "Canon",
    macroPos: [0, 4.0, 126],
    biome: "garrison-hub",
    elevationMeters: 22,
    wallHeightMeters: 50,
    populationEstimate: "~60,000",
    architectureNotes:
      "Dense Garrison supply headquarters, reinforced river locks, slate-roofed barracks, and wide central square crowned by the massive limestone boulder.",
    summary:
      "The southern salient of Wall Rose and site of humanity's first victory reclaiming lost ground when Eren Yeager sealed the breached outer gate with a colossal boulder.",
    highlights: [
      "Sealed Gate & Limestone Boulder Monument",
      "Divisional Supply & Gas Depot HQ",
      "Canal Lift Gate & Garrison Barracks",
    ],
  },
  {
    id: "stohess",
    name: "Stohess District",
    wall: "Sina",
    compass: "East",
    canonFidelity: "Canon",
    macroPos: [82, 5.2, 0],
    biome: "noble-spire",
    elevationMeters: 38,
    wallHeightMeters: 50,
    populationEstimate: "~75,000",
    architectureNotes:
      "Cut-ashlar stonework, tall gothic stone church spires, broad paved boulevards, ornate wrought-iron streetlamps, and Military Police brigade halls.",
    summary:
      "The prosperous eastern gate city of Wall Sina where Annie Leonhart's Female Titan identity was exposed during a fierce ODM ambush beneath towering stone spires.",
    highlights: [
      "Cathedral Plaza & Bell Spire",
      "Military Police Brigade Garrison",
      "Stone Boulevards & Subterranean Tunnel Entrance",
    ],
  },
  {
    id: "mitras",
    name: "Mitras (Royal Capital)",
    wall: "Interior",
    compass: "Center",
    canonFidelity: "Canon (Architectural Reconstruction)",
    macroPos: [0, 9.5, 0],
    biome: "royal-citadel",
    elevationMeters: 68,
    wallHeightMeters: 50,
    populationEstimate: "~120,000",
    architectureNotes:
      "Monumental royal palace bastions, radial white-limestone avenues, domed assembly halls, and terraced elevated gardens inside the heart of Wall Sina.",
    summary:
      "The fortified seat of the Eldian monarchy and central administration at the exact concentric origin of all three Walls.",
    highlights: [
      "Royal Citadel & Council Basilica",
      "Central Avenue & Underground Stairways",
      "Concentric Datum Point (0 km)",
    ],
  },
  {
    id: "orvud",
    name: "Orvud District",
    wall: "Sina",
    compass: "North",
    canonFidelity: "Canon (Architectural Reconstruction)",
    macroPos: [0, 7.2, -82],
    biome: "highland-fort",
    elevationMeters: 54,
    wallHeightMeters: 50,
    populationEstimate: "~35,000",
    architectureNotes:
      "Steep northern slate gables, heavy granite wind-buttresses, rail-mounted wall artillery batteries, and misty alpine ridge backdrops.",
    summary:
      "Northern Wall Sina stronghold perched against cool highland ridges where Rod Reiss's 120-meter abnormal form was intercepted along the parapet.",
    highlights: [
      "Northern Wall Artillery Batteries",
      "Granite Buttress Bastions",
      "Highland Ridge Horizon",
    ],
  },
  {
    id: "karanes",
    name: "Karanes District",
    wall: "Rose",
    compass: "East",
    canonFidelity: "Canon (Architectural Reconstruction)",
    macroPos: [126, 4.4, 0],
    biome: "garrison-hub",
    elevationMeters: 28,
    wallHeightMeters: 50,
    populationEstimate: "~40,000",
    architectureNotes:
      "Staggered timber-and-stucco quarters, stable yards, wagon muster roads, and Survey Corps eastern expedition staging gates.",
    summary:
      "Eastern staging point of Wall Rose from which the 57th Exterior Scouting Formation departed across the eastern plains toward Shiganshina.",
    highlights: [
      "57th Expedition Departure Gate",
      "Cavalry Stables & Supply Caravans",
      "Wall Rose Eastern Watchtower",
    ],
  },
  {
    id: "utopia",
    name: "Utopia District",
    wall: "Rose",
    compass: "North",
    canonFidelity: "Reconstructed Exterior",
    macroPos: [0, 6.2, -126],
    biome: "highland-fort",
    elevationMeters: 46,
    wallHeightMeters: 50,
    populationEstimate: "~32,000",
    architectureNotes:
      "Steeply pitched alpine timber roofs built for heavy snow loads, stone granaries, and wind-sheltered courtyards.",
    summary:
      "Wall Rose's frigid northern salient overlooking mountain passes and sparse winter pastureland.",
    highlights: [
      "Alpine Timber Granaries",
      "Northern Defensive Gate",
      "Highland Valley Overlook",
    ],
  },
  {
    id: "ehrmich",
    name: "Ehrmich District",
    wall: "Sina",
    compass: "South",
    canonFidelity: "Canon (Architectural Reconstruction)",
    macroPos: [0, 5.4, 82],
    biome: "noble-spire",
    elevationMeters: 36,
    wallHeightMeters: 50,
    populationEstimate: "~52,000",
    architectureNotes:
      "Terraced limestone steps, canal aqueducts, brick-and-plaster merchant houses, and southern transit checkpoints.",
    summary:
      "Southern gateway of Wall Sina linking the inner noble wards to Trost and the southern riverlands.",
    highlights: [
      "Southern Transit Gate",
      "Aqueduct Bridges & Market Steps",
      "Wall Sina Inner Promenade",
    ],
  },
  {
    id: "survey-hq",
    name: "Former Survey Corps HQ",
    wall: "Rose",
    compass: "South",
    canonFidelity: "Canon (Architectural Reconstruction)",
    macroPos: [-36, 4.8, 108],
    biome: "ruined-keep",
    elevationMeters: 30,
    wallHeightMeters: 0,
    populationEstimate: "Special Operations Squad",
    architectureNotes:
      "Fortified stone manor-castle with crenellated corner turrets, stable yard, stone well, and oak-timbered war room.",
    summary:
      "Isolated stone castle deep within Wall Rose's forest belt where Squad Levi guarded Eren Yeager during early expedition preparations.",
    highlights: [
      "Fortified Courtyard & Stables",
      "Stone Turret Watch",
      "Oak Strategy Hall",
    ],
  },
  {
    id: "forest-giant-trees",
    name: "Forest of Giant Trees",
    wall: "Beyond",
    compass: "Outer Wilds",
    canonFidelity: "Canon",
    macroPos: [58, 3.6, 146],
    biome: "giant-forest",
    elevationMeters: 18,
    wallHeightMeters: 0,
    populationEstimate: "Uninhabited Titan Territory",
    architectureNotes:
      "80-meter ancient broad-trunk hardwood trees forming high shaded canopies ideal for high-speed ODM grappling.",
    summary:
      "Primeval colossal grove inside eastern Wall Maria terrain where Erwin Smith sprang the trap for the Female Titan.",
    highlights: [
      "80m Colossal Hardwood Canopies",
      "Crepuscular Sun Shafts",
      "Ambush Clearing & ODM Anchor Trunks",
    ],
  },
  {
    id: "utgard",
    name: "Utgard Castle Ruins",
    wall: "Rose",
    compass: "South",
    canonFidelity: "Canon (Architectural Reconstruction)",
    macroPos: [44, 5.8, 134],
    biome: "ruined-keep",
    elevationMeters: 40,
    wallHeightMeters: 0,
    populationEstimate: "Abandoned Ruin",
    architectureNotes:
      "Weathered medieval watchtower ruin, crumbling circular keep wall, fractured stone staircase, and moonlit battlements.",
    summary:
      "Ancient watchtower standing outside normal garrison patrols where Scouts survived a night siege by Zeke Yeager's nocturnal Titans.",
    highlights: [
      "Crumbling Watchtower Keep",
      "Moonlit Battlement Parapet",
      "Forest Edge Overwatch",
    ],
  },
];

export interface LoreTimelineEntry {
  year: string;
  era: string;
  title: string;
  summary: string;
  location: string;
  canonNote: string;
}

export const LORE_ENTRIES: LoreTimelineEntry[] = [
  {
    year: "743",
    era: "Foundation of the Walls",
    title: "Raising of Maria, Rose & Sina",
    summary:
      "King Karl Fritz retreated to Paradis Island and commanded tens of thousands of Colossal-class Wall Titans to lock arms, hardening their bodies into three concentric 50-meter stone rings.",
    location: "Paradis Island",
    canonNote: "Canon — Revealed by Pastor Nick and Hange Zoë after the Stohess Wall breach.",
  },
  {
    year: "845",
    era: "Fall of Wall Maria",
    title: "Breach of Shiganshina District",
    summary:
      "The 60-meter Colossal Titan peered over the southern parapet of Shiganshina and kicked open the outer gate, followed by the Armored Titan shattering the inner gate.",
    location: "Shiganshina District",
    canonNote: "Canon — Opening milestone of the 1:1m Shiganshina showcase.",
  },
  {
    year: "850",
    era: "Battle of Trost & 57th Expedition",
    title: "Humanity's First Reclaimed Ground",
    summary:
      "Trost District was sealed using a colossal limestone boulder, followed by the Survey Corps expedition into the Forest of Giant Trees and the exposure of the Female Titan in Stohess.",
    location: "Trost · Forest of Giant Trees · Stohess",
    canonNote: "Canon — Represented across Districts and Beyond the Walls modes.",
  },
  {
    year: "850–854",
    era: "Return to Shiganshina & Beyond",
    title: "The Basement & The Ocean Horizon",
    summary:
      "Following the Battle of Shiganshina, Eren Yeager's childhood cellar revealed photographs and journals proving humanity thrived beyond the sea.",
    location: "Yeager Residence · Paradis Coastline",
    canonNote: "Canon — Yeager Residence interior includes Grisha's cellar descent.",
  },
];
