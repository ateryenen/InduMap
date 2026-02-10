// components/whiteboard/canvas/FreeDrawLayer.tsx
"use client";

import React, { useRef, useEffect } from "react";
import type { Stroke, Viewport } from "@/lib/whiteboard/drawTypes";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type Props = {
  viewport: Viewport;
  // 是否啟用畫筆（Pen 工具）
  isPenActive: boolean;

  // 資料
  strokes: Stroke[];
  setStrokes: (next: Stroke[] | ((prev: Stroke[]) => Stroke[])) => void;

  // 畫筆設定
  penColor?: string;
  penWidth?: number;
  penOpacity?: number;

  // 可選：畫筆最小移動距離（像素，避免點太密）
  minDistance?: number;
};

export default function FreeDrawLayer({
  viewport,
  isPenActive,
  strokes,
  setStrokes,
  penColor = "#111827",
  penWidth = 2,
  penOpacity = 1,
  minDistance = 3,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeRef = useRef<{ active: boolean; strokeId: string | null }>({
    active: false,
    strokeId: null,
  });

  // 調整 Canvas 尺寸以匹配視窗
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // 重繪所有筆跡到 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // 清空畫布
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 繪製所有筆跡
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.globalAlpha = stroke.opacity;
      ctx.lineWidth = stroke.width * viewport.scale;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, viewport]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startStroke = (p: { x: number; y: number }) => {
    const id = uid();
    activeRef.current.active = true;
    activeRef.current.strokeId = id;

    const s: Stroke = {
      id,
      points: [{ x: p.x, y: p.y, t: Date.now() }],
      width: penWidth,
      color: penColor,
      opacity: penOpacity,
    };

    setStrokes((prev) => [...prev, s]);
  };

  const appendPoint = (p: { x: number; y: number }) => {
    const id = activeRef.current.strokeId;
    if (!id) return;

    setStrokes((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const last = s.points[s.points.length - 1];
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        if (dx * dx + dy * dy < minDistance * minDistance) return s;

        return {
          ...s,
          points: [...s.points, { x: p.x, y: p.y, t: Date.now() }],
        };
      })
    );
  };

  const endStroke = () => {
    activeRef.current.active = false;
    activeRef.current.strokeId = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!isPenActive) return;
    if (e.button !== 0) return;

    (e.currentTarget as Element).setPointerCapture(e.pointerId);

    const p = getCanvasPoint(e.clientX, e.clientY);
    startStroke(p);

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPenActive) return;
    if (!activeRef.current.active) return;

    const p = getCanvasPoint(e.clientX, e.clientY);
    appendPoint(p);

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isPenActive) return;
    endStroke();
    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerCancel = () => {
    if (!isPenActive) return;
    endStroke();
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{
        pointerEvents: isPenActive ? "auto" : "none",
        touchAction: "none",
        width: "100%",
        height: "100%",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    />
  );
}
