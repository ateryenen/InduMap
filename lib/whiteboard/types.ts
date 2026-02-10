// Auto-generated from page.tsx top-level types & constants

export type Tool =
  | "select"
  | "pan"
  | "connect"
  | "pen"
  | "category"
  | "note"
  | "text"
  | "image"
  | "table"
  | "group"
  | "title"
  | "icon"
  | "milestone"
  | "kpi"
  | "owner"
  | "link"
  | "tag"
  | "callout"
  | "flow-process"
  | "flow-decision"
  | "flow-terminator";

export type NodeType =
  | "category"
  | "note"
  | "text"
  | "image"
  | "table"
  | "group"
  | "title"
  | "icon"
  | "milestone"
  | "kpi"
  | "owner"
  | "link"
  | "tag"
  | "callout"
  | "flow-process"
  | "flow-decision"
  | "flow-terminator";

export type StrategyLevel = "L1" | "L2" | "L3" | "Info";

export interface TableData {
  rows: number;
  cols: number;
  cells: string[][];
}

// 0~1 正規化裁切框（相對於原圖）
export type ImageCrop = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export interface Node {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  bgColor?: string;
  imageUrl?: string; // dataURL 或線上 URL
  imageFile?: string; // .lmwb內部檔名，例如 "images/xxx.png"
  imageCrop?: ImageCrop; // 0~1 正規化裁切框（相對於原圖）
  table?: TableData;
  fontSize?: number;
  textColor?: string;
  textOpacity?: number;
  textAlign?: "left" | "center" | "right";
  fontWeight?: number;
  textShadow?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  linkUrl?: string;
  groupId?: string;
  children?: string[]; // For group nodes: array of child node IDs
  locked?: boolean;

  // 策略相關欄位
  level?: StrategyLevel;
  categoryTag?: string;
  impact?: number;
  effort?: number;
  owner?: string;
}

export type EdgeRelation =
  | "drives"      // 驅動
  | "blocks"      // 阻礙
  | "dependsOn"   // 依賴
  | "childOf"     // 子策略
  | "similar"     // 同類 / 關聯
  | "unspecified" // 暫未定義
  | "enables"
  | "tradeoff"
  | "partOf"
  | "exampleOf";

export interface Edge {
  id: string;
  fromId: string;
  toId: string;
  relation?: EdgeRelation; // 新增：連線語義
  label?: string;          // 新增：自訂說明文字
  style?: EdgeStyle;
}

export interface EdgeStyle {
  arrow?: "none" | "start" | "end" | "both";
  width?: number;
  dash?: number[];
  stroke?: string;
  interactive?: boolean;
}

export const EDGE_STYLE_PRESET: Record<string, EdgeStyle> = {
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


export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface BoardState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  projectName?: string;
}

