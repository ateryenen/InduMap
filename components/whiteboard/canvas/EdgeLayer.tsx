"use client";

import React from "react";
import type {
  Edge,
  EdgeRelation,
  EdgeStyle,
  Node,
} from "../../../lib/whiteboard/types";
import { EDGE_STYLE_PRESET as IMPORTED_PRESET } from "../../../lib/whiteboard/types";

type Point = { x: number; y: number };

export type EdgeLayerProps = {
  /** Back-compat: some callers pass nodes+edges */
  nodes?: Node[];
  edges?: Edge[];

  /** Newer callers may pass a center resolver */
  getNodeCenter?: (id: string) => Point;

  /** Optional: live preview line while dragging connect */
  connectingFrom?: Point | null;
  connectingTo?: Point | null;

  /** Optional: selected edge ID for highlighting */
  selectedEdgeId?: string | null;
  
  /** Optional: array of selected IDs (can include edge:xxx for edges) */
  selectedIds?: string[];

  /** Optional: interactive edge clicking */
  onEdgeMouseDown?: (e: React.MouseEvent, edge: Edge) => void;
  onEdgeClick?: (edgeId: string) => void;

  /** Optional: handle connection point dragging */
  onEdgePointDrag?: (edgeId: string, pointType: 'from' | 'to', anchor: { side: 'top' | 'right' | 'bottom' | 'left'; offset: number }) => void;
  
  /** Optional: reset connection point */
  onEdgePointReset?: (edgeId: string, pointType: 'from' | 'to') => void;
};

// Fallback preset (if import/export mismatch happens)
const FALLBACK_PRESET: Record<string, any> = {
  drives:      { arrow: "end", width: 2 },
  enables:     { arrow: "end", width: 2, dash: [6, 4] },
  blocks:      { arrow: "end", width: 2, dash: [2, 4] },
  dependsOn:   { arrow: "end", width: 2, dash: [8, 6] },
  tradeoff:    { arrow: "both", width: 2 },
  partOf:      { arrow: "end", width: 1 },
  childOf:     { arrow: "end", width: 1, dash: [4, 4] },
  similar:     { arrow: "none", width: 1, dash: [6, 6] },
  exampleOf:   { arrow: "end", width: 1, dash: [2, 6] },
  unspecified: { arrow: "end", width: 1 },
};

function getStyle(relation?: EdgeRelation, edgeStyle?: EdgeStyle): any {
  const presetMap: any = (IMPORTED_PRESET as any) ?? FALLBACK_PRESET;
  const preset = relation && presetMap?.[relation] ? presetMap[relation] : {};
  return { ...preset, ...(edgeStyle ?? {}) };
}

function safeNum(n: any, fallback: number) {
  return Number.isFinite(n) ? n : fallback;
}

/** Compute node center from Node definition (x,y,width,height). *//** 根據錨點計算實際座標 */
function getAnchorPoint(
  node: Partial<Node>,
  anchor: { side: 'top' | 'right' | 'bottom' | 'left'; offset: number }
): Point {
  const x = (node as any).x || 0;
  const y = (node as any).y || 0;
  const w = (node as any).width || 100;
  const h = (node as any).height || 100;
  
  const offset = Math.max(0, Math.min(1, anchor.offset)); // 確保在 0-1 之間
  
  switch (anchor.side) {
    case 'top':
      return { x: x + w * offset, y };
    case 'right':
      return { x: x + w, y: y + h * offset };
    case 'bottom':
      return { x: x + w * offset, y: y + h };
    case 'left':
      return { x, y: y + h * offset };
  }
}

