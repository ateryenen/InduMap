"use client";

import React from "react";
import type { Page, Node } from "../../lib/whiteboard/types";

export default function LeftPanel({ ctx }: { ctx: any }) {
  const {
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
  } = ctx;

  if (!showLeftPanel) return null;

  const outlineItems = (nodes || [])
    .slice()
    .sort((a: Node, b: Node) => {
      const la = a.level || "Info";
      const lb = b.level || "Info";
      if (la === lb) return (a.text || "").localeCompare(b.text || "");
      const order: any = ["L1", "L2", "L3", "Info"];
      return order.indexOf(la) - order.indexOf(lb);
    });

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-slate-300 bg-white px-3 py-3 text-[13px]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">專案與頁面</div>
        <div className="text-[11px] text-slate-500">節點：{(nodes || []).length}　選取：{(selectedIds || []).length}</div>
      </div>

      <div className="mb-2 flex gap-1 text-[12px]">
        <button className={`flex-1 rounded px-2 py-1 ${leftTab === "project" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setLeftTab("project")}>Project</button>
        <button className={`flex-1 rounded px-2 py-1 ${leftTab === "templates" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setLeftTab("templates")}>Templates</button>
        <button className={`flex-1 rounded px-2 py-1 ${leftTab === "outline" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`} onClick={() => setLeftTab("outline")}>Outline</button>
      </div>

      {leftTab === "project" && (
        <div className="flex-1 space-y-3 overflow-auto pr-1">
          <div>
            <div className="mb-1 text-xs text-slate-500">專案名稱</div>
            <input className="w-full rounded border border-slate-300 px-2 py-1 text-[12px]" value={projectName || ""} onChange={(e) => setProjectName(e.target.value)} placeholder="輸入專案名稱" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>頁面列表</span>
              <span className="text-[10px] text-slate-400">點選切換</span>
            </div>
            <div className="space-y-1">
              {pages.map((p: Page) => (
                <button key={p.id} className={`flex w-full items-center justify-between rounded border px-2 py-1 text-left text-[12px] ${p.id === activePageId ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-800"}`} onClick={() => handleSwitchPage(p.id)}>
                  <span className="truncate">{p.name}</span>
                  <span className="ml-2 text-[10px] text-slate-400">{p.id === activePageId ? (nodes || []).length : (p.nodes || []).length} nodes</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-1 text-[12px]">
              <div className="flex gap-1">
                <button className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50" onClick={handleAddPage}>新增頁面</button>
                <button className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-50" onClick={handleDuplicatePage}>複製頁面</button>
              </div>
              <div className="flex gap-1">
                <button className="flex-1 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100" onClick={handleRenamePage}>重新命名</button>
                <button className="flex-1 rounded border border-red-300 bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100" onClick={handleDeletePage}>刪除頁面</button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-500">工具模式</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button className={`h-8 flex-1 rounded border ${tool === "select" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white"}`} onClick={() => handleToolClick("select")}>選取 / 多選</button>
              <button className={`h-8 flex-1 rounded border ${tool === "pan" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white"}`} onClick={() => handleToolClick("pan")}>平移 (Space/中鍵)</button>
              <button className={`h-8 flex-1 rounded border ${tool === "connect" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white"}`} onClick={() => handleToolClick("connect")}>連線</button>
              <button className={`h-8 flex-1 rounded border ${tool === "pen" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white"}`} onClick={() => handleToolClick("pen")}>畫筆 Pen</button>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs text-slate-500">Undo / Redo / Copy</div>
            <div className="flex flex-col gap-1 text-xs">
              <button className="h-8 rounded border border-slate-300 bg-white" onClick={handleUndo}>Undo (Ctrl/Cmd + Z)</button>
              <button className="h-8 rounded border border-slate-300 bg-white" onClick={handleRedo}>Redo (Ctrl/Cmd + Y / Shift+Z)</button>
              <button className="h-8 rounded border border-slate-300 bg-white" onClick={copySelectedNode}>複製 (Ctrl/Cmd + C)</button>
              <button className="h-8 rounded border border-slate-300 bg-white" onClick={pasteNodeFromClipboard}>貼上 (Ctrl/Cmd + V)</button>
            </div>
          </div>
        </div>
      )}

      {leftTab === "templates" && (
        <div className="flex-1 space-y-3 overflow-auto pr-1 text-[12px]">
          <div className="text-xs text-slate-500">策略範本（點選插入到目前頁面）：</div>
          <button className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-left hover:bg-slate-50" onClick={() => { setNodes(templateNodes); setEdges([]); setViewport({ x: 0, y: 0, scale: 1 }); setSelectedIds([]); setPrimaryId(null); setEditingId(null); }}>
            <div className="font-semibold">AI 產業鏈範本</div>
            <div className="text-[11px] text-slate-500">AI / Edge / 雲端 / 應用 / Connectivity 初始結構</div>
          </button>
          <button className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-left hover:bg-slate-50" onClick={() => { setNodes(adasTemplateNodes); setEdges(adasTemplateEdges); setViewport({ x: 0, y: 0, scale: 1 }); setSelectedIds([]); setPrimaryId(null); setEditingId(null); }}>
            <div className="font-semibold">ADAS on Android 範例</div>
            <div className="text-[11px] text-slate-500">感測器、Perception、Planning、控制、MLOps/OTA 架構</div>
          </button>
          <button className="w-full rounded border border-slate-300 bg-white px-2 py-2 text-left hover:bg-slate-50" onClick={() => { setNodes([]); setEdges([]); setViewport({ x: 0, y: 0, scale: 1 }); setSelectedIds([]); setPrimaryId(null); setEditingId(null); }}>
            <div className="font-semibold">空白策略畫布</div>
            <div className="text-[11px] text-slate-500">清空所有節點與連線，重頭開始規劃</div>
          </button>
        </div>
      )}

      {leftTab === "outline" && (
        <div className="flex-1 overflow-auto pr-1 text-[12px]">
          {outlineItems.length === 0 ? (
            <div className="text-[12px] text-slate-500">暫無任何節點。<br/>可先在 Insert / Templates 中建立基本結構。</div>
          ) : (
            <div className="space-y-1">
              {outlineItems.map((n: Node) => (
                <button key={n.id} className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[12px] ${selectedIds.includes(n.id) ? "bg-blue-50 text-blue-700" : "hover:bg-slate-100"}`} onClick={() => { /* handled in page.tsx via ctx */ }}>
                  <div className="flex flex-col">
                    <span className="truncate">[{n.level || "Info"}] {n.text || "(無標題)"}</span>
                    <span className="text-[10px] text-slate-400">{n.categoryTag || "未分類"}｜({Math.round(n.x)}, {Math.round(n.y)})</span>
                  </div>
                  <span className="ml-2 text-[10px] text-slate-400">{n.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
