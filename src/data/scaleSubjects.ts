import type { TitanId } from "./titans";

export type ScaleSubjectKind =
  | "human"
  | "eren-human"
  | "horse"
  | "building"
  | "titan"
  | "wall"
  | "founding-doomsday";

export interface ScaleSubjectSpec {
  id: string;
  label: string;
  category: "Human & Cavalry" | "Architecture" | "Pure Titans" | "Nine Titans" | "Monumental";
  heightMeters: number;
  widthHintMeters: number;
  kind: ScaleSubjectKind;
  titanId?: TitanId;
  note: string;
}

export const SCALE_SUBJECTS: ScaleSubjectSpec[] = [
  {
    id: "average-human",
    label: "Average Human",
    category: "Human & Cavalry",
    heightMeters: 1.70,
    widthHintMeters: 0.65,
    kind: "human",
    note: "Baseline 1.70 m human scale reference (World Datum 1 unit = 1.0 m).",
  },
  {
    id: "eren-human",
    label: "Eren Yeager (Scout)",
    category: "Human & Cavalry",
    heightMeters: 1.70,
    widthHintMeters: 0.70,
    kind: "eren-human",
    note: "1.70 m in 850 (1.83 m by Year 854) in full Survey Corps ODM gear.",
  },
  {
    id: "survey-horse",
    label: "Survey Warhorse",
    category: "Human & Cavalry",
    heightMeters: 2.15,
    widthHintMeters: 2.50,
    kind: "horse",
    note: "~1.60 m at the withers, 2.15 m crest height; bred for endurance outside the Walls.",
  },
  {
    id: "cart-titan",
    label: "Cart Titan",
    category: "Nine Titans",
    heightMeters: 4.0,
    widthHintMeters: 6.2,
    kind: "titan",
    titanId: "cart",
    note: "4.0 m quadrupedal height, ~6.2 m length; endures transformed state for months.",
  },
  {
    id: "pure-3m",
    label: "3m Pure Titan",
    category: "Pure Titans",
    heightMeters: 3.0,
    widthHintMeters: 1.25,
    kind: "titan",
    titanId: "pure-7m",
    note: "Smallest common Titan class; still nearly double adult human stature.",
  },
  {
    id: "pure-5m",
    label: "5m Pure Titan",
    category: "Pure Titans",
    heightMeters: 5.0,
    widthHintMeters: 1.9,
    kind: "titan",
    titanId: "pure-7m",
    note: "Tall enough to peer directly into second-story timber windows.",
  },
  {
    id: "jaw-titan",
    label: "Jaw Titan",
    category: "Nine Titans",
    heightMeters: 5.0,
    widthHintMeters: 2.3,
    kind: "titan",
    titanId: "jaw",
    note: "5.0 m compact predatory frame with bone-hardened jaws and claws.",
  },
  {
    id: "pure-7m",
    label: "7m Pure Titan",
    category: "Pure Titans",
    heightMeters: 7.0,
    widthHintMeters: 2.6,
    kind: "titan",
    titanId: "pure-7m",
    note: "Standard mid-tier Pure Titan; rivals two-story cottage rooftops.",
  },
  {
    id: "pure-10m",
    label: "10m Pure Titan",
    category: "Pure Titans",
    heightMeters: 10.0,
    widthHintMeters: 3.5,
    kind: "titan",
    titanId: "abnormal-12m",
    note: "Heavy mid-large Titan; commands significant vertical reach on open roads.",
  },
  {
    id: "shiganshina-house",
    label: "Shiganshina Townhouse",
    category: "Architecture",
    heightMeters: 11.5,
    widthHintMeters: 7.2,
    kind: "building",
    note: "Typical 3-story half-timbered house with gable ridge at ~11.5 m.",
  },
  {
    id: "female-titan",
    label: "Female Titan",
    category: "Nine Titans",
    heightMeters: 14.0,
    widthHintMeters: 4.5,
    kind: "titan",
    titanId: "female",
    note: "14.0 m athletic martial-arts frame with localized crystalline hardening.",
  },
  {
    id: "pure-15m",
    label: "15m Pure Titan",
    category: "Pure Titans",
    heightMeters: 15.0,
    widthHintMeters: 5.0,
    kind: "titan",
    titanId: "abnormal-12m",
    note: "Largest common Pure Titan class encountered in expedition zones.",
  },
  {
    id: "attack-titan",
    label: "Attack Titan",
    category: "Nine Titans",
    heightMeters: 15.0,
    widthHintMeters: 5.2,
    kind: "titan",
    titanId: "attack",
    note: "15.0 m muscled brawler — towers over 3-story Shiganshina rooftops.",
  },
  {
    id: "armored-titan",
    label: "Armored Titan",
    category: "Nine Titans",
    heightMeters: 15.0,
    widthHintMeters: 5.8,
    kind: "titan",
    titanId: "armored",
    note: "15.0 m broad-shouldered siege juggernaut that shattered Wall Maria's inner gate.",
  },
  {
    id: "warhammer-titan",
    label: "War Hammer Titan",
    category: "Nine Titans",
    heightMeters: 15.0,
    widthHintMeters: 5.0,
    kind: "titan",
    titanId: "warhammer",
    note: "15.0 m pale hardened frame wielding forged crystalline weaponry.",
  },
  {
    id: "beast-titan",
    label: "Beast Titan",
    category: "Nine Titans",
    heightMeters: 17.0,
    widthHintMeters: 6.8,
    kind: "titan",
    titanId: "beast",
    note: "17.0 m towering ape-like stature with elongated throwing reach.",
  },
  {
    id: "wall-maria",
    label: "Wall Maria Section",
    category: "Monumental",
    heightMeters: 50.0,
    widthHintMeters: 14.0,
    kind: "wall",
    note: "50.0 m monumental stone wall (~40 m visible crown + 10 m deep subterranean foundation in lore).",
  },
  {
    id: "colossal-titan",
    label: "Colossal Titan",
    category: "Nine Titans",
    heightMeters: 60.0,
    widthHintMeters: 19.0,
    kind: "titan",
    titanId: "colossal",
    note: "60.0 m towering 10 meters higher than Wall Maria's battlements.",
  },
  {
    id: "founding-eren",
    label: "Eren's Founding Titan",
    category: "Monumental",
    heightMeters: 240.0,
    widthHintMeters: 78.0,
    kind: "founding-doomsday",
    note: "Reconstructed ~240 m skeletal pinnacle height (canon range estimated 240–350 m tall, >500 m long), nearly 5x the height of the Walls.",
  },
];
