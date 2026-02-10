// lib/whiteboard/strategyTemplates.ts
import type { Node, Edge } from "./types";
import { templateNodes, robotTemplateNodes, robotTemplateEdges, adasTemplateNodes, adasTemplateEdges } from "./types";

export type Viewport = { x: number; y: number; scale: number };

export type StrategyTemplateKey =
  | "ai"
  | "adas"
  | "robot"
  | "blank"
  | "impactEffort"
  | "internalExternal"
  | "smileCurveAI"
  | "threeHorizons";

export type StrategyTemplate = {
  key: StrategyTemplateKey;
  label: string;
  nodes: Node[];
  edges: Edge[];
  autoFit?: boolean;
  viewport?: Viewport;
  padding?: number;
};

function n(id: string, x: number, y: number, w: number, h: number, text: string, extra?: Partial<Node>): Node {
  return { id, type: extra?.type ?? "text", x, y, width: w, height: h, text, ...(extra ?? {}) } as Node;
}
function e(id: string, fromId: string, toId: string, extra?: Partial<Edge>): Edge {
  return { id, fromId, toId, ...(extra ?? {}) } as Edge;
}

export function computeViewportToFitNodes(
  nodes: Node[],
  opts?: { padding?: number; minScale?: number; maxScale?: number; viewportW?: number; viewportH?: number }
): Viewport {
  const padding = opts?.padding ?? 120;
  const minScale = opts?.minScale ?? 0.2;
  const maxScale = opts?.maxScale ?? 2.0;
  const W = opts?.viewportW ?? 1400;
  const H = opts?.viewportH ?? 900;
  if (!nodes || nodes.length === 0) return { x: 0, y: 0, scale: 1 };

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const nd of nodes) {
    const x1 = (nd as any).x ?? 0;
    const y1 = (nd as any).y ?? 0;
    const x2 = x1 + ((nd as any).width ?? 0);
    const y2 = y1 + ((nd as any).height ?? 0);
    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }

  const contentW = maxX - minX + padding * 2;
  const contentH = maxY - minY + padding * 2;

  let scale = Math.min(W / contentW, H / contentH);
  if (!isFinite(scale) || scale <= 0) scale = 1;
  scale = Math.max(minScale, Math.min(maxScale, scale));

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const x = W / 2 - cx * scale;
  const y = H / 2 - cy * scale;
  return { x, y, scale };
}

