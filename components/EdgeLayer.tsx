
"use client";

import React from "react";
import type { Edge } from "../lib/whiteboard/types";
import { EDGE_STYLE_PRESET } from "../lib/whiteboard/types";

type Props = {
  edges: Edge[];
  getNodeCenter: (id: string) => { x: number; y: number };
};

export default function EdgeLayer({ edges, getNodeCenter }: Props) {
  return (
    <svg className="absolute inset-0 pointer-events-none">
      <defs>
        {/* 主要箭頭 - drives */}
        <marker
          id="arrow_drives"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" strokeWidth="0.5" stroke="#c7252c" />
        </marker>
        
        {/* 虛線箭頭 - enables */}
        <marker
          id="arrow_enables"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" strokeWidth="0.5" stroke="#1e40af" />
        </marker>

        {/* 預設箭頭 */}
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" strokeWidth="0.5" stroke="#475569" />
        </marker>
      </defs>

      {(edges || []).map((edge) => {
        const from = getNodeCenter(edge.fromId);
        const to = getNodeCenter(edge.toId);

        const preset = (EDGE_STYLE_PRESET as any)[edge.relation as any] ?? {};
        const style = { ...preset, ...((edge as any).style ?? {}) };

        const dash = style.dash ? style.dash.join(",") : undefined;
        
        // 根據關係類型決定顏色和箭頭
        let stroke = style.stroke ?? "#334155";
        let arrowMarker = "url(#arrow)";
        
        if (edge.relation === "drives") {
          stroke = "#ef4444";
          arrowMarker = "url(#arrow_drives)";
        } else if (edge.relation === "enables") {
          stroke = "#3b82f6";
          arrowMarker = "url(#arrow_enables)";
        }
        
        const width = style.width ?? 2;

        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;

        return (
          <g key={edge.id}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray={dash}
              markerEnd={style.arrow === "end" || style.arrow === "both" ? arrowMarker : undefined}
              markerStart={style.arrow === "both" ? arrowMarker : undefined}
            />

            {edge.label && (
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#0f172a"
                className="select-none"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
        </marker>
      </defs>
    </svg>
  );
}
