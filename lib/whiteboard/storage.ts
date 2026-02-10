import type { Node, Edge, Page, ProjectFileV2, Viewport } from "./types";
import { STORAGE_KEY, createId, templateNodes } from "./types";

// 集中 localStorage 讀寫：讓 UI/頁面更乾淨，也方便未來換 IndexedDB。

export type LegacyProjectFile = {
  nodes?: Node[];
  edges?: Edge[];
  viewport?: Viewport;
  projectName?: string;
};

export function makeDefaultProject(): ProjectFileV2 {
  const defaultPageId = createId();
  const defaultViewport: Viewport = { x: 0, y: 0, scale: 1 };
  const defaultPage: Page = {
    id: defaultPageId,
    name: "Page 1",
    nodes: templateNodes,
    edges: [],
    viewport: defaultViewport,
  };
  return {
    version: 2,
    projectName: "industry-map-whiteboard",
    activePageId: defaultPageId,
    pages: [defaultPage],
  };
}

// 用 const-export，避免某些 bundler/interop 情境下 named export 被意外轉換。
export const readProjectFromStorage = (): ProjectFileV2 => {
  if (typeof window === "undefined") return makeDefaultProject();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeDefaultProject();

    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 2 && Array.isArray(parsed.pages)) {
      return parsed as ProjectFileV2;
    }

    // 相容舊格式（單頁）
    const legacy = parsed as LegacyProjectFile;
    const defaultProject = makeDefaultProject();
    const page0 = defaultProject.pages[0];
    return {
      version: 2,
      projectName: legacy.projectName || defaultProject.projectName,
      activePageId: page0.id,
      pages: [
        {
          ...page0,
          nodes: legacy.nodes && Array.isArray(legacy.nodes) ? legacy.nodes : page0.nodes,
          edges: legacy.edges && Array.isArray(legacy.edges) ? legacy.edges : page0.edges,
          viewport: legacy.viewport ? legacy.viewport : page0.viewport,
        },
      ],
    };
  } catch {
    return makeDefaultProject();
  }
};

export const writeProjectToStorage = (data: ProjectFileV2) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};
