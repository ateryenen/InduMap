// components/whiteboard/canvas/WhiteboardNode.tsx
import React, { MouseEvent } from "react";
import type {
  Node,
  Tool,
  ResizeHandle,
  TableData,
} from "../../../lib/whiteboard/types";

interface WhiteboardNodeProps {
  node: Node;
  selected: boolean;
  currentTool: Tool;
  isEditing: boolean;
  onMouseDown: (e: MouseEvent<HTMLDivElement>, node: Node) => void;
  onResizeHandleMouseDown: (
    e: MouseEvent<HTMLDivElement>,
    node: Node,
    handle: ResizeHandle
  ) => void;
  onDoubleClick: (node: Node) => void;
  onInlineTextChange: (id: string, value: string) => void;
  onFinishEditing: () => void;
  onTableCellChange: (
    id: string,
    row: number,
    col: number,
    value: string
  ) => void;
}

export function WhiteboardNode(props: WhiteboardNodeProps) {
  const {
    node,
    selected,
    currentTool,
    isEditing,
    onMouseDown,
    onResizeHandleMouseDown,
    onDoubleClick,
    onInlineTextChange,
    onFinishEditing,
    onTableCellChange,
  } = props;

  const baseClasses =
    "absolute shadow-sm border leading-snug px-3 py-2 whitespace-pre-wrap cursor-pointer select-none";

  const borderColor = node.locked
    ? "border-slate-400 border-dashed"
    : selected
    ? "border-blue-500"
    : "border-slate-300";

  const textColor = node.textColor || "#1f2937";
  const textOpacity = node.textOpacity ?? 1;
  const textAlign = node.textAlign || "left";
  const fontWeight = node.fontWeight ?? 400;
  const textShadow = node.textShadow || "none";
  const borderStyle: React.CSSProperties = {
    borderWidth: node.borderWidth,
    ...( !selected && !node.locked ? { borderColor: node.borderColor } : {} ),
  };

  const isNote = node.type === "note";
  const showResize = selected && !isEditing && !node.locked;
  const canInlineEdit = node.type !== "image" && node.type !== "table";

  const handleBase =
    "absolute w-2 h-2 -mt-1 -ml-1 rounded-sm bg-blue-500 border border-white";

  const handleMouseDownWrapper =
    (handle: ResizeHandle) => (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onResizeHandleMouseDown(e, node, handle);
    };

  const handleNodeMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button === 1) return;
    e.stopPropagation();
    onMouseDown(e, node);
  };

  const handleDoubleClickNode = () => {
    if (!node.locked) {
      onDoubleClick(node);
    }
  };

  const renderTable = (table?: TableData) => {
    if (!table) return null;
    const rows = table.rows || table.cells.length;
    const cols = table.cols || (table.cells[0]?.length ?? 0);

    return (
      <table className="w-full border-collapse text-xs">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => {
                const value =
                  table.cells?.[r]?.[c] !== undefined
                    ? table.cells[r][c]
                    : "";
                return (
                  <td
                    key={c}
                    className="border border-slate-300 bg-white/80 px-1 py-0.5"
                  >
                    <input
                      className="w-full border-none bg-transparent p-0 text-[11px] outline-none"
                      value={value}
                      onChange={(e) =>
                        onTableCellChange(node.id, r, c, e.target.value)
                      }
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const content = (() => {
    if (node.type === "image" && node.imageUrl) {
  const crop = node.imageCrop;

  // 若 crop 不存在或等同全圖，就以完整顯示
  const isFull =
    !crop ||
    (Math.abs(crop.x) < 1e-6 &&
      Math.abs(crop.y) < 1e-6 &&
      Math.abs(crop.w - 1) < 1e-6 &&
      Math.abs(crop.h - 1) < 1e-6);

  if (isFull) {
    return (
      <img
        src={node.imageUrl}
        alt={node.text || ""}
        className="h-full w-full rounded-lg object-contain pointer-events-none select-none"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
    );
  }

  const safeW = Math.max(1e-6, crop!.w);
  const safeH = Math.max(1e-6, crop!.h);
  const sx = 1 / safeW;
  const sy = 1 / safeH;

  // 先 translate 到 crop 左上角，再 scale 放大
  const tx = -crop!.x * 100;
  const ty = -crop!.y * 100;

  return (
    <div className="h-full w-full overflow-hidden rounded-lg bg-white">
      <img
        src={node.imageUrl}
        alt={node.text || ""}
        className="h-full w-full pointer-events-none select-none"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        style={{
          objectFit: "cover",
          transformOrigin: "top left",
          transform: `translate(${tx}%, ${ty}%) scale(${sx}, ${sy})`,
        }}
      />
    </div>
  );
}

    if (node.type === "table") {
      return renderTable(node.table);
    }

    if (isEditing && canInlineEdit) {
      return (
        <textarea
          className="h-full w-full resize-none border-none bg-transparent p-0 leading-snug outline-none"
          style={{ fontSize: node.fontSize ?? 12, color: textColor, opacity: textOpacity, textAlign, fontWeight, textShadow }}
          autoFocus
          defaultValue={node.text || ""}
          onChange={(e) => onInlineTextChange(node.id, e.target.value)}
          onBlur={onFinishEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onFinishEditing();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onFinishEditing();
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <div
        className="h-full w-full overflow-hidden"
        style={{ fontSize: node.fontSize ?? 12, color: textColor, opacity: textOpacity, textAlign, fontWeight, textShadow }}
      >
        {node.text}
      </div>
    );
  })();

  const applyAlphaToColor = (color: string, alpha: number) => {
    if (alpha >= 1) return color;
    if (!color) return color;
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const isShort = hex.length === 3;
      const r = parseInt(isShort ? hex[0] + hex[0] : hex.slice(0, 2), 16);
      const g = parseInt(isShort ? hex[1] + hex[1] : hex.slice(2, 4), 16);
      const b = parseInt(isShort ? hex[2] + hex[2] : hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  const baseBg = node.bgColor || (isNote ? "#fef9c3" : "#ffffff");
  const typeStyle: React.CSSProperties = (() => {
    switch (node.type) {
      case "group":
        return { borderRadius: 8, borderStyle: "dashed" };
      case "tag":
        return { borderRadius: 9999 };
      case "icon":
        return { borderRadius: 16 };
      case "milestone":
        return { borderRadius: 12 };
      case "kpi":
        return { borderRadius: 12 };
      case "owner":
        return { borderRadius: 12 };
      case "callout":
        return { borderRadius: 10, borderLeftWidth: Math.max(3, node.borderWidth ?? 1) };
      case "flow-process":
        return { borderRadius: 8 };
      case "flow-terminator":
        return { borderRadius: 9999 };
      case "flow-decision":
        return { clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" };
      default:
        return { borderRadius: 16 };
    }
  })();

  const bgStyle: React.CSSProperties = {
    backgroundColor: applyAlphaToColor(baseBg, node.opacity ?? 1),
  };

  return (
    <div
      className={`${baseClasses} ${borderColor} ${
        isNote ? "shadow-md" : ""
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        ...bgStyle,
        ...borderStyle,
        ...typeStyle,
      }}
      onMouseDown={handleNodeMouseDown}
      onDoubleClick={handleDoubleClickNode}
    >
      {content}

      {showResize && (
        <>
          <div
            className={`${handleBase} cursor-nwse-resize`}
            style={{ left: 0, top: 0 }}
            onMouseDown={handleMouseDownWrapper("top-left")}
          />
          <div
            className={`${handleBase} cursor-nesw-resize`}
            style={{ left: "100%", top: 0 }}
            onMouseDown={handleMouseDownWrapper("top-right")}
          />
          <div
            className={`${handleBase} cursor-nesw-resize`}
            style={{ left: 0, top: "100%" }}
            onMouseDown={handleMouseDownWrapper("bottom-left")}
          />
          <div
            className={`${handleBase} cursor-nwse-resize`}
            style={{ left: "100%", top: "100%" }}
            onMouseDown={handleMouseDownWrapper("bottom-right")}
          />

          <div
            className={`${handleBase} h-1 w-3 cursor-ns-resize`}
            style={{ left: "50%", top: 0, marginLeft: -6, marginTop: -2 }}
            onMouseDown={handleMouseDownWrapper("top")}
          />
          <div
            className={`${handleBase} h-1 w-3 cursor-ns-resize`}
            style={{
              left: "50%",
              top: "100%",
              marginLeft: -6,
              marginTop: -2,
            }}
            onMouseDown={handleMouseDownWrapper("bottom")}
          />
          <div
            className={`${handleBase} h-3 w-1 cursor-ew-resize`}
            style={{ left: 0, top: "50%", marginLeft: -2, marginTop: -6 }}
            onMouseDown={handleMouseDownWrapper("left")}
          />
          <div
            className={`${handleBase} h-3 w-1 cursor-ew-resize`}
            style={{
              left: "100%",
              top: "50%",
              marginLeft: -2,
              marginTop: -6,
            }}
            onMouseDown={handleMouseDownWrapper("right")}
          />
        </>
      )}
    </div>
  );
}
