"use client";

import React, {
  useState,
  useRef,
  useEffect,
  MouseEvent,
  WheelEvent,
} from "react";
import html2canvas from "html2canvas";
import JSZip from "jszip";

// ⬇⬇⬇ 新增：從 types.ts 把所有型別／常數匯入
import {
  Tool,
  NodeType,
  StrategyLevel,
  Node,
  ImageCrop,
  Edge,
  Viewport,
  BoardState,
  Page,
  ProjectFileV2,
  ResizeHandle,
  STORAGE_KEY,
  createId,
  templateNodes,
  adasTemplateNodes,
  adasTemplateEdges,
  robotTemplateNodes,
  robotTemplateEdges,
} from "../lib/whiteboard/types";

// ⬇⬇⬇ 新增：從獨立檔案匯入 Canvas 元件
import { GridBackground } from "../components/whiteboard/canvas/GridBackground";
import EdgeLayer from "../components/whiteboard/canvas/EdgeLayer";
import { WhiteboardNode } from "../components/whiteboard/canvas/WhiteboardNode";
import { MiniMap } from "../components/whiteboard/canvas/MiniMap";

import FreeDrawLayer from "../components/whiteboard/canvas/FreeDrawLayer";
import type { Stroke } from "../lib/whiteboard/drawTypes";


import {
  useAutoSaveProjectToStorage,
  useLoadProjectFromStorage,
} from "../lib/whiteboard/hooks/useProjectStorage";
import { useBoardHistory } from "../lib/whiteboard/hooks/useBoardHistory";

import HeaderToolbar from "../components/pageParts/HeaderToolbar";
import LeftPanel from "../components/pageParts/LeftPanel";
import RightPanel from "../components/pageParts/RightPanel";
import CanvasArea from "../components/pageParts/CanvasArea";
import CropModal from "../components/pageParts/CropModal";
import AIAssistant from "../components/ai/AIAssistant";

// ⬇⬇⬇ 從這裡開始就是你的 Whiteboard 主程式（原本在 WhiteboardNode 後面的程式碼）
// 例如：const defaultViewport: Viewport = { ... }
//       function WhiteboardApp() { ... }



