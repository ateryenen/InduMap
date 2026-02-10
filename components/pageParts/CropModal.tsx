"use client";

import React from "react";
import type { Node } from "../../lib/whiteboard/types";
import type { ImageCrop } from "../../lib/whiteboard/types";

export default function CropModal(props: {
  cropTargetId: string | null;
  nodes: Node[];
  draftCrop: ImageCrop | null;
  setDraftCrop: (c: ImageCrop | null) => void;
  cropImgBoxRef: React.RefObject<HTMLDivElement | null>;
  closeCropModal: () => void;
  applyDraftCrop: () => void;
}) {
  const {
    cropTargetId,
    nodes,
    draftCrop,
    setDraftCrop,
    cropImgBoxRef,
    closeCropModal,
    applyDraftCrop,
  } = props;

  const cropDragRef = React.useRef<
    | null
    | {
        mode: "create" | "move";
        startX: number;
        startY: number;
        offsetX?: number;
        offsetY?: number;
      }
  >(null);

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const clampCrop = (c: ImageCrop): ImageCrop => {
    const x = clamp01(c.x);
    const y = clamp01(c.y);
    const w = clamp01(c.w);
    const h = clamp01(c.h);
    const minSize = 0.02;
    const ww = Math.max(minSize, Math.min(w, 1 - x));
    const hh = Math.max(minSize, Math.min(h, 1 - y));
    return { x, y, w: ww, h: hh };
  };

  const getCropBoxMetrics = () => {
    const el = cropImgBoxRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  const pointToNorm = (clientX: number, clientY: number) => {
    const m = getCropBoxMetrics();
    if (!m) return null;
    const nx = (clientX - m.left) / m.width;
    const ny = (clientY - m.top) / m.height;
    return { x: clamp01(nx), y: clamp01(ny) };
  };

  const isPointInCrop = (p: { x: number; y: number }, c: ImageCrop) => {
    return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h;
  };

  if (!cropTargetId) return null;

  const imgUrl = (nodes || []).find((n) => n.id === cropTargetId)?.imageUrl || "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">圖片裁切 Crop</div>
          <button className="rounded border border-slate-300 bg-white px-2 py-1 text-xs" onClick={closeCropModal}>✕</button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-200 p-2">
            <div className="mb-2 text-[11px] text-slate-500">拖曳建立裁切框；拖曳框可移動</div>
            <div
              ref={cropImgBoxRef as any}
              className="relative aspect-video w-full overflow-hidden rounded bg-slate-100"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const p = pointToNorm(e.clientX, e.clientY);
                if (!p) return;

                if (draftCrop && isPointInCrop(p, draftCrop)) {
                  cropDragRef.current = {
                    mode: "move",
                    startX: p.x,
                    startY: p.y,
                    offsetX: p.x - draftCrop.x,
                    offsetY: p.y - draftCrop.y,
                  };
                } else {
                  cropDragRef.current = { mode: "create", startX: p.x, startY: p.y };
                  setDraftCrop({ x: p.x, y: p.y, w: 0.001, h: 0.001 });
                }
              }}
              onMouseMove={(e) => {
                const drag = cropDragRef.current;
                if (!drag) return;
                const p = pointToNorm(e.clientX, e.clientY);
                if (!p) return;

                if (drag.mode === "create") {
                  const x1 = drag.startX;
                  const y1 = drag.startY;
                  const x2 = p.x;
                  const y2 = p.y;
                  const x = Math.min(x1, x2);
                  const y = Math.min(y1, y2);
                  const w = Math.abs(x2 - x1);
                  const h = Math.abs(y2 - y1);
                  setDraftCrop(clampCrop({ x, y, w, h }));
                } else {
                  if (!draftCrop) return;
                  const nx = p.x - (drag.offsetX ?? 0);
                  const ny = p.y - (drag.offsetY ?? 0);
                  setDraftCrop(clampCrop({ x: nx, y: ny, w: draftCrop.w, h: draftCrop.h }));
                }
              }}
              onMouseUp={() => {
                cropDragRef.current = null;
              }}
              onMouseLeave={() => {
                cropDragRef.current = null;
              }}
            >
              <img src={imgUrl} alt="crop" draggable={false} onDragStart={(e) => e.preventDefault()} className="h-full w-full select-none object-contain pointer-events-none" />

              {draftCrop && (
                <>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute border-2 border-blue-500 bg-blue-300/10" style={{ left: `${draftCrop.x * 100}%`, top: `${draftCrop.y * 100}%`, width: `${draftCrop.w * 100}%`, height: `${draftCrop.h * 100}%` }} />
                  <div className="absolute bg-black/30" style={{ left: 0, top: 0, width: "100%", height: `${draftCrop.y * 100}%` }} />
                  <div className="absolute bg-black/30" style={{ left: 0, top: `${(draftCrop.y + draftCrop.h) * 100}%`, width: "100%", height: `${(1 - (draftCrop.y + draftCrop.h)) * 100}%` }} />
                  <div className="absolute bg-black/30" style={{ left: 0, top: `${draftCrop.y * 100}%`, width: `${draftCrop.x * 100}%`, height: `${draftCrop.h * 100}%` }} />
                  <div className="absolute bg-black/30" style={{ left: `${(draftCrop.x + draftCrop.w) * 100}%`, top: `${draftCrop.y * 100}%`, width: `${(1 - (draftCrop.x + draftCrop.w)) * 100}%`, height: `${draftCrop.h * 100}%` }} />
                </>
              )}
            </div>
          </div>

          <div className="rounded border border-slate-200 p-2">
            <div className="mb-2 text-[11px] text-slate-500">預覽</div>
            <div className="aspect-video w-full overflow-hidden rounded bg-slate-100">
              <div className="h-full w-full">
                <div className="relative h-full w-full">
                  <img src={imgUrl} alt="preview" draggable={false} onDragStart={(e) => e.preventDefault()} className="h-full w-full select-none pointer-events-none" style={{ objectFit: draftCrop ? "cover" : "contain", transformOrigin: "top left", transform: draftCrop ? `translate(${-draftCrop.x * 100}%, ${-draftCrop.y * 100}%) scale(${1 / Math.max(1e-6, draftCrop.w)}, ${1 / Math.max(1e-6, draftCrop.h)})` : undefined }} />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded border border-slate-300 bg-white px-3 py-1 text-[12px]" onClick={() => setDraftCrop({ x: 0, y: 0, w: 1, h: 1 })}>全圖</button>
              <button className="rounded border border-slate-300 bg-white px-3 py-1 text-[12px]" onClick={() => setDraftCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 })}>置中 80%</button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded border border-slate-300 bg-white px-3 py-1 text-sm" onClick={closeCropModal}>取消</button>
          <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white" onClick={applyDraftCrop}>套用</button>
        </div>
      </div>
    </div>
  );
}
