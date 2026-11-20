export type CharacterId =
  | "eren"
  | "mikasa"
  | "armin"
  | "levi"
  | "erwin"
  | "hange"
  | "reiner"
  | "bertholdt"
  | "annie"
  | "zeke"
  | "historia";

export interface CharacterSpec {
  id: CharacterId;
  name: string;
  title: string;
  regiment: "Survey Corps" | "Military Police" | "Marley Warrior Unit" | "Royal Crown";
  heightMeters: number;
  status: string;
  titanLink?: string;
  signatureGear: string;
  bio: string;
  visual: {
    hairHex: string;
    hairStyle: "eren-shag" | "mikasa-bob" | "armin-pageboy" | "levi-undercut" | "erwin-part" | "hange-ponytail" | "reiner-crew" | "bertholdt-short" | "annie-bun" | "zeke-beard" | "historia-long";
    eyeHex: string;
    skinHex: string;
    jacketHex: string;
    cloakHex: string | null;
    scarfHex?: string;
    cravat?: boolean;
    goggles?: boolean;
    glasses?: boolean;
    missingRightArm?: boolean;
    hasOdm: boolean;
    buildScale: number; // width/muscle multiplier relative to baseline
    pose: "salute" | "ready-blades" | "command" | "calm-stand" | "warrior-guard";
  };
}

