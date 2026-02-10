// lib/whiteboard/drawTypes.ts
export type DrawPoint = { x: number; y: number; t?: number };

export type Stroke = {
  id: string;
  points: DrawPoint[];
  width: number;     // 以 world 單位（會隨 zoom 一起縮放）
  color: string;
  opacity: number;
};

export type Viewport = {
  x: number; // 螢幕像素 (pan X)
  y: number; // 螢幕像素 (pan Y)
  scale: number; // 1 = 100% (zoom)
};