// ---------- 1) Impact vs Effort ----------
function buildImpactEffort() {
  const nodes: Node[] = [
    n("ie_title", 0, -120, 980, 60, "優先級篩選：效益 / 難易度矩陣 (Impact vs Effort)", { type: "category", bgColor: "#0b3a73", fontSize: 16, level: "L1" }),
    n("ie_y", -160, 260, 140, 200, "商業效益\nBusiness\nImpact", { fontSize: 12, level: "L2" }),
    n("ie_x", 260, 760, 520, 80, "實作難度 Implementation Effort  →", { fontSize: 12, level: "L2" }),
    n("ie_q1", 0, 0, 480, 320, "Quick Wins\n速贏區", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("ie_q2", 500, 0, 480, 320, "Major Projects\n重點專案", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("ie_q3", 0, 340, 480, 320, "Fill-ins\n填空區", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("ie_q4", 500, 340, 480, 320, "Thankless Tasks\n勞民傷財", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("ie_note_q1", 30, 120, 420, 90, "AI 輔助 BOM 表報價\n效益高 / 難度低 → 馬上做", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("ie_note_q2", 530, 120, 420, 100, "AI 庫存預測系統\n效益極高 / 需整理歷史數據 → 年度計畫", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("ie_note_q3", 30, 450, 420, 90, "AI 生成行銷文案\n簡單但對 B2B 影響有限 → 有空再做", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("ie_note_q4", 530, 450, 420, 100, "自行開發 AI 聊天機器人\n超難 / 客戶偏好找業務 → 刪除", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
  ];
  const edges: Edge[] = [
    e("ie_e1", "ie_q1", "ie_note_q1", { relation: "childOf" }),
    e("ie_e2", "ie_q2", "ie_note_q2", { relation: "childOf" }),
    e("ie_e3", "ie_q3", "ie_note_q3", { relation: "childOf" }),
    e("ie_e4", "ie_q4", "ie_note_q4", { relation: "childOf" }),
  ];
  return { nodes, edges };
}

// ---------- 2) Internal vs External ----------
function buildInternalExternal() {
  const nodes: Node[] = [
    n("iv_title", 0, -120, 980, 60, "定位決策：內部 vs 外部價值矩陣 (Internal vs External Value)", { type: "category", bgColor: "#0b3a73", fontSize: 16, level: "L1" }),
    n("iv_y", -170, 260, 150, 200, "內部營運優化\nInternal\nEfficiency", { fontSize: 12, level: "L2" }),
    n("iv_x", 260, 760, 560, 80, "外部商用潛力 Commercial Potential  →", { fontSize: 12, level: "L2" }),
    n("iv_q1", 0, 0, 480, 320, "明星\n高內 / 高外", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("iv_q2", 500, 0, 480, 320, "核心\n高內 / 低外", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("iv_q3", 0, 340, 480, 320, "成長嘗試\n低內 / 高外", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("iv_q4", 500, 340, 480, 320, "雜訊\n低內 / 低外", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("iv_note_q1", 30, 120, 420, 100, "獨家替代料資料庫\n內部省力 + 可包裝 API 對外販售", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("iv_note_q2", 530, 120, 420, 100, "ERP 自動化拋轉\n自己省很多時間 → 純內功", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("iv_note_q3", 30, 450, 420, 100, "AI 供應鏈報告（加值）\n客戶願意付費 / 續約", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("iv_note_q4", 530, 450, 420, 100, "跟風元宇宙/區塊鏈 + AI\n低內低外 → 放棄", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
  ];
  const edges: Edge[] = [
    e("iv_e1", "iv_q1", "iv_note_q1", { relation: "childOf" }),
    e("iv_e2", "iv_q2", "iv_note_q2", { relation: "childOf" }),
    e("iv_e3", "iv_q3", "iv_note_q3", { relation: "childOf" }),
    e("iv_e4", "iv_q4", "iv_note_q4", { relation: "childOf" }),
  ];
  return { nodes, edges };
}

// ---------- 3) Smile Curve (AI) ----------
function buildSmileCurveAI() {
  const nodes: Node[] = [
    n("sc_title", 0, -120, 980, 60, "產業價值鏈：微笑曲線 AI 版 (Smile Curve - AI Edition)", { type: "category", bgColor: "#0b3a73", fontSize: 16, level: "L1" }),
    n("sc_left", 0, 80, 300, 460, "左端：研發 / IP\n(原廠：TI / ADI / Nvidia)\n利潤高", { type: "category", bgColor: "#ffffff", fontSize: 13, level: "L1" }),
    n("sc_mid", 340, 200, 320, 340, "中間：組裝 / 分銷\n(代理商 / EMS)\n利潤最低", { type: "category", bgColor: "#ffffff", fontSize: 13, level: "L1" }),
    n("sc_right", 700, 80, 320, 460, "右端：品牌 / 服務\n(SI / SaaS 平台)\n利潤高", { type: "category", bgColor: "#ffffff", fontSize: 13, level: "L1" }),
    n("sc_note_1", 350, 570, 650, 100, "引導：我們現在處於中間底部（搬箱子）。\n導入 AI 的目的：往右端（服務）爬升，例如 VMI / AI 技術諮詢 / 供應鏈服務。", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("sc_p1", 60, 40, 18, 18, "", { bgColor: "#0b3a73" }),
    n("sc_p2", 210, 150, 18, 18, "", { bgColor: "#0b3a73" }),
    n("sc_p3", 420, 280, 18, 18, "", { bgColor: "#0b3a73" }),
    n("sc_p4", 560, 280, 18, 18, "", { bgColor: "#0b3a73" }),
    n("sc_p5", 790, 150, 18, 18, "", { bgColor: "#0b3a73" }),
    n("sc_p6", 930, 40, 18, 18, "", { bgColor: "#0b3a73" }),
    n("sc_y_label", -140, 40, 120, 120, "獲利\nProfit", { fontSize: 12, level: "L2" }),
    n("sc_x_label", 360, 700, 380, 60, "價值鏈位置  →", { fontSize: 12, level: "L2" }),
  ];
  const edges: Edge[] = [
    e("sc_e1", "sc_p1", "sc_p2", { relation: "similar" }),
    e("sc_e2", "sc_p2", "sc_p3", { relation: "similar" }),
    e("sc_e3", "sc_p3", "sc_p4", { relation: "similar" }),
    e("sc_e4", "sc_p4", "sc_p5", { relation: "similar" }),
    e("sc_e5", "sc_p5", "sc_p6", { relation: "similar" }),
  ];
  return { nodes, edges };
}

// ---------- 4) Three Horizons ----------
function buildThreeHorizons() {
  const nodes: Node[] = [
    n("th_title", 0, -120, 980, 60, "成長路徑：三層地平線模型 (Three Horizons of Growth)", { type: "category", bgColor: "#0b3a73", fontSize: 16, level: "L1" }),
    n("th_h1", 0, 0, 300, 560, "Horizon 1\n核心業務（現在）", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("th_h2", 340, 0, 300, 560, "Horizon 2\n新興業務（近期）", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("th_h3", 680, 0, 300, 560, "Horizon 3\n未來業務（遠期）", { type: "category", bgColor: "#ffffff", fontSize: 14, level: "L1" }),
    n("th_h1_i1", 20, 90, 260, 90, "守成：AI 優化現有流程\nSmart Quoting / Auto-Email", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("th_h1_i2", 20, 190, 260, 90, "目標：提升 20% 人效\n讓業務多跑客戶", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("th_h2_i1", 360, 90, 260, 90, "拓展：AI 加值現有產品\n買硬體送 AI 供應鏈報告", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("th_h2_i2", 360, 190, 260, 90, "目標：提升黏著度\n降低轉單", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("th_h3_i1", 700, 90, 260, 100, "轉型：建立 SaaS 平台\n電子零件數據中心", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("th_h3_i2", 700, 200, 260, 90, "目標：創造非硬體營收\n擺脫價格戰", { bgColor: "#f8fafc", fontSize: 12, level: "L2" }),
    n("th_time", 210, 590, 560, 60, "時間  →", { fontSize: 12, level: "L2" }),
  ];
  const edges: Edge[] = [
    e("th_e1", "th_h1", "th_h1_i1", { relation: "childOf" }),
    e("th_e2", "th_h1", "th_h1_i2", { relation: "childOf" }),
    e("th_e3", "th_h2", "th_h2_i1", { relation: "childOf" }),
    e("th_e4", "th_h2", "th_h2_i2", { relation: "childOf" }),
    e("th_e5", "th_h3", "th_h3_i1", { relation: "childOf" }),
    e("th_e6", "th_h3", "th_h3_i2", { relation: "childOf" }),
  ];
  return { nodes, edges };
}

const IMPACT_EFFORT = buildImpactEffort();
const INTERNAL_EXTERNAL = buildInternalExternal();
const SMILE_CURVE_AI = buildSmileCurveAI();
const THREE_HORIZONS = buildThreeHorizons();

export const STRATEGY_TEMPLATES: Record<StrategyTemplateKey, StrategyTemplate> = {
  impactEffort: { key: "impactEffort", label: "效益 / 難易度矩陣", nodes: IMPACT_EFFORT.nodes, edges: IMPACT_EFFORT.edges, autoFit: true, padding: 120 },
  internalExternal: { key: "internalExternal", label: "內部 vs 外部價值矩陣", nodes: INTERNAL_EXTERNAL.nodes, edges: INTERNAL_EXTERNAL.edges, autoFit: true, padding: 120 },
  smileCurveAI: { key: "smileCurveAI", label: "微笑曲線（AI 版）", nodes: SMILE_CURVE_AI.nodes, edges: SMILE_CURVE_AI.edges, autoFit: true, padding: 140 },
  threeHorizons: { key: "threeHorizons", label: "三層地平線模型", nodes: THREE_HORIZONS.nodes, edges: THREE_HORIZONS.edges, autoFit: true, padding: 120 },

  ai: { key: "ai", label: "AI 產業鏈範本", nodes: templateNodes, edges: [], autoFit: true, padding: 80 },
  adas: { key: "adas", label: "ADAS on Android 範例", nodes: adasTemplateNodes, edges: adasTemplateEdges, autoFit: true, padding: 120 },
  robot: { key: "robot", label: "機器人產業圖譜範本", nodes: robotTemplateNodes as Node[], edges: robotTemplateEdges, autoFit: true, padding: 120 },
  blank: { key: "blank", label: "空白策略畫布", nodes: [], edges: [], viewport: { x: 0, y: 0, scale: 1 } },
};

export function getStrategyTemplateList(): { key: StrategyTemplateKey; label: string }[] {
  return Object.values(STRATEGY_TEMPLATES).map((t) => ({ key: t.key, label: t.label }));
}

export function applyStrategyTemplate(
  key: StrategyTemplateKey,
  opts?: { padding?: number }
): { nodes: Node[]; edges: Edge[]; viewport?: Viewport } {
  const t = STRATEGY_TEMPLATES[key];
  const nodes = (t?.nodes ?? []) as Node[];
  const edges = (t?.edges ?? []) as Edge[];

  if (t?.viewport) return { nodes, edges, viewport: t.viewport };
  if (t?.autoFit) {
    const pad = opts?.padding ?? t.padding ?? 120;
    return { nodes, edges, viewport: computeViewportToFitNodes(nodes, { padding: pad }) };
  }
  return { nodes, edges };
}