export const CHARACTERS: CharacterSpec[] = [
  {
    id: "eren",
    name: "Eren Yeager",
    title: "104th Cadet · Attack & Founding Titan Inheritor",
    regiment: "Survey Corps",
    heightMeters: 1.70,
    status: "Shiganshina Native · Special Operations Squad",
    titanLink: "Attack Titan (15 m) / Founding Titan",
    signatureGear: "Survey Corps cropped leather jacket, twin ODM scabbards, basement key pendant",
    bio: "Born inside Shiganshina District behind Wall Maria, Eren witnessed the Colossal Titan breach his hometown in 845 and swore to eradicate every Titan beyond the Walls.",
    visual: {
      hairHex: "#241D1A",
      hairStyle: "eren-shag",
      eyeHex: "#3D8C6E",
      skinHex: "#E2BE9F",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      hasOdm: true,
      buildScale: 1.0,
      pose: "ready-blades",
    },
  },
  {
    id: "mikasa",
    name: "Mikasa Ackerman",
    title: "Elite Scout · 104th Class Valedictorian",
    regiment: "Survey Corps",
    heightMeters: 1.76,
    status: "Special Operations Squad · Top Ranked",
    signatureGear: "Crimson wool scarf, dual ultra-hard steel blades, Survey Corps cloak",
    bio: "Adopted into the Yeager household in Shiganshina, Mikasa awakened Ackerman combat instinct and unmatched vertical maneuvering precision on the battlefield.",
    visual: {
      hairHex: "#15161A",
      hairStyle: "mikasa-bob",
      eyeHex: "#2E343D",
      skinHex: "#E8CAB2",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      scarfHex: "#962422",
      hasOdm: true,
      buildScale: 0.94,
      pose: "ready-blades",
    },
  },
  {
    id: "armin",
    name: "Armin Arlert",
    title: "Tactician & 15th Commander of the Survey Corps",
    regiment: "Survey Corps",
    heightMeters: 1.63,
    status: "Shiganshina Native · Strategic Officer",
    titanLink: "Colossal Titan (60 m, post-850)",
    signatureGear: "Survey Corps cloak, reconnaissance flare pouch, ODM harness",
    bio: "Driven by forbidden books about salty oceans and plains of ice, Armin's strategic deductions saved humanity at Trost, the 57th Expedition, and Shiganshina.",
    visual: {
      hairHex: "#D8BA6A",
      hairStyle: "armin-pageboy",
      eyeHex: "#4B86B4",
      skinHex: "#ECCEB6",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      hasOdm: true,
      buildScale: 0.90,
      pose: "calm-stand",
    },
  },
  {
    id: "levi",
    name: "Levi Ackerman",
    title: "Captain · Humanity's Strongest Soldier",
    regiment: "Survey Corps",
    heightMeters: 1.60,
    status: "Captain, Special Operations Squad",
    signatureGear: "White ruffled cravat, reversed-grip steel blades, Survey Corps emerald cloak",
    bio: "Recruited from Mitras's Underground by Erwin Smith, Captain Levi fights with signature reverse-blade grips and a tornado-spin technique feared even by Titan Shifters.",
    visual: {
      hairHex: "#18181A",
      hairStyle: "levi-undercut",
      eyeHex: "#4E5B66",
      skinHex: "#E7CBB7",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      cravat: true,
      hasOdm: true,
      buildScale: 0.95,
      pose: "ready-blades",
    },
  },
  {
    id: "erwin",
    name: "Erwin Smith",
    title: "13th Commander of the Survey Corps",
    regiment: "Survey Corps",
    heightMeters: 1.88,
    status: "Commander · Architect of Long-Range Scouting",
    signatureGear: "Emerald bolo tie, long Survey Corps cloak, cavalry sabre & ODM",
    bio: "Mastermind behind the Long-Range Scouting Formation and the coup inside Wall Sina, Erwin inspired soldiers to advance even when sacrificing their own lives.",
    visual: {
      hairHex: "#C7A75E",
      hairStyle: "erwin-part",
      eyeHex: "#4B7CA3",
      skinHex: "#E3BFA4",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      cravat: true,
      hasOdm: true,
      buildScale: 1.09,
      pose: "command",
    },
  },
  {
    id: "hange",
    name: "Hange Zoë",
    title: "Squad Leader & 14th Commander · Titan Researcher",
    regiment: "Survey Corps",
    heightMeters: 1.70,
    status: "Chief Titan Research Officer",
    signatureGear: "Leather strap goggles, field notebook, ODM harness & thunder spear mounts",
    bio: "Obsessed with uncovering the physical truth of Titan anatomy, Hange discovered that Wall Sina itself was constructed around living 50-meter Titans.",
    visual: {
      hairHex: "#4B3526",
      hairStyle: "hange-ponytail",
      eyeHex: "#5B4433",
      skinHex: "#E3C0A5",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      goggles: true,
      hasOdm: true,
      buildScale: 0.96,
      pose: "salute",
    },
  },
  {
    id: "reiner",
    name: "Reiner Braun",
    title: "Marley Warrior · 104th 2nd Rank",
    regiment: "Marley Warrior Unit",
    heightMeters: 1.88,
    status: "Infiltrator · Armored Titan Holder",
    titanLink: "Armored Titan (15 m)",
    signatureGear: "Scout regiment harness, heavy broadsword sheath & flare pistol",
    bio: "Torn between his duty as Marley's Armored Titan and the camaraderie forged during five years behind Wall Rose with the 104th Cadet Corps.",
    visual: {
      hairHex: "#CBB47A",
      hairStyle: "reiner-crew",
      eyeHex: "#8D7953",
      skinHex: "#DFB898",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      hasOdm: true,
      buildScale: 1.16,
      pose: "warrior-guard",
    },
  },
  {
    id: "bertholdt",
    name: "Bertholdt Hoover",
    title: "Marley Warrior · Colossal Titan Holder",
    regiment: "Marley Warrior Unit",
    heightMeters: 1.92,
    status: "104th 3rd Rank · Shiganshina Gate Breaker",
    titanLink: "Colossal Titan (60 m)",
    signatureGear: "Regiment ODM harness & long-cloak field pack",
    bio: "Quiet and towering among human cadets at 1.92 m, Bertholdt struck the opening blow of the entire war by shattering Shiganshina's outer gate in Year 845.",
    visual: {
      hairHex: "#231E1B",
      hairStyle: "bertholdt-short",
      eyeHex: "#516154",
      skinHex: "#DFBC9E",
      jacketHex: "#6B4F37",
      cloakHex: "#2D4735",
      hasOdm: true,
      buildScale: 1.04,
      pose: "calm-stand",
    },
  },
  {
    id: "annie",
    name: "Annie Leonhart",
    title: "Military Police Brigade · Female Titan Holder",
    regiment: "Military Police",
    heightMeters: 1.53,
    status: "104th 4th Rank · Stohess Station",
    titanLink: "Female Titan (14 m)",
    signatureGear: "White-hooded Military Police jacket, concealment ring blade, ODM harness",
    bio: "Trained in austere close-quarters striking arts since childhood, Annie operated inside Stohess District's Military Police until ambushed by the Survey Corps.",
    visual: {
      hairHex: "#DFCD8D",
      hairStyle: "annie-bun",
      eyeHex: "#6F94B8",
      skinHex: "#E9D0BC",
      jacketHex: "#664C35",
      cloakHex: null,
      hasOdm: true,
      buildScale: 0.88,
      pose: "warrior-guard",
    },
  },
  {
    id: "zeke",
    name: "Zeke Yeager",
    title: "War Chief of Marley · Beast Titan Holder",
    regiment: "Marley Warrior Unit",
    heightMeters: 1.83,
    status: "Marleyan War Chief · Royal Bloodline",
    titanLink: "Beast Titan (17 m)",
    signatureGear: "Round wire-rimmed spectacles, officer coat & leather boots",
    bio: "Eren's older half-brother carrying royal Fritz blood—granting his Beast Titan form the terrifying ability to convert Subjects of Ymir with his scream.",
    visual: {
      hairHex: "#C9B37A",
      hairStyle: "zeke-beard",
      eyeHex: "#557188",
      skinHex: "#E1BD9E",
      jacketHex: "#4E4D46",
      cloakHex: null,
      glasses: true,
      hasOdm: false,
      buildScale: 1.08,
      pose: "command",
    },
  },
  {
    id: "historia",
    name: "Historia Reiss",
    title: "Queen of the Walls · Former 104th Scout",
    regiment: "Royal Crown",
    heightMeters: 1.45,
    status: "Sovereign Ruler Inside Wall Sina (Mitras)",
    signatureGear: "Survey Corps cloak & royal Mitras regalia sash",
    bio: "After confronting her father Rod Reiss beneath Orvud and Mitras's crystal chapel, Historia ascended as Queen inside Wall Sina to champion orphanages and reform.",
    visual: {
      hairHex: "#E3CC88",
      hairStyle: "historia-long",
      eyeHex: "#4E8DC4",
      skinHex: "#EDD2BF",
      jacketHex: "#5C4532",
      cloakHex: "#304837",
      hasOdm: true,
      buildScale: 0.84,
      pose: "salute",
    },
  },
];
