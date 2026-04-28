"use client";

import { useState } from "react";

import { MenuBar } from "@/components/ui/bottom-menu";

const Demo = () => {
  const [active, setActive] = useState("chat");
  return (
    <div className="flex items-center justify-center p-6">
      <MenuBar
        items={[
          {
            label: "Chat",
            value: "chat",
            icon: (props) => (
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
                <path d="M9 1.75C4.996 1.75 1.75 4.996 1.75 9c0 1.319.358 2.552.973 3.617.43.806-.053 2.712-.973 3.633 1.25.068 2.897-.497 3.633-.973.489.282 1.264.656 2.279.848.433.082.881.125 1.338.125 4.004 0 7.25-3.246 7.25-7.25S13.004 1.75 9 1.75Z" />
              </svg>
            ),
          },
          {
            label: "Cours",
            value: "lesson",
            icon: (props) => (
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
                <rect x="3" y="2.5" width="12" height="13" rx="2" />
                <path d="M6 6h6M6 9h6M6 12h4" />
              </svg>
            ),
          },
          {
            label: "Exercices",
            value: "exercise",
            icon: (props) => (
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
                <path d="M3 4.5h12M3 9h12M3 13.5h8" />
              </svg>
            ),
          },
          {
            label: "Correction",
            value: "correction",
            icon: (props) => (
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
                <path d="m4 9 3 3 7-7" />
                <circle cx="9" cy="9" r="7" />
              </svg>
            ),
          },
        ]}
        activeValue={active}
        onValueChange={setActive}
      />
    </div>
  );
};

export { Demo };