/** 根據滑鼠位置找到最接近的節點邊和偏移量 */
function findClosestAnchor(
  mouseX: number,
  mouseY: number,
  node: Partial<Node>
): { side: 'top' | 'right' | 'bottom' | 'left'; offset: number } {
  const x = (node as any).x || 0;
  const y = (node as any).y || 0;
  const w = (node as any).width || 100;
  const h = (node as any).height || 100;
  
  // 計算到四個邊的距離
  const distTop = Math.abs(mouseY - y);
  const distRight = Math.abs(mouseX - (x + w));
  const distBottom = Math.abs(mouseY - (y + h));
  const distLeft = Math.abs(mouseX - x);
  
  const minDist = Math.min(distTop, distRight, distBottom, distLeft);
  
  if (minDist === distTop) {
    const offset = Math.max(0, Math.min(1, (mouseX - x) / w));
    return { side: 'top', offset };
  } else if (minDist === distRight) {
    const offset = Math.max(0, Math.min(1, (mouseY - y) / h));
    return { side: 'right', offset };
  } else if (minDist === distBottom) {
    const offset = Math.max(0, Math.min(1, (mouseX - x) / w));
    return { side: 'bottom', offset };
  } else {
    const offset = Math.max(0, Math.min(1, (mouseY - y) / h));
    return { side: 'left', offset };
  }
}
function centerFromNode(n?: Partial<Node>): Point {
  const x = safeNum((n as any)?.x, 0);
  const y = safeNum((n as any)?.y, 0);
  const w = safeNum((n as any)?.width, 0);
  const h = safeNum((n as any)?.height, 0);
  return { x: x + w / 2, y: y + h / 2 };
}

/** Get node bounds (left, top, right, bottom). */
function getNodeBounds(n?: Partial<Node>) {
  const x = safeNum((n as any)?.x, 0);
  const y = safeNum((n as any)?.y, 0);
  const w = safeNum((n as any)?.width, 0);
  const h = safeNum((n as any)?.height, 0);
  return { left: x, top: y, right: x + w, bottom: y + h, cx: x + w / 2, cy: y + h / 2 };
}

/** 計算從節點邊框到另一節點的連接點 */
function getEdgePoint(fromNode: Partial<Node>, toNode: Partial<Node>): Point {
  const from = getNodeBounds(fromNode);
  const to = getNodeBounds(toNode);
  
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: from.cx, y: from.cy };
  
  // 計算方向單位向量
  const ux = dx / distance;
  const uy = dy / distance;
  
  // 找出從節點邊框到方向的交點
  let t = Infinity;
  
  // 檢查四個邊
  if (ux > 0.01) t = Math.min(t, (from.right - from.cx) / ux);  // 右邊
  if (ux < -0.01) t = Math.min(t, (from.left - from.cx) / ux);  // 左邊
  if (uy > 0.01) t = Math.min(t, (from.bottom - from.cy) / uy); // 下邊
  if (uy < -0.01) t = Math.min(t, (from.top - from.cy) / uy);   // 上邊
  
  if (!Number.isFinite(t) || t < 0) t = Math.min(from.right - from.cx, from.bottom - from.cy);
  
  return {
    x: from.cx + ux * t,
    y: from.cy + uy * t,
  };
}

/** 將自動連接點轉換為最接近的錨點（用於平滑過渡） */
function pointToAnchor(
  point: Point,
  node: Partial<Node>
): { side: 'top' | 'right' | 'bottom' | 'left'; offset: number } {
  const x = (node as any).x || 0;
  const y = (node as any).y || 0;
  const w = (node as any).width || 100;
  const h = (node as any).height || 100;
  
  // 計算到四個邊的距離
  const distTop = Math.abs(point.y - y);
  const distRight = Math.abs(point.x - (x + w));
  const distBottom = Math.abs(point.y - (y + h));
  const distLeft = Math.abs(point.x - x);
  
  const minDist = Math.min(distTop, distRight, distBottom, distLeft);
  
  if (minDist === distTop) {
    const offset = Math.max(0, Math.min(1, (point.x - x) / w));
    return { side: 'top', offset };
  } else if (minDist === distRight) {
    const offset = Math.max(0, Math.min(1, (point.y - y) / h));
    return { side: 'right', offset };
  } else if (minDist === distBottom) {
    const offset = Math.max(0, Math.min(1, (point.x - x) / w));
    return { side: 'bottom', offset };
  } else {
    const offset = Math.max(0, Math.min(1, (point.y - y) / h));
    return { side: 'left', offset };
  }
}


