"use client";

import React from "react";
import type { Page, ProjectFileV2 } from "../../lib/whiteboard/types";

export default function HeaderToolbar({ ctx }: { ctx: any }) {
  const {
    projectName,
    setProjectName,
    currentFileName,
    activeToolbar,
    setActiveToolbar,
    pages,
    nodes,
    selectedIds,
    handleExportPng,
    handleExportLmwb,
    importFileRef,
    handleImportChange,
    STORAGE_KEY,
  } = ctx;

  return (
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
            onClick={() => setActiveToolbar((prev: any) => (prev === "file" ? "none" : "file"))}
          >
            File
          </button>
          <button
            className={`rounded px-2 py-1 ${
              activeToolbar === "view"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-800 border border-slate-300"
            }`}
            onClick={() => setActiveToolbar((prev: any) => (prev === "view" ? "none" : "view"))}
          >
            View
          </button>
          <button
            className={`rounded px-2 py-1 ${
              activeToolbar === "insert"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-800 border border-slate-300"
            }`}
            onClick={() => setActiveToolbar((prev: any) => (prev === "insert" ? "none" : "insert"))}
          >
            Insert
          </button>
          <button
            className={`rounded px-2 py-1 ${
              activeToolbar === "arrange"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-800 border border-slate-300"
            }`}
            onClick={() => setActiveToolbar((prev: any) => (prev === "arrange" ? "none" : "arrange"))}
          >
            Arrange
          </button>
          <button
            className={`rounded px-2 py-1 ${
              activeToolbar === "strategy"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-800 border border-slate-300"
            }`}
            onClick={() => setActiveToolbar((prev: any) => (prev === "strategy" ? "none" : "strategy"))}
          >
            Strategy
          </button>
          <button
            className={`rounded px-2 py-1 ${
              activeToolbar === "help"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-800 border border-slate-300"
            }`}
            onClick={() => setActiveToolbar((prev: any) => (prev === "help" ? "none" : "help"))}
          >
            Help
          </button>
        </div>
      </div>

      {/* 第二層工具內容（簡化：保留 File/View/Insert controls） */}
      {activeToolbar !== "none" && (
        <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[12px]">
          {activeToolbar === "file" && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1"
                onClick={() => {
                  try {
                    const pagesForSave: Page[] = pages.map((p: Page) =>
                      p.id === (pages.find((pp: Page) => pp.id === p.id)?.id)
                        ? { ...p }
                        : p
                    );
                    const data: ProjectFileV2 = {
                      version: 2,
                      projectName,
                      activePageId: pages[0]?.id ?? null,
                      pages: pagesForSave,
                    };
                    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
                onClick={() => handleExportPng()}
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
              <input ref={importFileRef} type="file" accept=".lmwb,.json,application/json" className="hidden" onChange={handleImportChange} />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
