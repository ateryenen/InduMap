"use client";

import React from "react";
import type { StrategyTemplateKey } from "../../lib/whiteboard/strategyTemplates";

export function StrategyBar(props: {
  templates: { key: StrategyTemplateKey; label: string }[];
  onApply: (key: StrategyTemplateKey) => void;
}) {
  const { templates, onApply } = props;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {templates.map((t) => (
        <button
          key={t.key}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
          onClick={() => onApply(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