/** 檢查點是否在節點範圍內（含邊距） */
function isPointInNode(point: Point, node: Partial<Node>, margin = 10): boolean {
  const bounds = getNodeBounds(node);
  return point.x >= bounds.left - margin && 
         point.x <= bounds.right + margin &&
         point.y >= bounds.top - margin && 
         point.y <= bounds.bottom + margin;
}

/** 計算避開障礙物的直角路徑 */
function calculateOrthogonalPath(
  from: Point, 
  to: Point, 
  fromNode: Partial<Node>, 
  toNode: Partial<Node>,
  obstacles: Partial<Node>[]
): Point[] {
  const fromBounds = getNodeBounds(fromNode);
  const toBounds = getNodeBounds(toNode);
  
  // 決定起點和終點的方向（上下左右）
  const fromSide = getExitSide(from, fromBounds);
  const toSide = getExitSide(to, toBounds);
  
  const margin = 6; // 避開節點的邊距（減少不必要繞路）
  
  // 簡單的三段式路徑：起點 -> 轉折點 -> 終點
  const points: Point[] = [from];
  
  // 檢查直線路徑是否會穿過其他節點
  let needsRouting = false;
  for (const obstacle of obstacles) {
    if (obstacle === fromNode || obstacle === toNode) continue;
    if (lineIntersectsNode(from, to, obstacle, margin)) {
      needsRouting = true;
      break;
    }
  }
  
  if (!needsRouting) {
    // 直線路徑安全，直接使用直線
    points.push(to);
    return points;
  } else {
    // 正交路由：Z字形雙轉折，避免進入邊框時角度過平
    const distX = Math.abs(to.x - from.x);
    const distY = Math.abs(to.y - from.y);
    const maxDist = Math.max(distX, distY);
    
    // 動態 offset：距離越遠越大（但有上下限）
    const baseOffset = Math.min(80, Math.max(30, maxDist * 0.25));
    
    // 根據方向選擇路由策略
    // 優先選擇能產生更好角度的方向
    const horizontal = distX > distY;
    
    if (horizontal) {
      // 水平優先：from → 水平 → 垂直 → 水平 → to
      // 確保最後一段垂直進入，有足夠的對角線長度
      const x1 = from.x + (to.x > from.x ? baseOffset : -baseOffset);
      
      // 倒數第二個點的 y 坐標決定了最後一段垂直線的長度
      // 如果 y 離 to.y 太近，會導致進入角度過平
      // 所以我們確保至少離 to.y 有一定距離
      const minVerticalDist = Math.max(40, Math.abs(to.y - from.y) * 0.2);
      const y2 = to.y > from.y 
        ? Math.min(from.y + baseOffset * 2, to.y - minVerticalDist)
        : Math.max(from.y - baseOffset * 2, to.y + minVerticalDist);
      
      const x2 = to.x - (to.x > from.x ? baseOffset : -baseOffset);
      
      points.push({ x: x1, y: from.y });      // 第一轉折：水平走出去
      points.push({ x: x2, y: from.y });      // 第二轉折前：繼續水平走近目標
      points.push({ x: x2, y: y2 });          // 第二轉折：垂直走近目標
    } else {
      // 垂直優先：from → 垂直 → 水平 → 垂直 → to
      // 確保最後一段水平進入，有足夠的對角線長度
      const y1 = from.y + (to.y > from.y ? baseOffset : -baseOffset);
      
      // 倒數第二個點的 x 坐標決定了最後一段水平線的長度
      // 如果 x 離 to.x 太近，會導致進入角度過平
      // 所以我們確保至少離 to.x 有一定距離
      const minHorizontalDist = Math.max(40, Math.abs(to.x - from.x) * 0.2);
      const x2 = to.x > from.x
        ? Math.min(from.x + baseOffset * 2, to.x - minHorizontalDist)
        : Math.max(from.x - baseOffset * 2, to.x + minHorizontalDist);
      
      const y2 = to.y - (to.y > from.y ? baseOffset : -baseOffset);
      
      points.push({ x: from.x, y: y1 });      // 第一轉折：垂直走出去
      points.push({ x: from.x, y: y2 });      // 第二轉折前：繼續垂直走近目標
      points.push({ x: x2, y: y2 });          // 第二轉折：水平走近目標
    }
  }
  
  points.push(to);
  return points;
}

