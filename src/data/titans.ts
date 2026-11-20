export type TitanId =
  | "founding"
  | "attack"
  | "colossal"
  | "armored"
  | "female"
  | "beast"
  | "jaw"
  | "cart"
  | "warhammer"
  | "pure-7m"
  | "abnormal-12m";

export interface TitanSpec {
  id: TitanId;
  numberLabel: string;
  name: string;
  category: "Nine Titans" | "Pure Titan" | "Abnormal Titan";
  heightMeters: number;
  canonHeightNote: string;
  inheritors: string[];
  abilities: string[];
  anatomyNotes: string;
  summary: string;
  /** Visual sculpting parameters for the procedural anatomical Titan builder */
  silhouette: {
    proportionProfile: "hero-muscular" | "colossal" | "armored" | "female" | "beast" | "jaw" | "cart" | "warhammer" | "founding-doomsday" | "pure" | "abnormal";
    skinHex: string;
    muscleHex: string;
    armorHex?: string;
    furHex?: string;
    eyeGlowHex: string;
    hairHex: string;
    shoulderWidthRatio: number;
    torsoDepthRatio: number;
    armLengthRatio: number;
    legThicknessRatio: number;
    steamLevel: number;
    hasArmorPlates?: boolean;
    hasFur?: boolean;
    hasCrystalConstruct?: boolean;
    quadruped?: boolean;
    isColossalRibcage?: boolean;
  };
}

