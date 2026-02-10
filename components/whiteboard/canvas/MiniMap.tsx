// components/whiteboard/canvas/MiniMap.tsx

import React from "react";
import type { Node, Viewport } from "../../../lib/whiteboard/types";

interface MiniMapProps {
  nodes: Node[];
  viewport: Viewport;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function MiniMap({ nodes, viewport, containerRef }: MiniMapProps) {
  if (!containerRef.current || !nodes || nodes.length === 0) return null;

  const rect = containerRef.current.getBoundingClientRect();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });

  if (minX === Infinity) return null;

  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;

  const maxMiniW = 220;
  const maxMiniH = 140;

  const scaleX = maxMiniW / worldW;
  const scaleY = maxMiniH / worldH;
  const miniScale = Math.min(scaleX, scaleY);

  const miniW = worldW * miniScale;
  const miniH = worldH * miniScale;

  const viewWorldX = -viewport.x / viewport.scale;
  const viewWorldY = -viewport.y / viewport.scale;
  const viewWorldW = rect.width / viewport.scale;
  const viewWorldH = rect.height / viewport.scale;

  const viewX = (viewWorldX - minX) * miniScale;
  const viewY = (viewWorldY - minY) * miniScale;
  const viewW = viewWorldW * miniScale;
  const viewH = viewWorldH * miniScale;

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md border border-slate-400 bg-white/90 p-1 shadow">
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>Mini-map</span>
        <span>{Math.round(viewport.scale * 100)}%</span>
      </div>
      <div
        className="relative overflow-hidden rounded bg-slate-100"
        style={{ width: miniW, height: miniH }}
      >
        {nodes.map((n) => {
          const nx = (n.x - minX) * miniScale;
          const ny = (n.y - minY) * miniScale;
          const nw = n.width * miniScale;
          const nh = n.height * miniScale;
          return (
            <div
              key={n.id}
              className="absolute rounded-sm border border-slate-400 bg-slate-300/40"
              style={{
                left: nx,
                top: ny,
                width: Math.max(nw, 2),
                height: Math.max(nh, 2),
              }}
            />
          );
        })}

        <div
          className="absolute border border-blue-500 bg-blue-300/10"
          style={{
            left: viewX,
            top: viewY,
            width: viewW,
            height: viewH,
          }}
        />
      </div>
    </div>
  );
}