// 多頁面專案結構
export interface Page {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

export interface ProjectFileV2 {
  version: 2;
  projectName: string;
  activePageId: string | null;
  pages: Page[];
}

export type ResizeHandle =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left";

export const STORAGE_KEY = "industry-map-whiteboard-v3";

export function createId() {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** 初始產業圖譜模板節點 */
export const templateNodes: Node[] = [
  {
    id: "tpl-ai",
    type: "category",
    x: 100,
    y: 80,
    width: 260,
    height: 120,
    text: "AI 核心技術",
    bgColor: "#e0f2fe",
    fontSize: 14,
    level: "L1",
    categoryTag: "技術",
  },
  {
    id: "tpl-robot",
    type: "category",
    x: 460,
    y: 80,
    width: 260,
    height: 120,
    text: "機器人 / 自動化",
    bgColor: "#fef3c7",
    fontSize: 14,
    level: "L1",
    categoryTag: "應用",
  },
  {
    id: "tpl-edge",
    type: "category",
    x: 820,
    y: 80,
    width: 260,
    height: 120,
    text: "Edge Device / Sensor",
    bgColor: "#dcfce7",
    fontSize: 14,
    level: "L1",
    categoryTag: "裝置",
  },
  {
    id: "tpl-cloud",
    type: "category",
    x: 100,
    y: 260,
    width: 260,
    height: 120,
    text: "雲端平台 / MLOps",
    bgColor: "#ede9fe",
    fontSize: 14,
    level: "L2",
    categoryTag: "平台",
  },
  {
    id: "tpl-enterprise",
    type: "category",
    x: 460,
    y: 260,
    width: 260,
    height: 120,
    text: "企業應用場景",
    bgColor: "#fee2e2",
    fontSize: 14,
    level: "L2",
    categoryTag: "應用",
  },
  {
    id: "tpl-connect",
    type: "note",
    x: 880,
    y: 420,
    width: 220,
    height: 90,
    text: "連接層：5G / LPWAN / eSIM",
    bgColor: "#e5e7eb",
    fontSize: 12,
    level: "Info",
    categoryTag: "Connectivity",
  },
];

// ===============================
// ===== Strategy 範本資料 =====
// ===============================

export const robotTemplateNodes = [
  {
    id: "rb_center",
    type: "category",
    x: 1700,
    y: 900,
    width: 600,
    height: 600,
    text: "具身智能機器人（核心系統）",
    bgColor: "#0b3a73",
    fontSize: 18,
    level: "L1",
  },
];

export const robotTemplateEdges: Edge[] = [];

// ===============================
// ===== ADAS on Android 範本 =====
// ===============================

export const adasTemplateNodes: Node[] = [
  {
    id: "adas_title",
    type: "category",
    x: 60,
    y: -80,
    width: 980,
    height: 60,
    text: "ADAS on Android 架構範例（AI 導入）",
    bgColor: "#0b3a73",
    fontSize: 16,
    level: "L1",
  },
  {
    id: "adas_sensors",
    type: "category",
    x: 60,
    y: 40,
    width: 220,
    height: 100,
    text: "Sensors\nCamera / Radar / LiDAR",
    bgColor: "#e0f2fe",
    fontSize: 12,
    level: "L2",
  },
  {
    id: "adas_soc",
    type: "category",
    x: 320,
    y: 40,
    width: 240,
    height: 100,
    text: "SoC / Chipset\nSnapdragon / Dimensity",
    bgColor: "#f0fdf4",
    fontSize: 12,
    level: "L2",
  },
  {
    id: "adas_hal",
    type: "category",
    x: 600,
    y: 40,
    width: 200,
    height: 100,
    text: "HAL / Driver\nAndroid HAL",
    bgColor: "#fef9e7",
    fontSize: 12,
    level: "L2",
  },
  {
    id: "adas_bus",
    type: "category",
    x: 840,
    y: 40,
    width: 200,
    height: 100,
    text: "CAN / Ethernet\nVehicle Bus",
    bgColor: "#fce7f3",
    fontSize: 12,
    level: "L2",
  },
  {
    id: "adas_perception",
    type: "category",
    x: 60,
    y: 170,
    width: 280,
    height: 120,
    text: "Perception Pipeline\nYOLO / TensorFlow",
    bgColor: "#dbeafe",
    fontSize: 13,
    level: "L1",
  },
  {
    id: "adas_fusion",
    type: "category",
    x: 380,
    y: 170,
    width: 300,
    height: 120,
    text: "Sensor Fusion / Tracking",
    bgColor: "#dbeafe",
    fontSize: 13,
    level: "L1",
  },
  {
    id: "adas_localization",
    type: "category",
    x: 700,
    y: 170,
    width: 280,
    height: 120,
    text: "Localization / Map",
    bgColor: "#ede9fe",
    fontSize: 13,
    level: "L1",
  },
  {
    id: "adas_planning",
    type: "category",
    x: 60,
    y: 320,
    width: 300,
    height: 120,
    text: "Planning / Prediction",
    bgColor: "#fff7ed",
    fontSize: 13,
    level: "L1",
  },
  {
    id: "adas_control",
    type: "category",
    x: 380,
    y: 320,
    width: 300,
    height: 120,
    text: "Control / Actuation",
    bgColor: "#fef9c3",
    fontSize: 13,
    level: "L1",
  },
  {
    id: "adas_hmi",
    type: "category",
    x: 700,
    y: 320,
    width: 280,
    height: 120,
    text: "HMI / Driver Monitor",
    bgColor: "#e2e8f0",
    fontSize: 13,
    level: "L1",
  },
  {
    id: "adas_logging",
    type: "category",
    x: 60,
    y: 470,
    width: 260,
    height: 110,
    text: "Data Logging",
    bgColor: "#f1f5f9",
    fontSize: 12,
    level: "Info",
  },
  {
    id: "adas_mlops",
    type: "category",
    x: 340,
    y: 470,
    width: 300,
    height: 110,
    text: "MLOps / Model Registry",
    bgColor: "#f5f3ff",
    fontSize: 12,
    level: "Info",
  },
  {
    id: "adas_ota",
    type: "category",
    x: 660,
    y: 470,
    width: 320,
    height: 110,
    text: "OTA / Fleet Analytics",
    bgColor: "#ecfccb",
    fontSize: 12,
    level: "Info",
  },
];

export const adasTemplateEdges: Edge[] = [
  { id: "adas_e1", fromId: "adas_sensors", toId: "adas_perception", relation: "drives" },
  { id: "adas_e2", fromId: "adas_soc", toId: "adas_perception", relation: "enables" },
  { id: "adas_e3", fromId: "adas_hal", toId: "adas_perception", relation: "enables" },
  { id: "adas_e4", fromId: "adas_perception", toId: "adas_fusion", relation: "drives" },
  { id: "adas_e5", fromId: "adas_fusion", toId: "adas_planning", relation: "drives" },
  { id: "adas_e6", fromId: "adas_localization", toId: "adas_planning", relation: "dependsOn" },
  { id: "adas_e7", fromId: "adas_planning", toId: "adas_control", relation: "drives" },
  { id: "adas_e8", fromId: "adas_control", toId: "adas_hmi", relation: "enables" },
  { id: "adas_e9", fromId: "adas_perception", toId: "adas_logging", relation: "enables" },
  { id: "adas_e10", fromId: "adas_logging", toId: "adas_mlops", relation: "drives" },
  { id: "adas_e11", fromId: "adas_mlops", toId: "adas_ota", relation: "enables" },
];
