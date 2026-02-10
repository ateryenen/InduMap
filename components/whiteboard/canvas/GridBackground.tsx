// components/whiteboard/canvas/GridBackground.tsx
import React from "react";
import type { Viewport } from "@/lib/whiteboard/types";

type GridBackgroundProps = {
  viewport: Viewport;
  gridSize?: number;
};

export function GridBackground({ viewport, gridSize = 40 }: GridBackgroundProps) {
  const scaledSize = gridSize * viewport.scale;

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(148,163,184,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.15) 1px, transparent 1px)",
        backgroundSize: `${scaledSize}px ${scaledSize}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
    />
  );
}
