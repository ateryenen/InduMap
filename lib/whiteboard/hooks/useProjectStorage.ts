"use client";

import { useEffect, useRef } from "react";
import type { Edge, Node, Page, ProjectFileV2, Viewport } from "../types";
import * as storage from "../storage";

export function useLoadProjectFromStorage(opts: {
  setPages: (v: Page[]) => void;
  setActivePageId: (v: string | null) => void;
  setNodes: (v: Node[]) => void;
  setEdges: (v: Edge[]) => void;
  setViewport: (v: Viewport) => void;
  setProjectName: (v: string) => void;
}) {
  useEffect(() => {
    const readFn = storage.readProjectFromStorage ?? storage.makeDefaultProject;
    const data = readFn();

    opts.setPages(data.pages || []);
    opts.setActivePageId(data.activePageId ?? null);
    opts.setProjectName(data.projectName || "industry-map-whiteboard");

    const active = data.pages.find((p) => p.id === data.activePageId) ?? data.pages[0];
    opts.setNodes(active?.nodes || []);
    opts.setEdges(active?.edges || []);
    opts.setViewport(active?.viewport || { x: 0, y: 0, scale: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useAutoSaveProjectToStorage(args: {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  projectName: string;
  pages: Page[];
  activePageId: string | null;
  debounceMs?: number;
}) {
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!args.pages || args.pages.length === 0) return;

    if (tRef.current !== null) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => {
      const pagesForSave: Page[] = args.pages.map((p) =>
        p.id === args.activePageId
          ? {
              ...p,
              nodes: JSON.parse(JSON.stringify(args.nodes)),
              edges: JSON.parse(JSON.stringify(args.edges)),
              viewport: { ...args.viewport },
            }
          : p
      );

      const data: ProjectFileV2 = {
        version: 2,
        projectName: args.projectName,
        activePageId: args.activePageId,
        pages: pagesForSave,
      };

      const writeFn = storage.writeProjectToStorage;
      if (typeof writeFn === "function") writeFn(data);
    }, args.debounceMs ?? 400);

    return () => {
      if (tRef.current !== null) window.clearTimeout(tRef.current);
    };
  }, [
    args.nodes,
    args.edges,
    args.viewport,
    args.projectName,
    args.pages,
    args.activePageId,
    args.debounceMs,
  ]);
}
