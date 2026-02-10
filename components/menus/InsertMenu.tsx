"use client";

import React from "react";

export function InsertMenu(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {props.children}
    </div>
  );
}
