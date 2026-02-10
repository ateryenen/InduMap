"use client";

import { useRef } from "react";
import type { BoardState } from "../types";

export function useBoardHistory(args: {
  getSnapshot: () => BoardState;
  applySnapshot: (s: BoardState) => void;
  onAfterRestore?: () => void;
  maxHistory?: number;
}) {
  const pastRef = useRef<BoardState[]>([]);
  const futureRef = useRef<BoardState[]>([]);

  const record = () => {
    pastRef.current.push(args.getSnapshot());
    const max = args.maxHistory ?? 100;
    if (pastRef.current.length > max) pastRef.current.shift();
    futureRef.current = [];
  };

  const undo = () => {
    if (!pastRef.current.length) return;
    const current = args.getSnapshot();
    const prev = pastRef.current.pop()!;
    futureRef.current.push(current);
    args.applySnapshot(prev);
    args.onAfterRestore?.();
  };

  const redo = () => {
    if (!futureRef.current.length) return;
    const current = args.getSnapshot();
    const next = futureRef.current.pop()!;
    pastRef.current.push(current);
    args.applySnapshot(next);
    args.onAfterRestore?.();
  };

  const clear = () => {
    pastRef.current = [];
    futureRef.current = [];
  };

  return {
    recordHistory: record,
    undo,
    redo,
    clearHistory: clear,
    // 保留給外部需要讀取長度（顯示 Undo 可用狀態）
    historyPastRef: pastRef,
    historyFutureRef: futureRef,
  };
}