export default function WhiteboardApp() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // 筆工具設定
  const [penColor, setPenColor] = useState<string>("#111827");
  const [penWidth, setPenWidth] = useState<number>(2);
  const [penOpacity, setPenOpacity] = useState<number>(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [connectingFrom, setConnectingFrom] = useState<{ x: number; y: number } | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const [connectingTo, setConnectingTo] = useState<{ x: number; y: number } | null>(null);
  const [isConnectDragging, setIsConnectDragging] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [projectName, setProjectName] =
    useState<string>("InduMap");

  // 多頁面
  const [pages, setPages] = useState<Page[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const [currentFileName, setCurrentFileName] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

// ---------- 圖片裁切（Crop） ----------
const [cropModalOpen, setCropModalOpen] = useState(false);
const [cropTargetId, setCropTargetId] = useState<string | null>(null);
const [draftCrop, setDraftCrop] = useState<ImageCrop | null>(null);
const cropImgBoxRef = useRef<HTMLDivElement | null>(null);

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Selection rectangle (框選)
  const [selectionRect, setSelectionRect] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const selectionModeRef = useRef<"add" | "subtract" | "replace">("replace");
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  // Smart guide lines
  const [guideLines, setGuideLines] = useState<{ v?: number; h?: number }>({});

  // Snap to grid
  const [snapToGrid, setSnapToGrid] = useState(false);
  const gridSize = 20;

  // Format painter
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const formatSourceIdRef = useRef<string | null>(null);

  // Minimal stubs for handlers possibly moved during refactor
  const handleToolClick = (t: Tool) => setTool(t);
  const handleCanvasMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // simple: start selection or pan depending on tool/space
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y };
      return;
    }
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    
    if (tool === "select") {
      // 記錄滑鼠按下位置，用於判斷是單擊還是拖曳
      mouseDownPosRef.current = { x: localX, y: localY };
      isDraggingRef.current = false;
      
      // 開始潛在的框選（會在 mousemove 中確認是否真的拖曳）
      setSelectionRect({ x1: localX, y1: localY, x2: localX, y2: localY });
      selectionModeRef.current = e.shiftKey ? "add" : "replace";
    } else if (tool === "pan") {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewport.x, vy: viewport.y };
    }
  };
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => e.preventDefault();

  const handleNodeMouseDown = () => {};
  
  const handleDoubleClickNode = (node: Node) => {
    // 圖片和表格節點不支持雙擊文字編輯，鎖定的節點也不能編輯
    if (node.type === "image" || node.type === "table" || node.locked) return;
    setSelectedIds([node.id]);
    setPrimaryId(node.id);
    setEditingId(node.id);
  };
  
  const handleInlineTextChange = (id: string, value: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: value } : n))
    );
  };
  
  const handleFinishEditing = () => {
    setEditingId(null);
  };
  
  const handleTableCellChange = (
    nodeId: string,
    row: number,
    col: number,
    value: string
  ) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId || !n.table) return n;
        const newCells = n.table.cells.map((r, ri) =>
          ri === row
            ? r.map((c, ci) => (ci === col ? value : c))
            : r
        );
        return {
          ...n,
          table: {
            ...n.table,
            cells: newCells,
          },
        };
      })
    );
  };
  
  const updateTableSize = (nodeId: string, rows: number, cols: number) => {
    const r = Math.max(1, Math.min(50, Math.floor(rows || 0)));
    const c = Math.max(1, Math.min(50, Math.floor(cols || 0)));
    recordHistory();
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== nodeId || !n.table) return n;
        const old = n.table;
        const newCells = Array.from({ length: r }, (_, ri) =>
          Array.from({ length: c }, (_, ci) => old.cells[ri]?.[ci] ?? "")
        );
        return {
          ...n,
          table: {
            rows: r,
            cols: c,
            cells: newCells,
          },
        };
      })
    );
  };
  
  // Edge editing functions
  const updateEdge = (edgeId: string, updates: Partial<Edge>) => {
    setEdges((prev) =>
      prev.map((e) => (e.id === edgeId ? { ...e, ...updates } : e))
    );
  };
  
  const deleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    setSelectedEdgeId(null);
    recordHistory();
  };
  
  const handleEdgeClick = (edgeId: string) => {
    setSelectedEdgeId(selectedEdgeId === edgeId ? null : edgeId);
    setSelectedIds([]);
    setPrimaryId(null);
  };
  
  // Real node click handler (added to ctx for child components)
  const handleNodeClick = (nodeId: string, e?: React.MouseEvent) => {
    if (tool === "select") {
      let newSelectedIds: string[] = [];
      
      // AutoCAD 風格改進：臨時群組邏輯
      // 如果點擊的節點已在選中群組中（沒有按 Shift），保持群組選取以便拖動
      const isAlreadySelected = selectedIds.includes(nodeId);
      
      if (e?.shiftKey) {
        // Shift：切換選取狀態（累加或移除）
        if (isAlreadySelected) {
          newSelectedIds = selectedIds.filter((id) => id !== nodeId);
        } else {
          newSelectedIds = [...selectedIds, nodeId];
        }
      } else if (isAlreadySelected && selectedIds.length > 1) {
        // 點擊群組中的物件：保持群組選取，準備拖動整個群組
        newSelectedIds = selectedIds;
      } else {
        // 點擊其他物件：單選（清除其他選取）
        newSelectedIds = [nodeId];
      }
      
      setSelectedIds(newSelectedIds);
      setPrimaryId(newSelectedIds.length > 0 ? (isAlreadySelected ? nodeId : newSelectedIds[0]) : null);
      setSelectedEdgeId(null); // 點擊節點時清除邊緣選擇，自動切換到屬性面板
      
      // Mark this node as the drag source; dragStart will be initialized on first mousemove
      if (e && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        
        // Store the drag initiation context; actual drag starts on first move
        // 不在這裡 recordHistory，等到真正拖曳時再記錄
        dragStart.current = {
          ids: newSelectedIds,
          startWorldX: (localX - viewport.x) / viewport.scale,
          startWorldY: (localY - viewport.y) / viewport.scale,
          nodePositions: {},
        };
        
        // Build nodePositions for all selected nodes
        newSelectedIds.forEach((id) => {
          const node = nodes.find((n) => n.id === id);
          if (node) {
            dragStart.current!.nodePositions[id] = { x: node.x, y: node.y };
          }
        });
      }
    } else if (tool === "connect") {
      // Connect tool: start/end edge connection
      if (!connectingFrom) {
        // Start connecting from this node
        const fromNode = nodes.find((n) => n.id === nodeId);
        if (fromNode) {
          setConnectingFrom({
            x: fromNode.x + fromNode.width / 2,
            y: fromNode.y + fromNode.height / 2,
          });
          setConnectingFromId(nodeId);
          setConnectingTo(null);
        }
      } else {
        // End connection to this node
        const toNode = nodes.find((n) => n.id === nodeId);
        if (toNode && connectingFromId) {
          recordHistory();
          setEdges((prev) => [
            ...prev,
            {
              id: createId(),
              fromId: connectingFromId,
              toId: nodeId,
              relation: "drives" as any,
            },
          ]);
          setConnectingFrom(null);
          setConnectingTo(null);
          setConnectingFromId(null);
        }
      }
    }
  };
  const addNodeAtCenter = (type: NodeType) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : 400;
    const cy = rect ? rect.top + rect.height / 2 : 300;
    const world = clientToWorld(cx, cy);

    recordHistory();
    const id = createId();
    let node: Node;

    switch (type) {
      case "category":
        node = {
          id,
          type: "category",
          x: world.x - 130,
          y: world.y - 60,
          width: 260,
          height: 120,
          text: "New Category",
          bgColor: "#f3f4f6",
          fontSize: 14,
          textColor: "#1f2937",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 400,
          textShadow: "none",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          level: "Info",
          categoryTag: "",
          impact: 0,
          effort: 0,
          owner: "",
          locked: false,
        };
        break;
      case "note":
        node = {
          id,
          type: "note",
          x: world.x - 110,
          y: world.y - 45,
          width: 220,
          height: 90,
          text: "New Note",
          bgColor: "#fff7ed",
          fontSize: 12,
          textColor: "#1f2937",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 400,
          textShadow: "none",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          categoryTag: "",
          locked: false,
        };
        break;
      case "text":
        node = {
          id,
          type: "text",
          x: world.x - 100,
          y: world.y - 30,
          width: 200,
          height: 60,
          text: "New text",
          fontSize: 14,
          textColor: "#1f2937",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 400,
          textShadow: "none",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "image":
        node = {
          id,
          type: "image",
          x: world.x - 80,
          y: world.y - 80,
          width: 160,
          height: 160,
          imageUrl: undefined,
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "table":
        node = {
          id,
          type: "table",
          x: world.x - 120,
          y: world.y - 90,
          width: 240,
          height: 180,
          table: { rows: 3, cols: 3, cells: Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => "")) },
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "group":
        node = {
          id,
          type: "group",
          x: world.x - 200,
          y: world.y - 150,
          width: 400,
          height: 300,
          text: "Group",
          bgColor: "#f8fafc",
          fontSize: 14,
          textColor: "#64748b",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 600,
          textShadow: "none",
          borderColor: "#94a3b8",
          borderWidth: 2,
          opacity: 0.3,
          children: [],
          locked: false,
        };
        break;
      case "title":
        node = {
          id,
          type: "title",
          x: world.x - 180,
          y: world.y - 40,
          width: 360,
          height: 80,
          text: "Title",
          bgColor: "#ffffff",
          fontSize: 24,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 700,
          textShadow: "none",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "icon":
        node = {
          id,
          type: "icon",
          x: world.x - 60,
          y: world.y - 60,
          width: 120,
          height: 120,
          text: "⭐",
          bgColor: "#ffffff",
          fontSize: 40,
          textColor: "#f59e0b",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 600,
          textShadow: "none",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "milestone":
        node = {
          id,
          type: "milestone",
          x: world.x - 140,
          y: world.y - 45,
          width: 280,
          height: 90,
          text: "里程碑",
          bgColor: "#ecfeff",
          fontSize: 16,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 600,
          textShadow: "none",
          borderColor: "#94a3b8",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "kpi":
        node = {
          id,
          type: "kpi",
          x: world.x - 120,
          y: world.y - 60,
          width: 240,
          height: 120,
          text: "KPI\n123",
          bgColor: "#f0f9ff",
          fontSize: 22,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 700,
          textShadow: "none",
          borderColor: "#93c5fd",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "owner":
        node = {
          id,
          type: "owner",
          x: world.x - 120,
          y: world.y - 50,
          width: 240,
          height: 100,
          text: "Owner\nName",
          bgColor: "#f8fafc",
          fontSize: 16,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 600,
          textShadow: "none",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "link":
        node = {
          id,
          type: "link",
          x: world.x - 150,
          y: world.y - 40,
          width: 300,
          height: 80,
          text: "Link Title",
          linkUrl: "https://",
          bgColor: "#ffffff",
          fontSize: 14,
          textColor: "#2563eb",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 500,
          textShadow: "none",
          borderColor: "#e2e8f0",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "tag":
        node = {
          id,
          type: "tag",
          x: world.x - 60,
          y: world.y - 20,
          width: 120,
          height: 40,
          text: "Tag",
          bgColor: "#f1f5f9",
          fontSize: 12,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 600,
          textShadow: "none",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "callout":
        node = {
          id,
          type: "callout",
          x: world.x - 160,
          y: world.y - 50,
          width: 320,
          height: 100,
          text: "Callout",
          bgColor: "#fff7ed",
          fontSize: 14,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 500,
          textShadow: "none",
          borderColor: "#fdba74",
          borderWidth: 2,
          opacity: 1,
          locked: false,
        };
        break;
      case "flow-process":
        node = {
          id,
          type: "flow-process",
          x: world.x - 140,
          y: world.y - 50,
          width: 280,
          height: 100,
          text: "Process",
          bgColor: "#ffffff",
          fontSize: 14,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 500,
          textShadow: "none",
          borderColor: "#94a3b8",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "flow-decision":
        node = {
          id,
          type: "flow-decision",
          x: world.x - 120,
          y: world.y - 120,
          width: 240,
          height: 240,
          text: "Decision",
          bgColor: "#ffffff",
          fontSize: 14,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 500,
          textShadow: "none",
          borderColor: "#94a3b8",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      case "flow-terminator":
        node = {
          id,
          type: "flow-terminator",
          x: world.x - 140,
          y: world.y - 50,
          width: 280,
          height: 100,
          text: "Start / End",
          bgColor: "#ffffff",
          fontSize: 14,
          textColor: "#0f172a",
          textOpacity: 1,
          textAlign: "center",
          fontWeight: 500,
          textShadow: "none",
          borderColor: "#94a3b8",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
        break;
      default:
        node = {
          id,
          type: "note",
          x: world.x - 110,
          y: world.y - 45,
          width: 220,
          height: 90,
          text: "New Note",
          bgColor: "#fff7ed",
          fontSize: 12,
          textColor: "#1f2937",
          textOpacity: 1,
          textAlign: "left",
          fontWeight: 400,
          textShadow: "none",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          opacity: 1,
          locked: false,
        };
    }

    setNodes((prev) => [...prev, node]);
    setSelectedIds([id]);
    setPrimaryId(id);
  };

  const [leftTab, setLeftTab] = useState<"project" | "templates" | "outline">(
    "project"
  );

  const [activeToolbar, setActiveToolbar] = useState<
    "none" | "file" | "view" | "insert" | "arrange" | "strategy" | "help"
  >("none");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
  } | null>(null);

  const dragStart = useRef<{
    ids: string[];
    startWorldX: number;
    startWorldY: number;
    nodePositions: Record<string, { x: number; y: number }>;
    historyRecorded?: boolean;
  } | null>(null);

  const resizeStart = useRef<{
    id: string;
    handle: ResizeHandle;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const clipboardRef = useRef<Node[] | null>(null);
  const spacePressedRef = useRef(false);

  const {
    recordHistory,
    undo: handleUndo,
    redo: handleRedo,
    historyPastRef,
    historyFutureRef,
  } = useBoardHistory({
    getSnapshot: () => ({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      viewport: JSON.parse(JSON.stringify(viewport)),
      pages: JSON.parse(JSON.stringify(pages || [])),
    }),
    applySnapshot: (s: BoardState) => {
      setNodes(s.nodes || []);
      setEdges(s.edges || []);
      setViewport(s.viewport || { x: 0, y: 0, scale: 1 });
      setSelectedIds([]);
      setPrimaryId(null);
      setEditingId(null);
    },
  });

  // ---------- Resize Handle Mouse Down ----------
  const handleResizeHandleMouseDown = (
    e: MouseEvent<HTMLDivElement>,
    node: Node,
    handle: ResizeHandle
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || node.locked) return;

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    recordHistory();
    resizeStart.current = {
      id: node.id,
      handle,
      startMouseX: localX,
      startMouseY: localY,
      startX: node.x,
      startY: node.y,
      startW: node.width,
      startH: node.height,
    };
  };

  // ---------- Canvas Mouse Move ----------
  const handleCanvasMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    if (tool === "connect" && connectingFrom) {
      const worldX = (localX - viewport.x) / viewport.scale;
      const worldY = (localY - viewport.y) / viewport.scale;
      setConnectingTo({ x: worldX, y: worldY });
      return;
    }

    // 矩形框選中 - 檢測是否真的在拖曳（移動超過 5px 才算拖曳）
    if (selectionRect && mouseDownPosRef.current) {
      const dx = Math.abs(localX - mouseDownPosRef.current.x);
      const dy = Math.abs(localY - mouseDownPosRef.current.y);
      
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true;
      }
      
      setSelectionRect((prev) =>
        prev ? { ...prev, x2: localX, y2: localY } : prev
      );
      return;
    }

    // Resize
    const rs = resizeStart.current;
    if (rs) {
      const dxWorld = (localX - rs.startMouseX) / viewport.scale;
      const dyWorld = (localY - rs.startMouseY) / viewport.scale;

      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== rs.id) return n;
          let { x, y, width, height } = n;
          const minW = 40;
          const minH = 30;

          switch (rs.handle) {
            case "right":
              width = Math.max(minW, rs.startW + dxWorld);
              break;
            case "left":
              width = Math.max(minW, rs.startW - dxWorld);
              x = rs.startX + (rs.startW - width);
              break;
            case "bottom":
              height = Math.max(minH, rs.startH + dyWorld);
              break;
            case "top":
              height = Math.max(minH, rs.startH - dyWorld);
              y = rs.startY + (rs.startH - height);
              break;
            case "top-left": {
              width = Math.max(minW, rs.startW - dxWorld);
              height = Math.max(minH, rs.startH - dyWorld);
              x = rs.startX + (rs.startW - width);
              y = rs.startY + (rs.startH - height);
              break;
            }
            case "top-right": {
              width = Math.max(minW, rs.startW + dxWorld);
              height = Math.max(minH, rs.startH - dyWorld);
              y = rs.startY + (rs.startH - height);
              break;
            }
            case "bottom-left": {
              width = Math.max(minW, rs.startW - dxWorld);
              height = Math.max(minH, rs.startH + dyWorld);
              x = rs.startX + (rs.startW - width);
              break;
            }
            case "bottom-right": {
              width = Math.max(minW, rs.startW + dxWorld);
              height = Math.max(minH, rs.startH + dyWorld);
              break;
            }
          }

          return { ...n, x, y, width, height };
        })
      );
      return;
    }

    // 平移
    if (isPanning && panStart.current) {
      const ps = panStart.current;
      const dx = e.clientX - ps.x;
      const dy = e.clientY - ps.y;
      setViewport((v) => ({
        ...v,
        x: ps.vx + dx,
        y: ps.vy + dy,
      }));
      return;
    }

    // 拖曳節點群 + Smart Guide
    const ds = dragStart.current;
    if (ds && tool === "select") {
      const worldX = (localX - viewport.x) / viewport.scale;
      const worldY = (localY - viewport.y) / viewport.scale;

      let dx = worldX - ds.startWorldX;
      let dy = worldY - ds.startWorldY;
      
      // 只在真正移動時（第一次移動超過閾值）記錄歷史
      if (!ds.historyRecorded && (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1)) {
        recordHistory();
        ds.historyRecorded = true;
      }

      // Snap to Grid：以主節點當基準
      if (snapToGrid) {
        const mainId = primaryId || ds.ids[0];
        const basePos = ds.nodePositions[mainId];
        if (basePos) {
          const newX = basePos.x + dx;
          const newY = basePos.y + dy;
          const snappedX = Math.round(newX / gridSize) * gridSize;
          const snappedY = Math.round(newY / gridSize) * gridSize;
          dx = snappedX - basePos.x;
          dy = snappedY - basePos.y;
        }
      }

      // Smart Guides
      setGuideLines({});
      const movingIds = new Set(ds.ids);
      const mainId = primaryId || ds.ids[0];
      const mainNode = nodes.find((n) => n.id === mainId);
      if (mainNode) {
        const movingCenterX = mainNode.x + mainNode.width / 2 + dx;
        const movingCenterY = mainNode.y + mainNode.height / 2 + dy;

        let bestVX: number | null = null;
        let bestVDiff = Number.POSITIVE_INFINITY;
        let bestHY: number | null = null;
        let bestHDiff = Number.POSITIVE_INFINITY;

        const threshold = 6 / viewport.scale;

        nodes.forEach((n) => {
          if (movingIds.has(n.id)) return;
          const cx = n.x + n.width / 2;
          const cy = n.y + n.height / 2;

          const diffX = Math.abs(cx - movingCenterX);
          if (diffX < threshold && diffX < bestVDiff) {
            bestVDiff = diffX;
            bestVX = cx;
          }

          const diffY = Math.abs(cy - movingCenterY);
          if (diffY < threshold && diffY < bestHDiff) {
            bestHDiff = diffY;
            bestHY = cy;
          }
        });

        if (bestVX !== null) {
          const offsetX = bestVX - movingCenterX;
          dx += offsetX;
          setGuideLines((prev) => ({ ...prev, v: bestVX as number }));
        }

        if (bestHY !== null) {
          const offsetY = bestHY - movingCenterY;
          dy += offsetY;
          setGuideLines((prev) => ({ ...prev, h: bestHY as number }));
        }
      }

      setNodes((prev) =>
        prev.map((n) => {
          if (!ds.ids.includes(n.id)) return n;
          const base = ds.nodePositions[n.id];
          if (!base) return n;
          return {
            ...n,
            x: base.x + dx,
            y: base.y + dy,
          };
        })
      );
      return;
    }
  };

  // ---------- Mouse Up ----------
  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    panStart.current = null;
    
    // 清理拖曳狀態
    if (dragStart.current) {
      dragStart.current = null;
    }
    
    resizeStart.current = null;
    setGuideLines({});

    // 矩形框選結束
    if (selectionRect && containerRef.current) {
      // 如果沒有真正拖曳（只是單擊），則清除選取（AutoCAD 風格）
      if (!isDraggingRef.current && !selectionModeRef.current) {
        setSelectedIds([]);
        setPrimaryId(null);
        setSelectedEdgeId(null);
        setSelectionRect(null);
        mouseDownPosRef.current = null;
        isDraggingRef.current = false;
        return;
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      const { x1, y1, x2, y2 } = selectionRect;
      const rx1 = Math.min(x1, x2);
      const ry1 = Math.min(y1, y2);
      const rx2 = Math.max(x1, x2);
      const ry2 = Math.max(y1, y2);
      
      // AutoCAD 風格：框選方向性
      // 左→右（x2 > x1）：Window Selection（完全包含）
      // 右→左（x2 < x1）：Crossing Selection（相交即選）
      const isWindowSelection = x2 > x1;

      const includedIds: string[] = [];
      nodes.forEach((n) => {
        const sx1 = n.x * viewport.scale + viewport.x;
        const sy1 = n.y * viewport.scale + viewport.y;
        const sx2 = (n.x + n.width) * viewport.scale + viewport.x;
        const sy2 = (n.y + n.height) * viewport.scale + viewport.y;
        
        let intersect = false;
        if (isWindowSelection) {
          // Window Selection：節點必須完全在框內
          intersect = sx1 >= rx1 && sx2 <= rx2 && sy1 >= ry1 && sy2 <= ry2;
        } else {
          // Crossing Selection：節點與框相交即可
          intersect = sx2 >= rx1 && sx1 <= rx2 && sy2 >= ry1 && sy1 <= ry2;
        }
        
        if (intersect) includedIds.push(n.id);
      });

      // 檢查所有邊線是否在選擇範圍內（收集所有符合的邊線）
      const selectedEdges: string[] = [];
      for (const edge of edges) {
        const fromNode = nodes.find((n) => n.id === edge.fromId);
        const toNode = nodes.find((n) => n.id === edge.toId);
        if (!fromNode || !toNode) continue;

        // 計算邊線起點和終點的螢幕座標
        const fx = (fromNode.x + fromNode.width / 2) * viewport.scale + viewport.x;
        const fy = (fromNode.y + fromNode.height / 2) * viewport.scale + viewport.y;
        const tx = (toNode.x + toNode.width / 2) * viewport.scale + viewport.x;
        const ty = (toNode.y + toNode.height / 2) * viewport.scale + viewport.y;

        // 檢查線段是否與選擇矩形相交（使用簡化方法：檢查線段中點或端點）
        const midX = (fx + tx) / 2;
        const midY = (fy + ty) / 2;
        
        const lineInRect = 
          (midX >= rx1 && midX <= rx2 && midY >= ry1 && midY <= ry2) ||
          (fx >= rx1 && fx <= rx2 && fy >= ry1 && fy <= ry2) ||
          (tx >= rx1 && tx <= rx2 && ty >= ry1 && ty <= ry2);

        if (lineInRect) {
          selectedEdges.push(edge.id);
        }
      }

      let newSelected: string[] = [];
      if (selectionModeRef.current === "add") {
        const set = new Set([...selectedIds, ...includedIds]);
        newSelected = Array.from(set);
      } else if (selectionModeRef.current === "subtract") {
        const set = new Set(selectedIds);
        includedIds.forEach((id) => set.delete(id));
        newSelected = Array.from(set);
      } else {
        newSelected = includedIds;
      }

      // 如果選中了邊線且沒有選中節點，將邊線 ID 加入選擇列表
      // 使用特殊前綴 "edge:" 來區分邊線和節點
      if (selectedEdges.length > 0 && newSelected.length === 0) {
        newSelected = selectedEdges.map(id => `edge:${id}`);
        setSelectedIds(newSelected);
        setPrimaryId(newSelected[0] || null);
        setSelectedEdgeId(selectedEdges[0]); // 主要邊線用於 RightPanel 顯示
      } else {
        setSelectedIds(newSelected);
        setPrimaryId(newSelected[0] || null);
        if (newSelected.length > 0) {
          setSelectedEdgeId(null); // 選中節點時清除邊線選擇
        }
      }
      
      setSelectionRect(null);
      mouseDownPosRef.current = null;
      isDraggingRef.current = false;
    }
  };

  // ---------- 滾輪縮放 ----------
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = -e.deltaY;
    const zoomFactor = delta > 0 ? 1.1 : 1 / 1.1;

    setViewport((v) => {
      const newScale = Math.min(3, Math.max(0.2, v.scale * zoomFactor));
      const worldX = (mx - v.x) / v.scale;
      const worldY = (my - v.y) / v.scale;
      const newX = mx - worldX * newScale;
      const newY = my - worldY * newScale;
      return { x: newX, y: newY, scale: newScale };
    });
  };

  // ---------- Fit to Content ----------
  const handleFitToContent = () => {
    if (!containerRef.current || nodes.length === 0) {
      setViewport({ x: 0, y: 0, scale: 1 });
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 80;
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
    const contentWidth = maxX - minX || 1;
    const contentHeight = maxY - minY || 1;
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const scale = Math.max(0.2, Math.min(3, Math.min(scaleX, scaleY)));
    const screenContentWidth = contentWidth * scale;
    const screenContentHeight = contentHeight * scale;
    const offsetX = (rect.width - screenContentWidth) / 2;
    const offsetY = (rect.height - screenContentHeight) / 2;
    const x = offsetX - minX * scale;
    const y = offsetY - minY * scale;
    setViewport({ x, y, scale });
  };

  const handleExportPng = async () => {
    const padding = 80;

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
    const contentWidth = maxX - minX || 1;
    const contentHeight = maxY - minY || 1;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = (rect.width - padding * 2) / contentWidth;
    const scaleY = (rect.height - padding * 2) / contentHeight;
    const scale = Math.max(0.2, Math.min(3, Math.min(scaleX, scaleY)));
    const screenContentWidth = contentWidth * scale;
    const screenContentHeight = contentHeight * scale;
    const offsetX = (rect.width - screenContentWidth) / 2;
    const offsetY = (rect.height - screenContentHeight) / 2;
    const x = offsetX - minX * scale;
    const y = offsetY - minY * scale;
    const oldViewport = viewport;
    const newViewport: Viewport = { x, y, scale };
    setViewport(newViewport);

    setTimeout(async () => {
      try {
        if (!containerRef.current) return;
        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: "#e5e7eb",
          scale: 2,
        });
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        const safeName =
          projectName && projectName.trim().length > 0
            ? projectName.trim()
            : "InduMap";
        a.href = url;
        a.download = `${safeName}.png`;
        a.click();
      } finally {
        setViewport(oldViewport);
      }
    }, 200);
  };

  // ---------- 匯出 .lmwb（多頁面） ----------
  const handleExportLmwb = async (isSaveAs: boolean) => {
    try {
      const zip = new JSZip();

      const pagesForSave: Page[] = pages.map((p) =>
        p.id === activePageId
          ? {
              ...p,
              nodes: JSON.parse(JSON.stringify(nodes)),
              edges: JSON.parse(JSON.stringify(edges)),
              viewport: { ...viewport },
            }
          : p
      );

      const project: ProjectFileV2 = {
        version: 2,
        projectName,
        activePageId,
        pages: pagesForSave,
      };

      // 為 image node 指定 imageFile 路徑
      const imageDir = "images";
      project.pages.forEach((page, pi) => {
        page.nodes.forEach((n, idx) => {
          if (n.type === "image") {
            n.imageFile =
              n.imageFile || `${imageDir}/p${pi}_img_${idx}_${n.id}.png`;
          }
        });
      });

      zip.file("project.json", JSON.stringify(project, null, 2));

      // 所有圖片塞進 ZIP
      const imgTasks: Promise<void>[] = [];
      project.pages.forEach((page) => {
        page.nodes.forEach((n) => {
          if (n.type === "image" && n.imageFile && n.imageUrl) {
            const fileName = n.imageFile as string;
            const url = n.imageUrl as string;
            if (url.startsWith("data:")) {
              const base64 = url.split(",")[1];
              zip.file(fileName, base64, { base64: true });
            } else {
              const task = fetch(url)
                .then((res) => res.blob())
                .then((blob) => blob.arrayBuffer())
                .then((buf) => {
                  zip.file(fileName, buf);
                })
                .catch(() => {
                  // ignore fetch error
                });
              imgTasks.push(task);
            }
          }
        });
      });

      await Promise.all(imgTasks);
      const blob = await zip.generateAsync({ type: "blob" });

      const a = document.createElement("a");
      
      // 改善：Save 覆蓋現有檔案，Save As 建新檔
      let fileName: string;
      if (!isSaveAs && currentFileName && currentFileName.endsWith('.lmwb')) {
        // Save：使用現有檔名
        fileName = currentFileName;
      } else {
        // Save As 或第一次儲存：詢問檔名
        const baseName = projectName && projectName.trim().length > 0
          ? projectName.trim()
          : "InduMap";
        fileName = `${baseName}.lmwb`;
      }
      
      setCurrentFileName(fileName);

      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(a.href);
      
      // 成功提示
      if (!isSaveAs && currentFileName) {
        console.log(`已覆蓋保存：${fileName}`);
      } else {
        console.log(`已另存新檔：${fileName}`);
      }
    } catch (err) {
      console.error(err);
      alert(".lmwb 匯出失敗");
    }
  };

  // ---------- 匯入 .lmwb / JSON（多頁相容） ----------
  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "lmwb") {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const zip = await JSZip.loadAsync(reader.result as ArrayBuffer);
          const projectEntry = zip.file("project.json");
          if (!projectEntry) {
            alert("此 .lmwb 檔缺少 project.json");
            return;
          }
          const text = await projectEntry.async("text");
          const parsed = JSON.parse(text);

          if (parsed && Array.isArray(parsed.pages)) {
            // 新版 v2 結構
            const proj = parsed as ProjectFileV2;
            const restoredPages: Page[] = [];
            for (const page of proj.pages || []) {
              const restoredNodes: Node[] = [];
              for (const n of page.nodes || []) {
                const nodeCopy: Node = { ...n };
                if (
                  nodeCopy.type === "image" &&
                  nodeCopy.imageFile &&
                  !nodeCopy.imageUrl
                ) {
                  const fileObj = zip.file(nodeCopy.imageFile);
                  if (fileObj) {
                    const base64 = await fileObj.async("base64");
                    nodeCopy.imageUrl = `data:image/png;base64,${base64}`;
                  }
                }
                restoredNodes.push(nodeCopy);
              }

              restoredPages.push({
                id: page.id || createId(),
                name: page.name || "Untitled Page",
                nodes: restoredNodes,
                edges: page.edges || [],
                viewport: page.viewport || { x: 0, y: 0, scale: 1 },
              });
            }

            setPages(restoredPages);
            const activeId =
              proj.activePageId ||
              restoredPages[0]?.id ||
              null;
            setActivePageId(activeId);
            const activePage =
              restoredPages.find((p) => p.id === activeId) ||
              restoredPages[0];

            if (activePage) {
              recordHistory();
              setNodes(activePage.nodes || []);
              setEdges(activePage.edges || []);
              setViewport(
                activePage.viewport || { x: 0, y: 0, scale: 1 }
              );
            } else {
              setNodes([]);
              setEdges([]);
              setViewport({ x: 0, y: 0, scale: 1 });
            }

            setProjectName(
              proj.projectName || file.name.replace(/\.lmwb$/i, "")
            );
            setCurrentFileName(file.name);
            setSelectedIds([]);
            setPrimaryId(null);
            setEditingId(null);
            alert("已從 .lmwb 專案檔匯入（多頁＋圖片）");
          } else if (parsed && Array.isArray(parsed.nodes)) {
            // 舊版 BoardState
            const legacy = parsed as BoardState;
            const defaultPageId = createId();
            const page: Page = {
              id: defaultPageId,
              name: "Page 1",
              nodes: legacy.nodes || [],
              edges: legacy.edges || [],
              viewport:
                legacy.viewport || { x: 0, y: 0, scale: 1 },
            };
            setPages([page]);
            setActivePageId(defaultPageId);
            setNodes(page.nodes || []);
            setEdges(page.edges);
            setViewport(page.viewport);
            setProjectName(
              legacy.projectName || file.name.replace(/\.lmwb$/i, "")
            );
            setCurrentFileName(file.name);
            setSelectedIds([]);
            setPrimaryId(null);
            setEditingId(null);
            alert("已匯入舊版 .lmwb（單一頁面）");
          } else {
            alert("project.json 格式錯誤，無法匯入");
          }
        } catch (err) {
          console.error(err);
          alert(".lmwb 匯入失敗：檔案內容錯誤或已損毀");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // 舊版 JSON
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.pages)) {
            const proj = parsed as ProjectFileV2;
            setPages(proj.pages || []);
            const activeId =
              proj.activePageId ||
              proj.pages?.[0]?.id ||
              null;
            setActivePageId(activeId);
            const activePage =
              proj.pages?.find((p) => p.id === activeId) ||
              proj.pages?.[0];

            if (activePage) {
              setNodes(activePage.nodes || []);
              setEdges(activePage.edges || []);
              setViewport(
                activePage.viewport || { x: 0, y: 0, scale: 1 }
              );
            } else {
              setNodes([]);
              setEdges([]);
              setViewport({ x: 0, y: 0, scale: 1 });
            }

            setProjectName(
              proj.projectName || "未命名專案"
            );
            setCurrentFileName(file.name.replace(/\.(json)$/i, "") + ".lmwb");
          } else if (parsed && Array.isArray(parsed.nodes)) {
            const legacy = parsed as BoardState;
            const defaultPageId = createId();
            const page: Page = {
              id: defaultPageId,
              name: "Page 1",
              nodes: legacy.nodes || [],
              edges: legacy.edges || [],
              viewport:
                legacy.viewport || { x: 0, y: 0, scale: 1 },
            };
            setPages([page]);
            setActivePageId(defaultPageId);
            setNodes(page.nodes || []);
            setEdges(page.edges);
            setViewport(page.viewport);
            setProjectName(
              legacy.projectName || "未命名專案"
            );
            setCurrentFileName(
              file.name.replace(/\.(json)$/i, "") + ".lmwb"
            );
            alert("已從 JSON 匯入（單一頁面），建議改用 .lmwb 以保存圖片");
          } else {
            alert("匯入失敗：檔案內容不是有效 JSON");
          }
        } catch {
          alert("匯入失敗：檔案內容不是有效 JSON");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  // ---------- 屬性面板操作 ----------
  const selectedNodes = (nodes || []).filter((n) => selectedIds.includes(n.id));
  const selectedNode = selectedNodes[0] || null;

  const updateSelectedNode = (partial: Partial<Node>) => {
    if (!selectedNode) return;
    recordHistory();
    const ids = selectedIds.length ? selectedIds : [selectedNode.id];
    setNodes((prev) =>
      prev.map((n) =>
        ids.includes(n.id) ? { ...n, ...partial } : n
      )
    );
  };

const openCropModalForSelected = () => {
  if (!selectedNode || selectedNode.type !== "image" || selectedNode.locked) return;
  if (!selectedNode.imageUrl) return;
  setCropTargetId(selectedNode.id);
  // 若沒有裁切，就先給一個預設框（置中 80%）
  const c = selectedNode.imageCrop;
  if (c) {
    setDraftCrop({ ...c });
  } else {
    setDraftCrop({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  }
  setCropModalOpen(true);
};

const resetCropForSelected = () => {
  if (!selectedNode || selectedNode.type !== "image") return;
  updateSelectedNode({ imageCrop: undefined });
};

const applyDraftCrop = () => {
  if (!cropTargetId) return;
  const c = draftCrop;
  // 全圖視為未裁切
  const isFull =
    !c ||
    (Math.abs(c.x) < 1e-6 &&
      Math.abs(c.y) < 1e-6 &&
      Math.abs(c.w - 1) < 1e-6 &&
      Math.abs(c.h - 1) < 1e-6);

  setNodes((prev) =>
    prev.map((n) =>
      n.id === cropTargetId
        ? { ...n, imageCrop: isFull ? undefined : c! }
        : n
    )
  );
  recordHistory();
  setCropModalOpen(false);
  setCropTargetId(null);
  setDraftCrop(null);
};

const closeCropModal = () => {
  setCropModalOpen(false);
  setCropTargetId(null);
  setDraftCrop(null);
};



  const deleteSelectedNode = () => {
    if (!selectedIds.length) return;
    recordHistory();
    setNodes((prev) =>
      prev.filter((n) => !selectedIds.includes(n.id))
    );
    setEdges((prev) =>
      prev.filter(
        (e) =>
          !selectedIds.includes(e.fromId) &&
          !selectedIds.includes(e.toId)
      )
    );
    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);
  };

  // ---------- Copy / Paste ----------
  const copySelectedNode = () => {
    if (!selectedNodes.length) return;
    clipboardRef.current = JSON.parse(JSON.stringify(selectedNodes));
  };

  const pasteNodeFromClipboard = () => {
    const data = clipboardRef.current;
    if (!data || !data.length) return;
    recordHistory();
    const cloned: Node[] = data.map((orig) => ({
      ...JSON.parse(JSON.stringify(orig)),
      id: createId(),
      x: orig.x + 30,
      y: orig.y + 30,
    }));
    setNodes((prev) => [...prev, ...cloned]);
    const ids = cloned.map((n) => n.id);
    setSelectedIds(ids);
    setPrimaryId(ids[0] || null);
    setEditingId(null);
  };

  // ---------- 對齊 / 分佈 / 同寬高 ----------
  const alignSelected = (
    mode:
      | "left"
      | "right"
      | "top"
      | "bottom"
      | "centerX"
      | "centerY"
  ) => {
    if (selectedIds.length < 2) return;
    recordHistory();
    setNodes((prev) => {
      const selected = prev.filter((n) => selectedIds.includes(n.id));
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      selected.forEach((n) => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x + n.width);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y + n.height);
      });
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      return prev.map((n) => {
        if (!selectedIds.includes(n.id)) return n;
        switch (mode) {
          case "left":
            return { ...n, x: minX };
          case "right":
            return { ...n, x: maxX - n.width };
          case "top":
            return { ...n, y: minY };
          case "bottom":
            return { ...n, y: maxY - n.height };
          case "centerX": {
            const cx = centerX;
            return { ...n, x: cx - n.width / 2 };
          }
          case "centerY": {
            const cy = centerY;
            return { ...n, y: cy - n.height / 2 };
          }
        }
      });
    });
  };

  const distributeSelected = (direction: "horizontal" | "vertical") => {
    if (selectedIds.length < 3) return;
    recordHistory();
    setNodes((prev) => {
      const selected = prev
        .filter((n) => selectedIds.includes(n.id))
        .sort((a, b) =>
          direction === "horizontal" ? a.x - b.x : a.y - b.y
        );
      if (selected.length < 3) return prev;
      const first = selected[0];
      const last = selected[selected.length - 1];

      if (direction === "horizontal") {
        const firstCenter = first.x + first.width / 2;
        const lastCenter = last.x + last.width / 2;
        const step =
          (lastCenter - firstCenter) / (selected.length - 1);
        return prev.map((n) => {
          const idx = selected.findIndex((s) => s.id === n.id);
          if (idx === -1) return n;
          if (idx === 0 || idx === selected.length - 1) return n;
          const cx = firstCenter + step * idx;
          return { ...n, x: cx - n.width / 2 };
        });
      } else {
        const firstCenter = first.y + first.height / 2;
        const lastCenter = last.y + last.height / 2;
        const step =
          (lastCenter - firstCenter) / (selected.length - 1);
        return prev.map((n) => {
          const idx = selected.findIndex((s) => s.id === n.id);
          if (idx === -1) return n;
          if (idx === 0 || idx === selected.length - 1) return n;
          const cy = firstCenter + step * idx;
          return { ...n, y: cy - n.height / 2 };
        });
      }
    });
  };

  const matchSizeSelected = (mode: "width" | "height" | "both") => {
    if (selectedIds.length < 2) return;
    const baseId = primaryId || selectedIds[0];
    const base = nodes.find((n) => n.id === baseId);
    if (!base) return;
    recordHistory();
    setNodes((prev) =>
      prev.map((n) => {
        if (!selectedIds.includes(n.id) || n.id === baseId) return n;
        if (mode === "width") return { ...n, width: base.width };
        if (mode === "height") return { ...n, height: base.height };
        return { ...n, width: base.width, height: base.height };
      })
    );
  };

  // ---------- 群組 ----------
  const createGroupForSelected = () => {
    if (selectedIds.length < 2) return;
    const gid = createId();
    recordHistory();
    setNodes((prev) =>
      prev.map((n) =>
        selectedIds.includes(n.id) ? { ...n, groupId: gid } : n
      )
    );
  };

  const ungroupSelected = () => {
    if (!selectedIds.length) return;
    recordHistory();
    setNodes((prev) =>
      prev.map((n) =>
        selectedIds.includes(n.id) ? { ...n, groupId: undefined } : n
      )
    );
  };

  // ---------- Keyboard Shortcut ----------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName;
      const isEditingInput =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (active && active.isContentEditable);

      const key = e.key.toLowerCase();

      // Esc：關閉複製格式與編輯
      if (key === "escape") {
        if (formatPainterActive) {
          setFormatPainterActive(false);
          formatSourceIdRef.current = null;
        }
        setEditingId(null);
        return;
      }

      if (
        isEditingInput &&
        (key === "c" || key === "v" || key === "z" || key === "y")
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.code === "Space") {
        if (!spacePressedRef.current) {
          spacePressedRef.current = true;
        }
      }

      if ((e.ctrlKey || e.metaKey) && key === "c") {
        e.preventDefault();
        copySelectedNode();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === "v") {
        if (clipboardRef.current) {
          e.preventDefault();
          pasteNodeFromClipboard();
          return;
        }
      }

      if ((e.ctrlKey || e.metaKey) && key === "a") {
        e.preventDefault();
        const allIds = (nodes || []).map((n) => n.id);
        setSelectedIds(allIds);
        setPrimaryId(allIds[0] || null);
        return;
      }

      if (e.key === "delete" || e.key === "backspace") {
        if (isEditingInput) return;
        e.preventDefault();
        deleteSelectedNode();
        return;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spacePressedRef.current = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [nodes, edges, viewport, selectedIds, projectName, formatPainterActive]);

  const worldStyle = {
    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
    transformOrigin: "top left",
  } as React.CSSProperties;

  // client -> world 座標（用於拖曳連線 / 命中測試）
  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (clientX - rect.left - viewport.x) / viewport.scale;
    const y = (clientY - rect.top - viewport.y) / viewport.scale;
    return { x, y };
  };

  // ---------- 多頁面操作 ----------
  const handleAddPage = () => {
    // 先保存當前頁面的狀態
    if (activePageId) {
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId
            ? {
                ...p,
                nodes: JSON.parse(JSON.stringify(nodes)),
                edges: JSON.parse(JSON.stringify(edges)),
                viewport: { ...viewport },
              }
            : p
        )
      );
    }
    
    const id = createId();
    const newPage: Page = {
      id,
      name: `Page ${pages.length + 1}`,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, scale: 1 },
    };
    setPages((prev) => [...prev, newPage]);
    setActivePageId(id);
    // 切換到新頁面狀態
    setNodes([]);
    setEdges([]);
    setViewport({ x: 0, y: 0, scale: 1 });
    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);
  };

  const handleDuplicatePage = () => {
    if (!activePageId) return;
    const currentPage = pages.find((p) => p.id === activePageId);
    if (!currentPage) return;
    const id = createId();
    const clone: Page = {
      id,
      name: `${currentPage.name} - copy`,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      viewport: { ...viewport },
    };
    setPages((prev) => [...prev, clone]);
    setActivePageId(id);
    setNodes(clone.nodes);
    setEdges(clone.edges);
    setViewport(clone.viewport);
    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);
  };

  const handleRenamePage = () => {
    if (!activePageId) return;
    const currentPage = pages.find((p) => p.id === activePageId);
    if (!currentPage) return;
    
    const newName = window.prompt("重新命名頁面：", currentPage.name);
    if (newName && newName.trim()) {
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageId ? { ...p, name: newName.trim() } : p
        )
      );
    }
  };

  const handleDeletePage = () => {
    if (!activePageId) return;
    if (pages.length <= 1) {
      alert("至少要保留一個頁面");
      return;
    }
    const idx = pages.findIndex((p) => p.id === activePageId);
    if (idx === -1) return;
    const sure = window.confirm("確定要刪除此頁面嗎？");
    if (!sure) return;

    const newPages = pages.filter((p) => p.id !== activePageId);
    const newActive =
      newPages[idx] || newPages[idx - 1] || newPages[0] || null;
    setPages(newPages);
    setActivePageId(newActive ? newActive.id : null);

    if (newActive) {
      setNodes(newActive.nodes || []);
      setEdges(newActive.edges || []);
      setViewport(newActive.viewport || { x: 0, y: 0, scale: 1 });
    } else {
      setNodes([]);
      setEdges([]);
      setViewport({ x: 0, y: 0, scale: 1 });
    }

    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);
  };

  const handleSwitchPage = (pageId: string) => {
    if (pageId === activePageId) return;
    const updatedPages: Page[] = pages.map((p) =>
      p.id === activePageId
        ? {
            ...p,
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
            viewport: { ...viewport },
          }
        : p
    );
    const target = updatedPages.find((p) => p.id === pageId);
    setPages(updatedPages);
    setActivePageId(pageId);
    if (target) {
      setNodes(target.nodes || []);
      setEdges(target.edges || []);
      setViewport(target.viewport || { x: 0, y: 0, scale: 1 });
    }
    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);
  };

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  // 初始化：確保至少有一個頁面
  useEffect(() => {
    if (pages.length === 0) {
      const defaultPageId = createId();
      const defaultPage: Page = {
        id: defaultPageId,
        name: "Page 1",
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, scale: 1 },
      };
      setPages([defaultPage]);
      setActivePageId(defaultPageId);
    }
  }, []);

  // Demo: create AI robot project if ?demo=ai_robot
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "ai_robot") {
        createAiRobotDemo();
        // remove param to avoid recreating on refresh
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {
      // ignore server-side rendering or other errors
    }
  }, []);

  // ========== 自動載入專案 ==========
  useLoadProjectFromStorage({
    setPages,
    setActivePageId,
    setNodes,
    setEdges,
    setViewport,
    setProjectName,
  });

  // ========== 自動保存專案 ==========
  useAutoSaveProjectToStorage({
    nodes,
    edges,
    viewport,
    projectName,
    pages,
    activePageId,
    debounceMs: 400,
  });

  const createAiRobotDemo = () => {
    const pageId = createId();
    const n1 = {
      id: createId(),
      type: "category",
      x: 100,
      y: 80,
      width: 300,
      height: 160,
      text: "機器人核心系統",
      bgColor: "#e0f2fe",
      fontSize: 16,
      level: "L1",
    } as Node;
    const n2 = {
      id: createId(),
      type: "category",
      x: 460,
      y: 80,
      width: 260,
      height: 120,
      text: "感測器 / Edge",
      bgColor: "#dcfce7",
      fontSize: 14,
      level: "L2",
    } as Node;
    const n3 = {
      id: createId(),
      type: "category",
      x: 100,
      y: 260,
      width: 260,
      height: 120,
      text: "雲端 / 平台",
      bgColor: "#ede9fe",
      fontSize: 14,
      level: "L2",
    } as Node;
    const n4 = {
      id: createId(),
      type: "note",
      x: 460,
      y: 260,
      width: 220,
      height: 90,
      text: "Actuators & Control",
      bgColor: "#fee2e2",
      fontSize: 12,
      level: "Info",
    } as Node;

    const demoNodes: Node[] = [n1, n2, n3, n4];

    const page: Page = {
      id: pageId,
      name: "AI 機器人產業圖譜",
      nodes: demoNodes,
      edges: [],
      viewport: { x: 0, y: 0, scale: 1 },
    };

    recordHistory();
    setPages([page]);
    setActivePageId(pageId);
    setNodes(demoNodes);
    setEdges([]);
    setViewport({ x: 0, y: 0, scale: 0.95 });
    setProjectName("AI 機器人產業圖譜");
    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);

    // add extra nodes directly (image + table)
    const n5: Node = {
      id: createId(),
      type: "image",
      x: 320,
      y: 120,
      width: 160,
      height: 120,
      imageUrl: undefined,
    } as Node;
    const n6: Node = {
      id: createId(),
      type: "table",
      x: 520,
      y: 320,
      width: 240,
      height: 160,
      table: { rows: 3, cols: 3, cells: Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => "")) },
    } as Node;

    demoNodes.push(n5, n6);

    setNodes(demoNodes);
    setTimeout(() => {
      // create edges from main node to the new ones
      setEdges((prev) => [
        ...prev,
        { id: createId(), fromId: demoNodes[0].id, toId: n5.id, relation: "drives" as any },
        { id: createId(), fromId: demoNodes[0].id, toId: n6.id, relation: "drives" as any },
      ]);
      handleFitToContent();
    }, 100);

    console.log("Demo created with nodes:", demoNodes.map((d) => d.id));
  };

  

  // ---------- 左側 Outline 列表 ----------
  const outlineItems = (nodes || [])
    .slice()
    .sort((a, b) => {
      const la = a.level || "Info";
      const lb = b.level || "Info";
      if (la === lb) return (a.text || "").localeCompare(b.text || "");
      const order: StrategyLevel[] = ["L1", "L2", "L3", "Info"];
      return order.indexOf(la) - order.indexOf(lb);
    });

  return (
    <div
      className="flex h-screen w-full flex-col bg-slate-200 text-slate-900"
      style={{ overscrollBehavior: "none" }}
    >
      {/* 頂部工具列 */}
      <header className="border-b border-slate-300 bg-slate-50">
        <div className="flex items-center justify-between px-3 py-2 text-[13px]">
          <div className="flex items-center gap-3">
            <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
              產業圖譜白板
            </span>
            <input
              className="w-64 rounded border border-slate-300 px-2 py-1 text-[12px]"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="輸入專案名稱，例如：AI 產業鏈策略圖"
            />
            <span className="text-[11px] text-slate-400">
              檔名：{currentFileName || "(尚未儲存為 .lmwb)"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[12px]">
            <button
              className={`rounded px-2 py-1 ${
                activeToolbar === "file"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-800 border border-slate-300"
              }`}
              onClick={() =>
                setActiveToolbar((prev) =>
                  prev === "file" ? "none" : "file"
                )
              }
            >
              File
            </button>
            <button
              className={`rounded px-2 py-1 ${
                activeToolbar === "view"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-800 border border-slate-300"
              }`}
              onClick={() =>
                setActiveToolbar((prev) =>
                  prev === "view" ? "none" : "view"
                )
              }
            >
              View
            </button>
            <button
              className={`rounded px-2 py-1 ${
                activeToolbar === "insert"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-800 border border-slate-300"
              }`}
              onClick={() =>
                setActiveToolbar((prev) =>
                  prev === "insert" ? "none" : "insert"
                )
              }
            >
              Insert
            </button>
            <button
              className={`rounded px-2 py-1 ${
                activeToolbar === "arrange"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-800 border border-slate-300"
              }`}
              onClick={() =>
                setActiveToolbar((prev) =>
                  prev === "arrange" ? "none" : "arrange"
                )
              }
            >
              Arrange
            </button>
            <button
              className={`rounded px-2 py-1 ${
                activeToolbar === "strategy"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-800 border border-slate-300"
              }`}
              onClick={() =>
                setActiveToolbar((prev) =>
                  prev === "strategy" ? "none" : "strategy"
                )
              }
            >
              Strategy
            </button>
            <button
              className={`rounded px-2 py-1 ${
                activeToolbar === "help"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-800 border border-slate-300"
              }`}
              onClick={() =>
                setActiveToolbar((prev) =>
                  prev === "help" ? "none" : "help"
                )
              }
            >
              Help
            </button>
          </div>
        </div>

        {/* 第二層工具內容 */}
        {activeToolbar !== "none" && (
          <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[12px]">
            {activeToolbar === "file" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => {
                    try {
                      const pagesForSave: Page[] = pages.map((p) =>
                        p.id === activePageId
                          ? {
                              ...p,
                              nodes: JSON.parse(JSON.stringify(nodes)),
                              edges: JSON.parse(JSON.stringify(edges)),
                              viewport: { ...viewport },
                            }
                          : p
                      );
                      const data: ProjectFileV2 = {
                        version: 2,
                        projectName,
                        activePageId,
                        pages: pagesForSave,
                      };
                      window.localStorage.setItem(
                        STORAGE_KEY,
                        JSON.stringify(data)
                      );
                      alert("已儲存到瀏覽器（此電腦最近專案）");
                    } catch {
                      alert("儲存失敗（瀏覽器限制）");
                    }
                  }}
                >
                  Save to Browser
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => {
                    try {
                      const raw =
                        window.localStorage.getItem(STORAGE_KEY);
                      if (!raw) {
                        alert("尚未有儲存的圖譜資料");
                        return;
                      }
                      const parsed = JSON.parse(raw);
                      if (parsed && Array.isArray(parsed.pages)) {
                        const proj = parsed as ProjectFileV2;
                        setProjectName(
                          proj.projectName ||
                            "InduMap"
                        );
                        setPages(proj.pages || []);
                        const activeId =
                          proj.activePageId ||
                          proj.pages?.[0]?.id ||
                          null;
                        setActivePageId(activeId);
                        const activePage =
                          proj.pages?.find((p) => p.id === activeId) ||
                          proj.pages?.[0];
                        if (activePage) {
                          setNodes(activePage.nodes || []);
                          setEdges(activePage.edges || []);
                          setViewport(
                            activePage.viewport || {
                              x: 0,
                              y: 0,
                              scale: 1,
                            }
                          );
                        } else {
                          setNodes([]);
                          setEdges([]);
                          setViewport({
                            x: 0,
                            y: 0,
                            scale: 1,
                          });
                        }
                        setSelectedIds([]);
                        setPrimaryId(null);
                        setEditingId(null);
                        alert("已開啟最近專案（此電腦）");
                      } else {
                        alert("載入失敗（資料格式錯誤）");
                      }
                    } catch {
                      alert("載入失敗（資料格式錯誤）");
                    }
                  }}
                >
                  Open from Browser
                </button>
                <span className="mx-1 text-slate-400">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={handleExportPng}
                >
                  Export PNG
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => handleExportLmwb(false)}
                >
                  Save (.lmwb)
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => handleExportLmwb(true)}
                >
                  Save As (.lmwb)
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => importFileRef.current?.click()}
                >
                  Import .lmwb / JSON
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".lmwb,.json,application/json"
                  className="hidden"
                  onChange={handleImportChange}
                />
              </div>
            )}

            {activeToolbar === "view" && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() =>
                    setViewport((v) => ({
                      ...v,
                      scale: Math.min(3, v.scale * 1.2),
                    }))
                  }
                >
                  Zoom +
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() =>
                    setViewport((v) => ({
                      ...v,
                      scale: Math.max(0.2, v.scale / 1.2),
                    }))
                  }
                >
                  Zoom -
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
                >
                  100%
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={handleFitToContent}
                >
                  Fit to Content
                </button>
                <span className="mx-1 text-slate-400">|</span>
                <label className="flex items-center gap-1 text-[12px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                  />
                  Snap to Grid ({gridSize}px)
                </label>
                <span className="mx-1 text-slate-400">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => setShowLeftPanel((v) => !v)}
                >
                  {showLeftPanel ? "Hide Left Panel" : "Show Left Panel"}
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => setShowRightPanel((v) => !v)}
                >
                  {showRightPanel ? "Hide Right Panel" : "Show Right Panel"}
                </button>
              </div>
            )}

            {activeToolbar === "insert" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">新增節點：</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("category")}
                >
                  分類節點
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("note")}
                >
                  便利貼
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("text")}
                >
                  文字
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("image")}
                >
                  圖片（拖曳 / 貼上）
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("table")}
                >
                  表格（預設 3×3）
                </button>
                <button
                  className="rounded border border-blue-400 bg-blue-50 px-2 py-1 text-blue-700"
                  onClick={() => addNodeAtCenter("group")}
                >
                  📦 群組容器
                </button>
                <span className="mx-1 text-slate-300">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("title")}
                >
                  標題
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("icon")}
                >
                  圖示
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("milestone")}
                >
                  里程碑
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("kpi")}
                >
                  KPI 卡
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("owner")}
                >
                  負責人
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("link")}
                >
                  連結
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("tag")}
                >
                  標籤
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("callout")}
                >
                  註解
                </button>
                <span className="mx-1 text-slate-300">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("flow-process")}
                >
                  流程：處理
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("flow-decision")}
                >
                  流程：判斷
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => addNodeAtCenter("flow-terminator")}
                >
                  流程：開始/結束
                </button>
              </div>
            )}

            {activeToolbar === "arrange" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">排列：</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => alignSelected("left")}
                >
                  左對齊
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => alignSelected("centerX")}
                >
                  水平置中
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => alignSelected("right")}
                >
                  右對齊
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => alignSelected("top")}
                >
                  上對齊
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => alignSelected("centerY")}
                >
                  垂直置中
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => alignSelected("bottom")}
                >
                  下對齊
                </button>
                <span className="mx-1 text-slate-400">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => distributeSelected("horizontal")}
                >
                  水平平均分佈
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => distributeSelected("vertical")}
                >
                  垂直平均分佈
                </button>
                <span className="mx-1 text-slate-400">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => matchSizeSelected("width")}
                >
                  同寬
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => matchSizeSelected("height")}
                >
                  同高
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => matchSizeSelected("both")}
                >
                  同寬高
                </button>
                <span className="mx-1 text-slate-400">|</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={createGroupForSelected}
                  disabled={selectedIds.length < 2}
                >
                  建立群組
                </button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={ungroupSelected}
                >
                  解散群組
                </button>
              </div>
            )}

            {activeToolbar === "strategy" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500">策略範本：</span>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => {
                    recordHistory();
                    setNodes(templateNodes);
                    setEdges([]);
                    setViewport({ x: 0, y: 0, scale: 1 });
                    setSelectedIds([]);
                    setPrimaryId(null);
                    setEditingId(null);
                  }}
                >
                  AI 產業鏈範本
                </button>

                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => {
                    recordHistory();
                    setNodes(adasTemplateNodes);
                    setEdges(adasTemplateEdges);
                    setViewport({ x: 0, y: 0, scale: 1 });
                    setSelectedIds([]);
                    setPrimaryId(null);
                    setEditingId(null);
                  }}
                >
                  ADAS on Android 範例
                </button>