/** 判斷連接點在節點的哪一側 */
function getExitSide(point: Point, bounds: { left: number; top: number; right: number; bottom: number; cx: number; cy: number }): 'left' | 'right' | 'top' | 'bottom' {
  const dx = point.x - bounds.cx;
  const dy = point.y - bounds.cy;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left';
  } else {
    return dy > 0 ? 'bottom' : 'top';
  }
}

/** 檢查線段是否穿過節點 */
function lineIntersectsNode(p1: Point, p2: Point, node: Partial<Node>, margin = 10): boolean {
  const bounds = getNodeBounds(node);
  const rect = {
    left: bounds.left - margin,
    right: bounds.right + margin,
    top: bounds.top - margin,
    bottom: bounds.bottom + margin,
  };
  
  // 使用 Liang-Barsky 算法檢查線段與矩形相交
  return lineIntersectsRect(p1, p2, rect);
}

/** 線段與矩形相交檢測 */
function lineIntersectsRect(p1: Point, p2: Point, rect: { left: number; right: number; top: number; bottom: number }): boolean {
  // 檢查線段端點是否在矩形內
  if ((p1.x >= rect.left && p1.x <= rect.right && p1.y >= rect.top && p1.y <= rect.bottom) ||
      (p2.x >= rect.left && p2.x <= rect.right && p2.y >= rect.top && p2.y <= rect.bottom)) {
    return true;
  }
  
  // 檢查線段是否與矩形的四條邊相交
  return (
    lineSegmentsIntersect(p1, p2, { x: rect.left, y: rect.top }, { x: rect.right, y: rect.top }) ||
    lineSegmentsIntersect(p1, p2, { x: rect.right, y: rect.top }, { x: rect.right, y: rect.bottom }) ||
    lineSegmentsIntersect(p1, p2, { x: rect.right, y: rect.bottom }, { x: rect.left, y: rect.bottom }) ||
    lineSegmentsIntersect(p1, p2, { x: rect.left, y: rect.bottom }, { x: rect.left, y: rect.top })
  );
}

/** 兩線段相交檢測 */
function lineSegmentsIntersect(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  const dax = a2.x - a1.x;
  const day = a2.y - a1.y;
  const dbx = b2.x - b1.x;
  const dby = b2.y - b1.y;
  const denom = dax * dby - day * dbx;
  
  if (Math.abs(denom) < 0.0001) return false; // 平行
  
  const s = ((a1.x - b1.x) * dby - (a1.y - b1.y) * dbx) / denom;
  const t = ((a1.x - b1.x) * day - (a1.y - b1.y) * dax) / denom;
  
  return s >= 0 && s <= 1 && t >= 0 && t <= 1;
}

