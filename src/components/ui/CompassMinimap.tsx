"use client";

import React from "react";
import { DISTRICTS, DistrictSpec, ExplorationMode } from "@/data/world";

interface CompassMinimapProps {
  mode: ExplorationMode;
  selectedDistrict: DistrictSpec;
  onSelectDistrict: (d: DistrictSpec) => void;
}

/**
 * Compact Concentric Paradis Tactical Survey Compass & Minimap.
 * Renders the three Wall rings (Maria, Rose, Sina) and clickable district coordinates.
 */
export const CompassMinimap: React.FC<CompassMinimapProps> = ({
  mode,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const scale = 0.25; // Maps macro radius 165 -> 41.25px inside 120x120 SVG

  return (
    <div
      className="pointer-events-auto select-none bg-[#121311]/90 border border-[#B8965A]/35 p-2.5 w-[156px]"
      aria-label="Paradis Tactical Map"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#B8965A]">
          Survey Grid
        </span>
        <span className="text-[10px] font-mono text-[#A49D8E] uppercase">{mode}</span>
      </div>

      <svg
        viewBox="-56 -56 112 112"
        className="w-full h-auto block"
        role="img"
        aria-label="Concentric map of Wall Maria, Wall Rose, and Wall Sina"
      >
        {/* Subtle cardinal axis crosshairs */}
        <line x1="-52" y1="0" x2="52" y2="0" stroke="#EAE3D2" strokeOpacity="0.12" strokeWidth="0.6" />
        <line x1="0" y1="-52" x2="0" y2="52" stroke="#EAE3D2" strokeOpacity="0.12" strokeWidth="0.6" />

        {/* Wall Maria (r=41.25), Wall Rose (r=31.5), Wall Sina (r=20.5) */}
        <circle cx="0" cy="0" r={165 * scale} fill="none" stroke="#9E2B25" strokeOpacity="0.65" strokeWidth="1.2" />
        <circle cx="0" cy="0" r={126 * scale} fill="none" stroke="#B8965A" strokeOpacity="0.7" strokeWidth="1.1" />
        <circle cx="0" cy="0" r={82 * scale} fill="none" stroke="#3E5641" strokeOpacity="0.85" strokeWidth="1.1" />

        {DISTRICTS.map((d) => {
          const x = d.macroPos[0] * scale;
          const y = d.macroPos[2] * scale;
          const active = d.id === selectedDistrict.id;
          return (
            <g
              key={d.id}
              onClick={() => onSelectDistrict(d)}
              className="cursor-pointer"
            >
              <circle
                cx={x}
                cy={y}
                r={active ? 3.2 : 2.1}
                fill={active ? "#EAE3D2" : "#B8965A"}
                stroke="#121311"
                strokeWidth="0.7"
              />
              <title>{d.name}</title>
            </g>
          );
        })}

        <text x="0" y="-48" textAnchor="middle" fill="#A49D8E" fontSize="5.5" fontFamily="monospace">
          N
        </text>
      </svg>

      <div className="mt-1.5 pt-1.5 border-t border-[#EAE3D2]/12 flex items-center justify-between text-[10px] font-mono text-[#EAE3D2]/85">
        <span className="truncate">{selectedDistrict.name}</span>
      </div>
    </div>
  );
};
