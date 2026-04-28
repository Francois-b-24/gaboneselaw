"use client";

import * as React from "react";
import { useState } from "react";

export interface AnimatedTabsProps {
  tabs: { label: string }[];
  activeLabel?: string;
  onChange?: (label: string) => void;
}

export function AnimatedTabs({ tabs, activeLabel, onChange }: AnimatedTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(tabs[0]?.label ?? "");
  const activeTab = activeLabel ?? internalActiveTab;

  const handleSelect = (label: string) => {
    setInternalActiveTab(label);
    onChange?.(label);
  };

  return (
    <div className="mx-auto flex w-fit items-center rounded-full border border-primary/10 bg-secondary/50 p-1.5">
      {tabs.map(({ label }, index) => {
        const isActive = activeTab === label;
        return (
          <button
            key={index}
            onClick={() => handleSelect(label)}
            className={`h-8 rounded-full px-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-slate-900 text-white shadow-sm"
                : "text-muted-foreground hover:bg-slate-900/10 hover:text-[color:var(--foreground)]"
            }`}
            type="button"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