export default function EdgeLayer(props: EdgeLayerProps) {
  const {
    nodes = [],
    edges = [],
    getNodeCenter,
    connectingFrom = null,
    connectingTo = null,
    selectedEdgeId = null,
    selectedIds = [],
    onEdgeMouseDown,
    onEdgeClick,
    onEdgePointDrag,
    onEdgePointReset,
  } = props;

  // 追蹤當前拖動的連接點
  const [draggedPoint, setDraggedPoint] = React.useState<{
    edgeId: string;
    pointType: 'from' | 'to';
    nodeId: string;
  } | null>(null);

  // 追蹤拖動開始位置，用於檢測是否真正拖動（而不是誤點擊）
  const [dragStartPos, setDragStartPos] = React.useState<{ x: number; y: number } | null>(null);

  // 處理連接點拖動開始
  const handlePointMouseDown = React.useCallback(
    (e: React.MouseEvent, edgeId: string, pointType: 'from' | 'to', nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      setDraggedPoint({
        edgeId,
        pointType,
        nodeId,
      });
      // 記錄拖動開始位置
      setDragStartPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  // Build a map so we can resolve centers even if getNodeCenter isn't provided.
  const nodeMap = React.useMemo(() => {
    const m = new Map<string, Node>();
    for (const n of nodes) m.set((n as any).id, n);
    return m;
  }, [nodes]);

  // 處理拖動移動
  React.useEffect(() => {
    if (!draggedPoint || !dragStartPos) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!onEdgePointDrag) return;
      
      // 計算滑鼠移動距離，只有移動超過 5px 才算真正拖動
      const dx = e.clientX - dragStartPos.x;
      const dy = e.clientY - dragStartPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 5) {
        // 還沒移動足夠遠，不更新錨點
        return;
      }
      
      // 獲取 SVG 容器的位置和大小
      const svg = document.querySelector('svg[viewBox="0 0 4000 4000"]') as SVGSVGElement;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      
      // 計算 SVG 坐標系中的滑鼠位置
      const scale = 4000 / rect.width;
      const mouseX = (e.clientX - rect.left) * scale;
      const mouseY = (e.clientY - rect.top) * scale;
      
      // 找到對應的節點
      const node = nodeMap.get(draggedPoint.nodeId);
      if (!node) return;
      
      // 計算最接近的錨點
      const anchor = findClosestAnchor(mouseX, mouseY, node);
      
      // 調用 callback 用於實際的狀態更新
      onEdgePointDrag(draggedPoint.edgeId, draggedPoint.pointType, anchor);
    };

    const handleMouseUp = () => {
      setDraggedPoint(null);
      setDragStartPos(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPoint, dragStartPos, onEdgePointDrag, nodeMap]);

  const resolveCenter = React.useCallback(
    (id: string): Point => {
      if (typeof getNodeCenter === "function") return getNodeCenter(id);
      const n = nodeMap.get(id);
      return centerFromNode(n as any);
    },
    [getNodeCenter, nodeMap]
  );

  return (
    <svg
      className="absolute inset-0"
      width="100%"
      height="100%"
      viewBox="0 0 4000 4000"
      preserveAspectRatio="xMinYMin meet"
      onMouseUp={() => {
        setDraggedPoint(null);
        setDragStartPos(null);
      }}
      onMouseLeave={() => {
        setDraggedPoint(null);
        setDragStartPos(null);
      }}
    >
      <defs>
        {/* 主要箭頭 - 實線 */}
        <marker
          id="wb_arrow_drives"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" strokeWidth="0.5" stroke="#c7252c" />
        </marker>
        
        {/* 虛線箭頭 - enables */}
        <marker
          id="wb_arrow_enables"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" strokeWidth="0.5" stroke="#1e40af" />
        </marker>

        {/* 依賴箭頭 */}
        <marker
          id="wb_arrow_dependson"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" strokeWidth="0.5" stroke="#d97706" />
        </marker>

        {/* 預設箭頭 */}
        <marker
          id="wb_arrow_default"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerUnits="userSpaceOnUse"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" strokeWidth="0.5" stroke="#475569" />
        </marker>
      </defs>

      {/* Existing edges */}
      {(edges || []).map((edge) => {
        const fromNodeId = (edge as any).fromId ?? (edge as any).from;
        const toNodeId = (edge as any).toId ?? (edge as any).to;
        
        const fromNode = nodeMap.get(fromNodeId);
        const toNode = nodeMap.get(toNodeId);
        
        if (!fromNode || !toNode) return null;
        
        // 檢查是否有自定義錨點，否則使用邊框交點
        const from = (edge as any).fromAnchor 
          ? getAnchorPoint(fromNode as any, (edge as any).fromAnchor)
          : getEdgePoint(fromNode as any, toNode as any);
        const to = (edge as any).toAnchor 
          ? getAnchorPoint(toNode as any, (edge as any).toAnchor)
          : getEdgePoint(toNode as any, fromNode as any);
        
        // 計算避開障礙物的路徑
        const obstacles = Array.from(nodeMap.values()).filter(n => n !== fromNode && n !== toNode);
        const pathPoints = calculateOrthogonalPath(from, to, fromNode, toNode, obstacles);
        
        // 路徑水平方向缺少 10px使亳頭的尖端正好接觸邊框
        let displayPathPoints = [...pathPoints];
        if (displayPathPoints.length > 0) {
          // 終點從邊框後退 10px （箭頭寶寻雛屔不會超出邊框）
          const lastIdx = displayPathPoints.length - 1;
          if (lastIdx > 0) {
            const prevPoint = displayPathPoints[lastIdx - 1];
            const dx = to.x - prevPoint.x;
            const dy = to.y - prevPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 检测是否对术平行（x 或 y 坐標非常接近）
            if ((Math.abs(dy) < 2 || Math.abs(dx) < 2) && lastIdx > 1) {
              // 如果是平行线段，需要调整上一个点
              const prevPrevPoint = displayPathPoints[lastIdx - 2];
              if (Math.abs(dy) < 2) {
                // 最后是水平的，调整 x 坐標
                const newX = (prevPrevPoint.x + to.x) / 2;
                displayPathPoints[lastIdx - 1] = { x: newX, y: prevPoint.y };
              } else {
                // 最后是垂直的，调整 y 坐標
                const newY = (prevPrevPoint.y + to.y) / 2;
                displayPathPoints[lastIdx - 1] = { x: prevPoint.x, y: newY };
              }
              displayPathPoints[lastIdx] = to;
            } else if (dist > 10) {
              // 正常的斜线，缺短 10px
              const ratio = 1 - 10 / dist;
              displayPathPoints[lastIdx] = {
                x: prevPoint.x + dx * ratio,
                y: prevPoint.y + dy * ratio,
              };
            } else {
              displayPathPoints[lastIdx] = prevPoint;
            }
          } else {
            displayPathPoints[lastIdx] = to;
          }
          
          // 起點也一樣盒位置吉例性
          if (displayPathPoints.length > 1) {
            displayPathPoints[0] = from;
          }
        }
        
        // 生成 SVG path 字符串
        const pathD = displayPathPoints.map((p, i) => 
          i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        ).join(' ');

        const relation = (edge as any).relation;
        const style = getStyle(relation, (edge as any).style);
        const dash = style.dash ? style.dash.join(",") : undefined;
        
        // 根據關係類型決定顏色和箭頭
        let stroke = "#334155";
        let markerArrowId = "url(#wb_arrow_default)";
        
        if (relation === "drives") {
          stroke = "#ef4444";
          markerArrowId = "url(#wb_arrow_drives)";
        } else if (relation === "enables") {
          stroke = "#3b82f6";
          markerArrowId = "url(#wb_arrow_enables)";
        } else if (relation === "dependsOn") {
          stroke = "#f59e0b";
          markerArrowId = "url(#wb_arrow_dependson)";
        } else if (style.stroke) {
          stroke = style.stroke;
        }

        const width = style.width ?? 2;

        const midPoint = displayPathPoints[Math.floor(displayPathPoints.length / 2)];
        const midX = midPoint.x;
        const midY = midPoint.y;

        const markerEnd =
          style.arrow === "end" || style.arrow === "both" ? markerArrowId : undefined;
        const markerStart = style.arrow === "both" ? markerArrowId : undefined;

        const interactive = (!!onEdgeMouseDown || !!onEdgeClick) && (style.interactive ?? true);
        const edgeId = (edge as any).id;
        const isSelected = selectedEdgeId === edgeId || selectedIds.includes(`edge:${edgeId}`);

        return (
          <g key={(edge as any).id}>
            {/* 透明的粗線條 - 用於增大點擊區域 */}
            <path
              d={pathD}
              stroke="transparent"
              strokeWidth={Math.max(12, width * 6)}
              fill="none"
              className={interactive ? "cursor-pointer" : undefined}
              style={{ pointerEvents: interactive ? "auto" : "none" }}
              onMouseDown={interactive ? (e) => onEdgeMouseDown?.(e, edge) : undefined}
              onClick={() => onEdgeClick?.((edge as any).id)}
            />
            
            {/* 實際的可見線條 */}
            <path
              d={pathD}
              stroke={isSelected ? "#0ea5e9" : stroke}
              strokeWidth={isSelected ? width + 1.5 : width}
              strokeDasharray={dash}
              fill="none"
              markerEnd={markerEnd}
              markerStart={markerStart}
              style={{ pointerEvents: "none" }}
            />
            {/* 連接點控制項：有錨點時永遠顯示，無錨點時僅在選中時顯示 */}
            {(isSelected || (edge as any).fromAnchor) && (
              <>
                {/* 從節點連接點 */}
                {/* 增大的透明圆圈 - 更容易点击 */}
                <circle 
                  cx={from.x} 
                  cy={from.y} 
                  r="12" 
                  fill="transparent"
                  stroke="transparent"
                  style={{ pointerEvents: "auto", cursor: draggedPoint ? "grabbing" : "grab" }}
                  onMouseDown={(e) => handlePointMouseDown(e, edgeId, 'from', fromNodeId)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // 双击重置连接点：计算自动位置，转换为锚点表示，平滑过渡
                    setDraggedPoint(null);
                    setDragStartPos(null);
                    
                    // 计算当前的自动连接点位置
                    const autoPoint = getEdgePoint(fromNode as any, toNode as any);
                    // 将自动点位置转换为锚点表示（这样不会跳动）
                    const autoAnchor = pointToAnchor(autoPoint, fromNode as any);
                    // 调用 onEdgePointDrag 而不是 onEdgePointReset，这样位置不会跳动
                    onEdgePointDrag?.(edgeId, 'from', autoAnchor);
                  }}
                />
                {/* 可见的连接点 */}
                <circle 
                  cx={from.x} 
                  cy={from.y} 
                  r="5" 
                  fill={(edge as any).fromAnchor ? "#10b981" : "#0ea5e9"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ pointerEvents: "none" }}
                />
              </>
            )}
            
            {/* 連接點控制項：有錨點時永遠顯示，無錨點時僅在選中時顯示 */}
            {(isSelected || (edge as any).toAnchor) && (
              <>
                {/* 到節點連接點 */}
                {/* 增大的透明圆圈 - 更容易点击 */}
                <circle 
                  cx={to.x} 
                  cy={to.y} 
                  r="12" 
                  fill="transparent"
                  stroke="transparent"
                  style={{ pointerEvents: "auto", cursor: draggedPoint ? "grabbing" : "grab" }}
                  onMouseDown={(e) => handlePointMouseDown(e, edgeId, 'to', toNodeId)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // 双击重置连接点：计算自动位置，转换为锚点表示，平滑过渡
                    setDraggedPoint(null);
                    setDragStartPos(null);
                    
                    // 计算当前的自动连接点位置
                    const autoPoint = getEdgePoint(fromNode as any, toNode as any);
                    // 将自动点位置转换为锚点表示（这样不会跳动）
                    const autoAnchor = pointToAnchor(autoPoint, toNode as any);
                    // 调用 onEdgePointDrag 而不是 onEdgePointReset，这样位置不会跳动
                    onEdgePointDrag?.(edgeId, 'to', autoAnchor);
                  }}
                />
                {/* 可见的连接点 */}
                <circle 
                  cx={to.x} 
                  cy={to.y} 
                  r="5" 
                  fill={(edge as any).toAnchor ? "#10b981" : "#0ea5e9"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  style={{ pointerEvents: "none" }}
                />
              </>
            )}
            
            {isSelected && (
              <>
                {displayPathPoints.slice(1, -1).map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="#0ea5e9" opacity="0.6" />
                ))}
              </>
            )}
            
            {(edge as any).label ? (
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#0f172a"
                className="select-none"
                style={{ pointerEvents: "none" }}
              >
                {(edge as any).label}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Live preview line while dragging connect */}
      {connectingFrom && connectingTo ? (
        <line
          x1={connectingFrom.x}
          y1={connectingFrom.y}
          x2={connectingTo.x}
          y2={connectingTo.y}
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="6,4"
          markerEnd="url(#wb_arrow)"
          style={{ pointerEvents: "none" }}
        />
      ) : null}
    </svg>
  );
}

// Named export for safety (some code may do import { EdgeLayer } ...)
export { EdgeLayer };