"use client";

import React from "react";

export function ArrangeMenu(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {props.children}
    </div>
  );
}
