"use client";

import React from "react";
import { GridBackground } from "../whiteboard/canvas/GridBackground";
import EdgeLayer from "../whiteboard/canvas/EdgeLayer";
import FreeDrawLayer from "../whiteboard/canvas/FreeDrawLayer";
import { WhiteboardNode } from "../whiteboard/canvas/WhiteboardNode";
import { MiniMap } from "../whiteboard/canvas/MiniMap";

export default function CanvasArea({ ctx }: { ctx: any }) {
  const {
    containerRef,
    canvasRef,
    worldStyle,
    nodes,
    edges,
    connectingFrom,
    connectingTo,
    guideLines,
    viewport,
    selectionRect,
    selectedIds,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleWheel,
    handleDragOver,
    handleDrop,
    editingId,
    tool,
    setSelectedIds,
    setPrimaryId,
    setEditingId,
    strokes,
    setStrokes,
    penColor,
    penWidth,
    penOpacity,
  } = ctx;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-1 overflow-hidden bg-slate-100"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <GridBackground viewport={viewport} />

      <div ref={canvasRef} className="absolute left-0 top-0 h-[4000px] w-[4000px]" style={worldStyle}>
        <EdgeLayer 
          nodes={nodes || []} 
          edges={edges || []} 
          connectingFrom={connectingFrom} 
          connectingTo={connectingTo}
          selectedEdgeId={ctx.selectedEdgeId}
          selectedIds={selectedIds || []}
          onEdgeClick={ctx.handleEdgeClick}
          onEdgePointDrag={(edgeId, pointType, anchor) => {
            // 更新边线的锚点位置
            ctx.setEdges?.((prev) =>
              prev.map((e) =>
                e.id === edgeId
                  ? {
                      ...e,
                      [pointType === 'from' ? 'fromAnchor' : 'toAnchor']: anchor,
                    }
                  : e
              )
            );
          }}
          onEdgePointReset={(edgeId, pointType) => {
            // 双击重置：清除自定义锚点
            ctx.setEdges?.((prev) =>
              prev.map((e) =>
                e.id === edgeId
                  ? {
                      ...e,
                      [pointType === 'from' ? 'fromAnchor' : 'toAnchor']: undefined,
                    }
                  : e
              )
            );
          }}
        />

        {guideLines.v !== undefined && (
          <div
            className="pointer-events-none absolute top-0 h-full w-px bg-purple-400"
            style={{ left: guideLines.v * viewport.scale + viewport.x }}
          />
        )}

        {guideLines.h !== undefined && (
          <div
            className="pointer-events-none absolute left-0 w-full border-t border-purple-400"
            style={{ top: guideLines.h * viewport.scale + viewport.y }}
          />
        )}

        {(nodes || []).map((node: any) => (
          <WhiteboardNode
            key={node.id}
            node={node}
            selected={(selectedIds || []).includes(node.id)}
            currentTool={tool}
            isEditing={editingId === node.id}
            onMouseDown={(e: any, n: any) => {
              // forward to page handler via ctx (page binds handler on ctx)
              if (ctx.handleNodeClick) ctx.handleNodeClick(n.id, e);
            }}
            onResizeHandleMouseDown={(e: any, n: any, h: any) => ctx.handleResizeHandleMouseDown?.(e, n, h)}
            onDoubleClick={(n: any) => ctx.handleDoubleClickNode?.(n)}
            onInlineTextChange={(id: string, v: string) => ctx.handleInlineTextChange?.(id, v)}
            onFinishEditing={() => ctx.handleFinishEditing?.()}
            onTableCellChange={(nodeId: string, row: number, col: number, value: string) => ctx.handleTableCellChange?.(nodeId, row, col, value)}
          />
        ))}
        
        {/* 臨時群組包圍框 - 當多選時顯示 */}
        {selectedIds && selectedIds.length > 1 && (() => {
          const selectedNodes = (nodes || []).filter((n: any) => selectedIds.includes(n.id));
          if (selectedNodes.length < 2) return null;
          
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          selectedNodes.forEach((n: any) => {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + n.width);
            maxY = Math.max(maxY, n.y + n.height);
          });
          
          const padding = 8;
          return (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-blue-500"
              style={{
                left: minX - padding,
                top: minY - padding,
                width: maxX - minX + padding * 2,
                height: maxY - minY + padding * 2,
              }}
            >
              {/* 四角控制點 */}
              <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-blue-500 border border-white" />
              <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500 border border-white" />
              <div className="absolute -left-1 -bottom-1 h-2 w-2 rounded-full bg-blue-500 border border-white" />
              <div className="absolute -right-1 -bottom-1 h-2 w-2 rounded-full bg-blue-500 border border-white" />
              
              {/* 群組標籤 */}
              <div className="absolute -top-5 left-0 rounded bg-blue-500 px-2 py-0.5 text-[10px] text-white whitespace-nowrap">
                群組 ({selectedIds.length} 個物件)
              </div>
            </div>
          );
        })()}
      </div>

      <FreeDrawLayer
        viewport={viewport}
        isPenActive={tool === "pen"}
        strokes={strokes}
        setStrokes={setStrokes}
        penColor={penColor}
        penWidth={penWidth}
        penOpacity={penOpacity}
        minDistance={3}
      />

      {selectionRect && (() => {
        // AutoCAD 風格：左→右藍色（Window），右→左綠色（Crossing）
        const isWindowSelection = selectionRect.x2 > selectionRect.x1;
        const borderColor = isWindowSelection ? 'border-blue-400' : 'border-green-400';
        const bgColor = isWindowSelection ? 'bg-blue-200/20' : 'bg-green-200/20';
        
        return (
          <div
            className={`pointer-events-none absolute border ${borderColor} ${bgColor}`}
            style={{
              left: Math.min(selectionRect.x1, selectionRect.x2),
              top: Math.min(selectionRect.y1, selectionRect.y2),
              width: Math.abs(selectionRect.x2 - selectionRect.x1),
              height: Math.abs(selectionRect.y2 - selectionRect.y1),
            }}
          />
        );
      })()}

      <MiniMap nodes={nodes} viewport={viewport} containerRef={containerRef} />
    </div>
  );
}
