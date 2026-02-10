"use client";

import React from "react";
import type { Node, Edge, EdgeRelation } from "../../lib/whiteboard/types";

export default function RightPanel({ ctx }: { ctx: any }) {
  const {
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
  } = ctx;

  if (!showRightPanel) return null;

  // Pen tool panel
  if (tool === "pen") {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-300 bg-white px-3 py-3 text-[13px]">
        <div className="mb-2 text-base font-semibold">筆工具設定</div>
        <div className="flex-1 space-y-3 overflow-auto pr-1 text-[12px]">
          <div>
            <label className="mb-1 block text-xs text-slate-600">筆色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-16 rounded border border-slate-300"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
              />
              <span className="text-[11px] text-slate-500">{penColor}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">筆寬</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.5"
                max="20"
                step="0.5"
                className="flex-1"
                value={penWidth}
                onChange={(e) => setPenWidth(parseFloat(e.target.value))}
              />
              <span className="w-12 text-right text-[11px] text-slate-500">{penWidth.toFixed(1)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">透明度</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                className="flex-1"
                value={penOpacity}
                onChange={(e) => setPenOpacity(parseFloat(e.target.value))}
              />
              <span className="w-12 text-right text-[11px] text-slate-500">{(penOpacity * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              className="w-full rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 hover:bg-red-100"
              onClick={() => ctx.setStrokes([])}
            >
              清除所有筆跡
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Find selected edge
  const selectedEdge = selectedEdgeId ? (edges || []).find((e: Edge) => e.id === selectedEdgeId) : null;
  
  // 檢查是否選中了多條邊線（通過 selectedIds 中的 edge: 前綴）
  const selectedEdgeIds = (selectedIds || []).filter(id => id.startsWith('edge:')).map(id => id.replace('edge:', ''));
  const selectedEdges = selectedEdgeIds.length > 0 
    ? (edges || []).filter((e: Edge) => selectedEdgeIds.includes(e.id))
    : [];

  if (!selectedNode && !selectedEdge && selectedEdges.length === 0) {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-300 bg-white px-3 py-3 text-[13px]">
        <div className="mb-2 text-base font-semibold">屬性 / 策略資訊</div>
        <div className="text-[12px] text-slate-500">尚未選取節點或連線。<br/>● 拖曳空白處可框選多個節點<br/>● Shift / Ctrl + 點擊 可多選/取消選取<br/>● 點擊連線可編輯其屬性</div>
      </aside>
    );
  }

  // Multiple edges selected
  if (selectedEdges.length > 1) {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-300 bg-white px-3 py-3 text-[13px]">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-base font-semibold">多條連線已選取</div>
          <button
            onClick={() => {
              ctx.setSelectedIds([]);
              ctx.setPrimaryId(null);
            }}
            className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] hover:bg-slate-200"
          >
            ✕ 關閉
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-auto pr-1 text-[12px]">
          <div className="text-slate-600">
            已選取 {selectedEdges.length} 條連線
          </div>
          <div className="max-h-[300px] space-y-2 overflow-auto">
            {selectedEdges.map((edge: Edge) => (
              <div key={edge.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-[11px]">
                <div className="font-semibold">{edge.id}</div>
                <div className="text-slate-500">
                  {(edge as any).fromId} → {(edge as any).toId}
                </div>
                <div className="text-slate-600">
                  關係: {(edge as any).relation || 'drives'}
                </div>
                {(edge as any).label && (
                  <div className="text-slate-600">
                    標籤: {(edge as any).label}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            className="w-full rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] text-red-700 hover:bg-red-100"
            onClick={() => {
              if (window.confirm(`確定要刪除這 ${selectedEdges.length} 條連線嗎？`)) {
                selectedEdges.forEach((edge: Edge) => deleteEdge(edge.id));
                ctx.setSelectedIds([]);
                ctx.setPrimaryId(null);
              }
            }}
          >
            刪除所有選中的連線
          </button>
        </div>
      </aside>
    );
  }

  // Edge editing panel
  if (selectedEdge || selectedEdges.length === 1) {
    const edgeToEdit = selectedEdge || selectedEdges[0];
    if (!edgeToEdit) return null;
    const relationOptions: (EdgeRelation)[] = [
      "drives", "blocks", "dependsOn", "childOf", "similar", "unspecified"
    ];

    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-slate-300 bg-white px-3 py-3 text-[13px]">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-base font-semibold">連線編輯</div>
          <button
            onClick={() => {
              ctx.setSelectedEdgeId(null);
              ctx.setSelectedIds([]);
              ctx.setPrimaryId(null);
            }}
            className="rounded border border-slate-300 bg-slate-100 px-2 py-1 text-[11px] hover:bg-slate-200"
          >
            ✕ 關閉
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-auto pr-1 text-[12px]">
          <div>
            <div className="font-semibold">ID: {edgeToEdit.id}</div>
            <div className="text-[11px] text-slate-500">
              {(edgeToEdit as any).fromId} → {(edgeToEdit as any).toId}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">關係類型</label>
            <select
              className="w-full rounded border border-slate-300 p-1 text-[11px]"
              value={(edgeToEdit as any).relation || "drives"}
              onChange={(e) => updateEdge(edgeToEdit.id, { relation: e.target.value as EdgeRelation })}
            >
              {relationOptions.map((rel) => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">標籤文字</label>
            <input
              className="w-full rounded border border-slate-300 p-1 text-[11px]"
              placeholder="輸入標籤"
              value={(edgeToEdit as any).label || ""}
              onChange={(e) => updateEdge(edgeToEdit.id, { label: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">線條顏色</label>
            <input
              type="color"
              className="h-8 w-full rounded border border-slate-300"
              value={(edgeToEdit as any).style?.stroke || "#334155"}
              onChange={(e) => updateEdge(edgeToEdit.id, { 
                style: { ...(edgeToEdit as any).style, stroke: e.target.value } 
              })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">線條粗細</label>
            <input
              type="number"
              min="0.5"
              max="5"
              step="0.5"
              className="w-full rounded border border-slate-300 p-1 text-[11px]"
              value={(edgeToEdit as any).style?.width || 1.5}
              onChange={(e) => updateEdge(edgeToEdit.id, { 
                style: { ...(edgeToEdit as any).style, width: parseFloat(e.target.value) } 
              })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">箭頭樣式</label>
            <select
              className="w-full rounded border border-slate-300 p-1 text-[11px]"
              value={(edgeToEdit as any).style?.arrow || "end"}
              onChange={(e) => updateEdge(edgeToEdit.id, { 
                style: { ...(edgeToEdit as any).style, arrow: e.target.value as any } 
              })}
            >
              <option value="none">無箭頭</option>
              <option value="start">起點箭頭</option>
              <option value="end">終點箭頭</option>
              <option value="both">雙向箭頭</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">線條樣式</label>
            <select
              className="w-full rounded border border-slate-300 p-1 text-[11px]"
              value={
                !(selectedEdge as any).style?.dash || (selectedEdge as any).style.dash.length === 0
                  ? "solid"
                  : (selectedEdge as any).style.dash.join(",") === "4,4"
                  ? "dashed"
                  : (selectedEdge as any).style.dash.join(",") === "2,2"
                  ? "dotted"
                  : "custom"
              }
              onChange={(e) => {
                const val = e.target.value;
                let dash: number[] | undefined;
                if (val === "solid") dash = undefined;
                else if (val === "dashed") dash = [4, 4];
                else if (val === "dotted") dash = [2, 2];
                updateEdge(edgeToEdit.id, { 
                  style: { ...(edgeToEdit as any).style, dash } 
                });
              }}
            >
              <option value="solid">實線</option>
              <option value="dashed">虛線</option>
              <option value="dotted">點線</option>
            </select>
          </div>

          <button
            className="w-full rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] text-red-700"
            onClick={() => deleteEdge(edgeToEdit.id)}
          >
            刪除連線
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-300 bg-white px-3 py-3 text-[13px]">
      <div className="mb-2 text-base font-semibold">屬性 / 策略資訊</div>

      <div className="flex-1 space-y-3 overflow-auto pr-1 text-[12px]">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">ID: {selectedNode.id}</div>
            <div className="text-[11px] text-slate-500">類型：{selectedNode.type}　群組：{selectedNode.groupId || "無"}</div>
            <div className="text-[11px] text-slate-500">已選取 {(selectedIds || []).length} 個節點</div>
          </div>
          <button className="rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] text-red-700" onClick={deleteSelectedNode}>刪除</button>
        </div>

        <div className="flex items-center justify-between">
          <button className={`rounded border px-2 py-1 text-[11px] ${formatPainterActive ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-300 bg-white"}`} onClick={() => { if (formatPainterActive) { setFormatPainterActive(false); formatSourceIdRef.current = null; } else { formatSourceIdRef.current = selectedNode.id; setFormatPainterActive(true); } }}>{formatPainterActive ? "複製格式（開啟）" : "複製格式 (Format Painter)"}</button>
          {formatPainterActive && <span className="text-[10px] text-slate-500">點其他節點套用格式，按此按鈕或 Esc 關閉</span>}
        </div>

        {/* 圖片 / 位置 / 文字 等屬性略過詳細呈現，保留更新介面呼叫 */}
        {selectedNode.type === "image" && (
          <div>
            <div className="mb-1 text-xs text-slate-500">圖片 URL 或 dataURL</div>
            <input className="w-full rounded border border-slate-300 p-1 text-[12px]" value={selectedNode.imageUrl || ""} onChange={(e) => updateSelectedNode({ imageUrl: e.target.value || undefined })} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px]" onClick={openCropModalForSelected} disabled={!selectedNode.imageUrl || !!selectedNode.locked}>裁切 Crop…</button>
              <button className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px]" onClick={resetCropForSelected} disabled={!selectedNode.imageCrop}>重設裁切</button>
            </div>
          </div>
        )}

        {selectedNode.type === "link" && (
          <div>
            <div className="mb-1 text-xs text-slate-500">連結 URL</div>
            <input
              className="w-full rounded border border-slate-300 p-1 text-[12px]"
              value={selectedNode.linkUrl || ""}
              onChange={(e) => updateSelectedNode({ linkUrl: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        )}

        <div>
          <div className="mb-1 text-xs text-slate-500">常用設定</div>
          <div className="space-y-2">
            {selectedNode.type !== "image" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">背景色</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-8 w-16 rounded border border-slate-300"
                    value={
                      selectedNode.bgColor ||
                      (selectedNode.type === "note"
                        ? "#fff7ed"
                        : selectedNode.type === "category"
                        ? "#f3f4f6"
                        : "#ffffff")
                    }
                    onChange={(e) => updateSelectedNode({ bgColor: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1">
                    {["#ffffff", "#f3f4f6", "#fff7ed", "#e0f2fe", "#dcfce7", "#fee2e2"].map((c) => (
                      <button
                        key={c}
                        className="h-6 w-6 rounded border border-slate-300"
                        style={{ backgroundColor: c }}
                        onClick={() => updateSelectedNode({ bgColor: c })}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedNode.type !== "image" && selectedNode.type !== "table" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">文字顏色</div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-8 w-16 rounded border border-slate-300"
                    value={selectedNode.textColor || "#1f2937"}
                    onChange={(e) => updateSelectedNode({ textColor: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-1">
                    {["#111827", "#1f2937", "#334155", "#0f172a", "#ef4444", "#2563eb", "#16a34a"].map((c) => (
                      <button
                        key={c}
                        className="h-6 w-6 rounded border border-slate-300"
                        style={{ backgroundColor: c }}
                        onClick={() => updateSelectedNode({ textColor: c })}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mb-0.5 text-[11px] text-slate-500">邊框顏色</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-16 rounded border border-slate-300"
                  value={selectedNode.borderColor || "#cbd5e1"}
                  onChange={(e) => updateSelectedNode({ borderColor: e.target.value })}
                />
                <div className="flex flex-wrap gap-1">
                  {["#e2e8f0", "#cbd5e1", "#94a3b8", "#64748b", "#334155", "#2563eb", "#16a34a"].map((c) => (
                    <button
                      key={c}
                      className="h-6 w-6 rounded border border-slate-300"
                      style={{ backgroundColor: c }}
                      onClick={() => updateSelectedNode({ borderColor: c })}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-0.5 text-[11px] text-slate-500">邊框粗細</div>
              <input
                type="number"
                min={0}
                max={6}
                step={0.5}
                className="w-full rounded border border-slate-300 p-1 text-[12px]"
                value={selectedNode.borderWidth ?? 1}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  updateSelectedNode({ borderWidth: Number.isFinite(v) ? v : 1 });
                }}
              />
            </div>

            {selectedNode.type !== "image" && selectedNode.type !== "table" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">文字大小</div>
                <input
                  type="number"
                  min={8}
                  max={48}
                  className="w-full rounded border border-slate-300 p-1 text-[12px]"
                  value={selectedNode.fontSize || 14}
                  onChange={(e) => updateSelectedNode({ fontSize: Number(e.target.value) || 14 })}
                />
              </div>
            )}

            {selectedNode.type !== "image" && selectedNode.type !== "table" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">文字對齊</div>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      className={`flex-1 rounded border px-2 py-1 text-[11px] ${
                        (selectedNode.textAlign || "left") === align
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white"
                      }`}
                      onClick={() => updateSelectedNode({ textAlign: align })}
                    >
                      {align === "left" ? "靠左" : align === "center" ? "置中" : "靠右"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.type !== "image" && selectedNode.type !== "table" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">字重</div>
                <select
                  className="w-full rounded border border-slate-300 p-1 text-[12px]"
                  value={selectedNode.fontWeight ?? 400}
                  onChange={(e) => updateSelectedNode({ fontWeight: Number(e.target.value) || 400 })}
                >
                  <option value={300}>Light</option>
                  <option value={400}>Regular</option>
                  <option value={500}>Medium</option>
                  <option value={600}>Semibold</option>
                  <option value={700}>Bold</option>
                </select>
              </div>
            )}

            {selectedNode.type !== "image" && selectedNode.type !== "table" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">文字陰影</div>
                <select
                  className="w-full rounded border border-slate-300 p-1 text-[12px]"
                  value={selectedNode.textShadow || "none"}
                  onChange={(e) => updateSelectedNode({ textShadow: e.target.value })}
                >
                  <option value="none">無</option>
                  <option value="0 1px 2px rgba(0,0,0,0.2)">柔和</option>
                  <option value="0 2px 4px rgba(0,0,0,0.25)">中度</option>
                  <option value="0 4px 8px rgba(0,0,0,0.3)">強烈</option>
                </select>
              </div>
            )}

            {selectedNode.type !== "image" && selectedNode.type !== "table" && (
              <div>
                <div className="mb-0.5 text-[11px] text-slate-500">文字透明度</div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    className="flex-1"
                    value={selectedNode.textOpacity ?? 1}
                    onChange={(e) => updateSelectedNode({ textOpacity: parseFloat(e.target.value) })}
                  />
                  <span className="w-12 text-right text-[11px] text-slate-500">{Math.round((selectedNode.textOpacity ?? 1) * 100)}%</span>
                </div>
              </div>
            )}

            <div>
              <div className="mb-0.5 text-[11px] text-slate-500">透明度</div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  className="flex-1"
                  value={selectedNode.opacity ?? 1}
                  onChange={(e) => updateSelectedNode({ opacity: parseFloat(e.target.value) })}
                />
                <span className="w-12 text-right text-[11px] text-slate-500">{Math.round((selectedNode.opacity ?? 1) * 100)}%</span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[12px]">
              <input
                type="checkbox"
                checked={!!selectedNode.locked}
                onChange={(e) => updateSelectedNode({ locked: e.target.checked })}
              />
              鎖定節點（不可拖曳/編輯）
            </label>
          </div>
        </div>

        <div>
          <div className="mb-1 text-xs text-slate-500">位置 / 尺寸</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-0.5 text-[11px] text-slate-500">X</div>
              <input type="number" className="w-full rounded border border-slate-300 p-1 text-[12px]" value={selectedNode.x} onChange={(e) => updateSelectedNode({ x: Number(e.target.value) || selectedNode.x })} />
            </div>
            <div>
              <div className="mb-0.5 text-[11px] text-slate-500">Y</div>
              <input type="number" className="w-full rounded border border-slate-300 p-1 text-[12px]" value={selectedNode.y} onChange={(e) => updateSelectedNode({ y: Number(e.target.value) || selectedNode.y })} />
            </div>
          </div>
        </div>

        {selectedNode.type === "table" && selectedNode.table && (
          <div>
            <div className="mb-1 text-xs text-slate-500">表格行數 / 列數</div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="mb-0.5 text-[11px] text-slate-500">行數 (rows)</div>
                <input type="number" min={1} max={50} className="w-full rounded border border-slate-300 p-1 text-[12px]" value={selectedNode.table.rows} onChange={(e) => updateTableSize(selectedNode.id, Number(e.target.value) || 1, selectedNode.table!.cols)} />
              </div>
              <div className="flex-1">
                <div className="mb-0.5 text-[11px] text-slate-500">列數 (cols)</div>
                <input type="number" min={1} max={50} className="w-full rounded border border-slate-300 p-1 text-[12px]" value={selectedNode.table.cols} onChange={(e) => updateTableSize(selectedNode.id, selectedNode.table!.rows, Number(e.target.value) || 1)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
