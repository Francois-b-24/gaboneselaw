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
    <div className="flex w-fit items-center rounded-full border border-primary/10 bg-secondary/50 p-1.5">
      {tabs.map(({ label }, index) => {
        const isActive = activeTab === label;
        return (
          <button
            key={index}
            onClick={() => handleSelect(label)}
            className={`h-8 rounded-full px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 ${
              isActive
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                : "text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
            }`}
            type="button"
            aria-pressed={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