<button
  className="rounded border border-slate-300 bg-white px-2 py-1 opacity-50 cursor-not-allowed"
  disabled
>
  無人機產業圖譜範本（不可用）
</button>

<button
  className="rounded border border-slate-300 bg-white px-2 py-1"
  onClick={() => {
    recordHistory();
    setNodes(robotTemplateNodes as Node[]);
    setEdges(robotTemplateEdges);
    setViewport({ x: 0, y: 0, scale: 0.95 });
    setSelectedIds([]);
    setPrimaryId(null);
    setEditingId(null);
  }}
>
  機器人產業圖譜範本
</button>
                <button
                  className="rounded border border-slate-300 bg-white px-2 py-1"
                  onClick={() => {
                    recordHistory();
                    setNodes([]);
                    setEdges([]);
                    setViewport({ x: 0, y: 0, scale: 1 });
                    setSelectedIds([]);
                    setPrimaryId(null);
                    setEditingId(null);
                  }}
                >
                  空白策略畫布
                </button>
                <span className="mx-1 text-slate-400">|</span>
                <span className="text-slate-500">
                  之後可加入 SWOT / Roadmap / 商務模式 Canvas…
                </span>
              </div>
            )}

            {activeToolbar === "help" && (
              <div className="space-y-1 text-[12px] text-slate-600">
                <div>● 滑鼠左鍵拖曳空白區域：矩形框選節點</div>
                <div>● 按住 Space 或中鍵拖曳：平移畫面</div>
                <div>● Ctrl/⌘ + C / V：複製 / 貼上節點</div>
                <div>● Ctrl/⌘ + Z / Shift+Z / Y：Undo / Redo</div>
                <div>● 拖曳圖片檔或從剪貼簿貼上：建立圖片節點</div>
                <div>● 右側屬性面板可設定策略層級 / 類別 / Impact / Effort</div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* 主體區域：左側面板 + 畫布 + 右側屬性 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左側：專案 / 範本 / 大綱（拆分至 components/pageParts/LeftPanel.tsx） */}
        <LeftPanel
          ctx={{
            showLeftPanel,
            leftTab,
            setLeftTab,
            pages,
            activePageId,
            projectName,
            setProjectName,
            nodes,
            selectedIds,
            setPages,
            handleAddPage,
            handleDuplicatePage,
            handleRenamePage,
            handleDeletePage,
            handleSwitchPage,
            tool,
            handleToolClick,
            handleUndo,
            handleRedo,
            copySelectedNode,
            pasteNodeFromClipboard,
            templateNodes,
            adasTemplateNodes,
            adasTemplateEdges,
            setNodes,
            setEdges,
            setViewport,
            setSelectedIds,
            setPrimaryId,
            setEditingId,
          }}
        />

        {/* 中間畫布（已抽出至 components/pageParts/CanvasArea.tsx） */}
        <CanvasArea
          ctx={{
            containerRef,
            canvasRef,
            worldStyle,
            nodes,
            edges,
            setEdges,
            connectingFrom,
            connectingTo,
            guideLines,
            viewport,
            selectionRect,
            selectedIds,
            selectedEdgeId,
            setSelectedIds,
            setPrimaryId,
            handleCanvasMouseDown,
            handleCanvasMouseMove,
            handleCanvasMouseUp,
            handleWheel,
            handleDragOver,
            handleDrop,
            editingId,
            tool,
            handleNodeMouseDown,
            handleNodeClick,
            handleEdgeClick,
            handleResizeHandleMouseDown,
            handleDoubleClickNode,
            handleInlineTextChange,
            handleFinishEditing,
            handleTableCellChange,
            strokes,
            setStrokes,
            penColor,
            setPenColor,
            penWidth,
            setPenWidth,
            penOpacity,
            setPenOpacity,
          }}
        />
        {/* 右側屬性面板（拆分至 components/pageParts/RightPanel.tsx） */}
        <RightPanel
          ctx={{
            showRightPanel,
            selectedNode,
            selectedIds,
            selectedEdgeId,
            edges,
            deleteSelectedNode,
            deleteEdge,
            updateEdge,
            formatPainterActive,
            setFormatPainterActive,
            formatSourceIdRef,
            updateSelectedNode,
            openCropModalForSelected,
            resetCropForSelected,
            updateTableSize,
            tool,
            penColor,
            setPenColor,
            penWidth,
            setPenWidth,
            penOpacity,
            setPenOpacity,
            setStrokes,
          }}
        />

        {cropModalOpen && (
          <CropModal
            cropTargetId={cropTargetId}
            nodes={nodes}
            draftCrop={draftCrop}
            setDraftCrop={setDraftCrop}
            cropImgBoxRef={cropImgBoxRef}
            closeCropModal={closeCropModal}
            applyDraftCrop={applyDraftCrop}
          />
        )}

        {/* AI 助手 */}
        <AIAssistant
          onGraphGenerated={(graphData) => {
            // 處理 AI 生成的圖譜
            try {
              if (graphData.nodes && Array.isArray(graphData.nodes)) {
                const newNodes: Node[] = graphData.nodes.map((n: any) => ({
                  id: n.id || createId(),
                  x: Math.random() * 2000,
                  y: Math.random() * 2000,
                  width: 120,
                  height: 60,
                  text: n.label || n.name || '',
                  type: (n.type as NodeType) || 'process',
                  color: '#60a5fa',
                  icon: undefined,
                  imageCrop: undefined,
                  data: { description: n.description },
                }));
                setNodes(newNodes);
              }
              if (graphData.edges && Array.isArray(graphData.edges)) {
                const newEdges: Edge[] = graphData.edges.map((e: any) => ({
                  id: createId(),
                  from: e.from || e.fromId || '',
                  to: e.to || e.toId || '',
                  label: e.label || '',
                  relation: (e.relation as any) || 'drives',
                  style: { color: '#0f172a' },
                }));
                setEdges(newEdges);
              }
            } catch (error) {
              console.error('Failed to process generated graph:', error);
            }
          }}
          currentGraph={{
            nodes,
            edges,
            title: projectName,
          }}
          onApplyLayout={(layouts) => {
            // 應用 AI 建議的排版
            try {
              if (Array.isArray(layouts)) {
                const updated = nodes.map((n) => {
                  const layout = layouts.find((l: any) => l.nodeId === n.id);
                  if (layout) {
                    return { ...n, x: layout.x, y: layout.y };
                  }
                  return n;
                });
                setNodes(updated);
              }
            } catch (error) {
              console.error('Failed to apply layout:', error);
            }
          }}
        />
      </div>
    </div>
  );
}