"use client";

import React from "react";

export type TopMenuKey = "file" | "view" | "insert" | "arrange" | "strategy" | "help" | null;

export function TopMenu(props: {
  active: TopMenuKey;
  onToggle: (k: Exclude<TopMenuKey, null>) => void;
}) {
  const { active, onToggle } = props;

  const Btn = ({ k, label }: { k: Exclude<TopMenuKey, null>; label: string }) => (
    <button
      className={`rounded border px-3 py-1 text-sm ${
        active === k ? "border-slate-800 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800"
      }`}
      onClick={() => onToggle(k)}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2">
      <Btn k="file" label="File" />
      <Btn k="view" label="View" />
      <Btn k="insert" label="Insert" />
      <Btn k="arrange" label="Arrange" />
      <Btn k="strategy" label="Strategy" />
      <Btn k="help" label="Help" />
    </div>
  );
}