export const TITANS: TitanSpec[] = [
  {
    id: "founding",
    numberLabel: "I",
    name: "Founding Titan",
    category: "Nine Titans",
    heightMeters: 13,
    canonHeightNote: "13 m (Ymir / Frieda form) · ~240–350 m (Eren's Rumbling skeletal form in Scale Lab)",
    inheritors: ["Ymir Fritz", "Karl Fritz", "Frieda Reiss", "Grisha Yeager", "Eren Yeager"],
    abilities: [
      "Coordinate control over all Subjects of Ymir and Pure Titans",
      "Memory alteration across the Eldian bloodline",
      "Biological restructuring and release of the Wall Titans",
    ],
    anatomyNotes:
      "Regal tall frame with long flowing dark hair, luminous violet-gold eyes, and exposed rib-like spinal ridges; toggleable in the Scale Lab against Eren's towering skeletal Doomsday form.",
    summary:
      "The apex progenitor of the Nine Titans—capable of reshaping memories, commanding millions of Wall Titans, and summoning past inheritors across the Paths.",
    silhouette: {
      proportionProfile: "female",
      skinHex: "#D8C0A8",
      muscleHex: "#9B483D",
      eyeGlowHex: "#B589E6",
      hairHex: "#1C1A19",
      shoulderWidthRatio: 0.92,
      torsoDepthRatio: 0.85,
      armLengthRatio: 1.0,
      legThicknessRatio: 0.94,
      steamLevel: 0.5,
    },
  },
  {
    id: "attack",
    numberLabel: "II",
    name: "Attack Titan",
    category: "Nine Titans",
    heightMeters: 15,
    canonHeightNote: "15.0 m exact canon height",
    inheritors: ["Eren Kruger", "Grisha Yeager", "Eren Yeager"],
    abilities: [
      "Receives memories from future inheritors across time",
      "Explosive close-quarters strength and rapid regeneration",
      "Hardening mastery (post-Serum crystallization)",
    ],
    anatomyNotes:
      "Defined mesomorphic musculature with deeply incised abdominal obliques, flared latissimus ribs, jagged exposed cheek-less multi-row teeth, pointed elfin ears, and tousled dark locks.",
    summary:
      "Relentlessly driven toward freedom in every era, the Attack Titan pairs ferocious athletic speed with the unique ability to glimpse memories sent backward from future successors.",
    silhouette: {
      proportionProfile: "hero-muscular",
      skinHex: "#D4AE92",
      muscleHex: "#8D342A",
      eyeGlowHex: "#5AD67C",
      hairHex: "#191716",
      shoulderWidthRatio: 1.12,
      torsoDepthRatio: 0.96,
      armLengthRatio: 1.04,
      legThicknessRatio: 1.04,
      steamLevel: 0.45,
    },
  },
  {
    id: "colossal",
    numberLabel: "III",
    name: "Colossal Titan",
    category: "Nine Titans",
    heightMeters: 60,
    canonHeightNote: "60.0 m — towers 10 m above the 50 m Walls",
    inheritors: ["Bertholdt Hoover", "Armin Arlert"],
    abilities: [
      "Cataclysmic nuclear-scale transformation blast",
      "60 m physical mass dominating fortified walls",
      "Scalding high-pressure steam defense venting directly from muscle tissue",
    ],
    anatomyNotes:
      "Entirely devoid of outer epidermis: striated crimson muscle bundles sheath thick load-bearing leg pillars, small muscular upper arms, an exposed jaw skull, and glowing rib vents emitting relentless white steam.",
    summary:
      "Known as the God of Destruction, its 60-meter silhouette dwarfs Shiganshina's 50-meter parapet and radiates superheated steam capable of repelling ODM hooks.",
    silhouette: {
      proportionProfile: "colossal",
      skinHex: "#B5483C",
      muscleHex: "#8C2C24",
      eyeGlowHex: "#F4D084",
      hairHex: "#7A2821",
      shoulderWidthRatio: 1.06,
      torsoDepthRatio: 1.08,
      armLengthRatio: 0.94,
      legThicknessRatio: 1.10,
      steamLevel: 1.0,
    },
  },
  {
    id: "armored",
    numberLabel: "IV",
    name: "Armored Titan",
    category: "Nine Titans",
    heightMeters: 15,
    canonHeightNote: "15.0 m exact canon height",
    inheritors: ["Reiner Braun"],
    abilities: [
      "Full-body interlocking hardened dermal armor plates",
      "Wall-breaching battering-ram sprint momentum",
      "Consciousness transfer through Titan nervous system",
    ],
    anatomyNotes:
      "Broad-shouldered frame encased in overlapping bone-ivory keratinized plates across chest, forearms, shins, and segmented faceplate, revealing dark crimson muscle seams at every joint.",
    summary:
      "A walking siege engine whose layered armor shrugs off standard Garrison cannon fire while leaving articulated flex joints around knees and elbows.",
    silhouette: {
      proportionProfile: "armored",
      skinHex: "#A84035",
      muscleHex: "#8B2D25",
      armorHex: "#DFD5C0",
      eyeGlowHex: "#F2C14E",
      hairHex: "#D4C6A8",
      shoulderWidthRatio: 1.18,
      torsoDepthRatio: 1.08,
      armLengthRatio: 1.0,
      legThicknessRatio: 1.06,
      steamLevel: 0.35,
      hasArmorPlates: true,
    },
  },
  {
    id: "female",
    numberLabel: "V",
    name: "Female Titan",
    category: "Nine Titans",
    heightMeters: 14,
    canonHeightNote: "14.0 m exact canon height",
    inheritors: ["Annie Leonhart"],
    abilities: [
      "Selective localized skin crystallization (knuckles, shin, nape)",
      "All-purpose endurance and martial arts combat agility",
      "Calling scream attracting nearby Pure Titans",
    ],
    anatomyNotes:
      "Lean, athletic silhouette combining exposed crimson myofibrils across torso and cheeks with pale epidermis, swept blonde hair, and translucent ice-blue hardened strike points.",
    summary:
      "Highly versatile and deadly in close-range hand-to-hand combat, combining precision selective hardening with long-distance stamina.",
    silhouette: {
      proportionProfile: "female",
      skinHex: "#DFC0AA",
      muscleHex: "#8F2F28",
      armorHex: "#A8D5EE",
      eyeGlowHex: "#7EC4F2",
      hairHex: "#D9C382",
      shoulderWidthRatio: 0.88,
      torsoDepthRatio: 0.84,
      armLengthRatio: 1.0,
      legThicknessRatio: 0.96,
      steamLevel: 0.38,
      hasCrystalConstruct: true,
    },
  },
  {
    id: "beast",
    numberLabel: "VI",
    name: "Beast Titan",
    category: "Nine Titans",
    heightMeters: 17,
    canonHeightNote: "17.0 m exact canon height (Zeke Yeager)",
    inheritors: ["Tom Ksaver", "Zeke Yeager"],
    abilities: [
      "Hyper-accurate supersonic boulder bombardment",
      "Spinal-fluid roar transforming Eldians into nocturnal Pure Titans",
      "Long-reach apelike arms built for catapult leverage",
    ],
    anatomyNotes:
      "Broad conical ribcage and rounded belly covered in coarse dark-umber hair tufts, towering 17-meter posture, elongated forearm reach below knee level, and pointed ears.",
    summary:
      "Towering two meters above standard 15m class Titans, Zeke Yeager's Beast Titan turns shattered rubble into supersonic artillery barrages across Shiganshina's fields.",
    silhouette: {
      proportionProfile: "beast",
      skinHex: "#C7A38A",
      muscleHex: "#7A3A2E",
      furHex: "#3B2B22",
      eyeGlowHex: "#C83E32",
      hairHex: "#36271F",
      shoulderWidthRatio: 1.32,
      torsoDepthRatio: 1.32,
      armLengthRatio: 1.36,
      legThicknessRatio: 1.12,
      steamLevel: 0.3,
      hasFur: true,
    },
  },
  {
    id: "jaw",
    numberLabel: "VII",
    name: "Jaw Titan",
    category: "Nine Titans",
    heightMeters: 5,
    canonHeightNote: "5.0 m compact predator height",
    inheritors: ["Marcel Galliard", "Ymir", "Porco Galliard", "Falco Grice"],
    abilities: [
      "Unmatched agility and vertical surface traversal",
      "Hardened bone-plated mandible capable of crushing Titan crystal",
      "Razor-hardened claws for ripping steel and armor",
    ],
    anatomyNotes:
      "Low crouched quadrupedal-ready stance with oversized hardened cranial mask, jagged interlocking bone teeth, dense mane framing the nape, and elongated clawed forearms.",
    summary:
      "The smallest yet fastest of the Nine Titans, turning dense forest canopies and city facades into lethal vertical hunting grounds.",
    silhouette: {
      proportionProfile: "jaw",
      skinHex: "#C5A089",
      muscleHex: "#7C2D24",
      armorHex: "#DDD4C1",
      eyeGlowHex: "#E8B657",
      hairHex: "#2E251F",
      shoulderWidthRatio: 1.18,
      torsoDepthRatio: 0.94,
      armLengthRatio: 1.24,
      legThicknessRatio: 0.95,
      steamLevel: 0.25,
      hasArmorPlates: true,
    },
  },
  {
    id: "cart",
    numberLabel: "VIII",
    name: "Cart Titan",
    category: "Nine Titans",
    heightMeters: 4,
    canonHeightNote: "4.0 m quadruped length ~6.5 m",
    inheritors: ["Pieck Finger"],
    abilities: [
      "Months-long continuous Titan transformation endurance",
      "Rapid repeated transformations without exhaustion",
      "Heavy modular cargo and armored machine-gun turret carrier",
    ],
    anatomyNotes:
      "Elongated quadrupedal spine, extended flat-topped muzzle, heavy forelimb weight distribution, and bolted timber-and-steel Panzer gear harness across the back.",
    summary:
      "Engineered for prolonged endurance and reconnaissance rather than brute strength, capable of staying transformed for months while hauling artillery or rescue crews.",
    silhouette: {
      proportionProfile: "cart",
      skinHex: "#CFAF98",
      muscleHex: "#874337",
      armorHex: "#4D544C",
      eyeGlowHex: "#D4BE98",
      hairHex: "#1D1B1A",
      shoulderWidthRatio: 0.95,
      torsoDepthRatio: 1.0,
      armLengthRatio: 1.15,
      legThicknessRatio: 0.95,
      steamLevel: 0.15,
      quadruped: true,
    },
  },
  {
    id: "warhammer",
    numberLabel: "IX",
    name: "War Hammer Titan",
    category: "Nine Titans",
    heightMeters: 15,
    canonHeightNote: "15.0 m exact canon height",
    inheritors: ["Lara Tybur", "Eren Yeager"],
    abilities: [
      "Remote-tethered body operation from crystal cocoon",
      "Instant structural hardening into hammers, spikes, and crossbows",
      "Massive subterranean spike eruption attacks",
    ],
    anatomyNotes:
      "Clad in seamless chalk-white hardened skin and an executioner-style lattice face veil, wielding a two-meter crystalline war hammer forged directly from hardened tissue.",
    summary:
      "An aristocratic duelist whose entire epidermis forms pale armored plating and manifests massive melee and ranged weapons out of solid hardened crystal.",
    silhouette: {
      proportionProfile: "warhammer",
      skinHex: "#E3DDD2",
      muscleHex: "#C9BFB0",
      armorHex: "#F0ECE3",
      eyeGlowHex: "#E8ECEF",
      hairHex: "#E3DDD2",
      shoulderWidthRatio: 1.04,
      torsoDepthRatio: 0.94,
      armLengthRatio: 1.04,
      legThicknessRatio: 1.0,
      steamLevel: 0.35,
      hasCrystalConstruct: true,
    },
  },
  {
    id: "pure-7m",
    numberLabel: "P-7",
    name: "7m Pure Titan",
    category: "Pure Titan",
    heightMeters: 7,
    canonHeightNote: "7.0 m mid-class mindless Titan",
    inheritors: ["Subject of Ymir (Mindless)"],
    abilities: [
      "Relentless human-seeking instinct",
      "Solar-powered activity (dormant in deep darkness)",
      "Rapid regeneration unless nape (1m x 10cm) is severed",
    ],
    anatomyNotes:
      "Disproportionately broad jaw, sunken wide eyes, slightly forward-slouched trunk, and coarse pale skin lacking battle-hardened armor or coordination.",
    summary:
      "The relentless baseline horror outside the Walls—mindless Subjects of Ymir wandering Paradis terrain in perpetual search of human victims.",
    silhouette: {
      proportionProfile: "pure",
      skinHex: "#D5B49D",
      muscleHex: "#965146",
      eyeGlowHex: "#EFE6D5",
      hairHex: "#4E3A2B",
      shoulderWidthRatio: 1.0,
      torsoDepthRatio: 1.08,
      armLengthRatio: 1.02,
      legThicknessRatio: 1.02,
      steamLevel: 0.2,
    },
  },
  {
    id: "abnormal-12m",
    numberLabel: "A-12",
    name: "12m Abnormal Titan",
    category: "Abnormal Titan",
    heightMeters: 12,
    canonHeightNote: "12.0 m erratic gait variant",
    inheritors: ["Subject of Ymir (Abnormal behavior)"],
    abilities: [
      "Unpredictable bounding sprints ignoring isolated targets",
      "Deep-leap ambush movement across open plains",
    ],
    anatomyNotes:
      "Asymmetric hunched shoulder posture, wide fixed grin, elongated tendons, and uneven bounding stance making trajectory prediction perilous for Scouts.",
    summary:
      "Deviating violently from standard Pure Titan behavior, Abnormals bypass solitary soldiers to charge straight toward dense refugee columns or supply convoys.",
    silhouette: {
      proportionProfile: "abnormal",
      skinHex: "#CCA58D",
      muscleHex: "#8C4238",
      eyeGlowHex: "#F5D9AE",
      hairHex: "#5C4938",
      shoulderWidthRatio: 1.12,
      torsoDepthRatio: 1.16,
      armLengthRatio: 1.14,
      legThicknessRatio: 0.96,
      steamLevel: 0.28,
    },
  },
];
