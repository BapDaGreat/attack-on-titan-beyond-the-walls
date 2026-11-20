"use client";

import React, { useRef, useState } from "react";

interface TouchJoystickProps {
  onChange: (vec: { x: number; y: number }) => void;
}

/**
 * Compact mobile/touch virtual thumbstick for Free Exploration (Walk / Fly).
 * Scopes `touch-action: none` strictly to the pad element (`modern-web-guidance` accessibility rule).
 */
export const TouchJoystick: React.FC<TouchJoystickProps> = ({ onChange }) => {
  const padRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activeIdRef = useRef<number | null>(null);
  const maxR = 32;

  const updateFromClient = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnob({ x: dx, y: dy });
    onChange({ x: dx / maxR, y: dy / maxR });
  };

  return (
    <div
      ref={padRef}
      role="application"
      aria-label="Movement thumbstick"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        activeIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeIdRef.current !== e.pointerId) return;
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activeIdRef.current !== e.pointerId) return;
        activeIdRef.current = null;
        setKnob({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      }}
      onPointerCancel={() => {
        activeIdRef.current = null;
        setKnob({ x: 0, y: 0 });
        onChange({ x: 0, y: 0 });
      }}
      className="relative w-24 h-24 rounded-full border border-[#B8965A]/55 bg-[#121311]/75 flex items-center justify-center select-none pointer-events-auto"
    >
      <div
        className="w-9 h-9 rounded-full bg-[#B8965A]/85 border border-[#EAE3D2]"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      />
    </div>
  );
};
