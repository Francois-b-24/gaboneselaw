"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface MenuBarItem {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  label: string;
  value: string;
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuBarItem[];
  activeValue?: string;
  onValueChange?: (value: string) => void;
}

const springConfig = {
  duration: 0.3,
  ease: "easeInOut",
} as const;

export function MenuBar({
  items,
  className,
  activeValue,
  onValueChange,
  ...props
}: MenuBarProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ left: 0, width: 0 });
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const activeIndex = React.useMemo(() => {
    if (!activeValue) return hoveredIndex;
    const idx = items.findIndex((item) => item.value === activeValue);
    if (idx >= 0) return hoveredIndex ?? idx;
    return hoveredIndex;
  }, [activeValue, hoveredIndex, items]);

  React.useEffect(() => {
    if (activeIndex === null || !menuRef.current || !tooltipRef.current) {
      return;
    }

    const menuItem = menuRef.current.children[activeIndex] as HTMLElement | undefined;
    if (!menuItem) return;
    const menuRect = menuRef.current.getBoundingClientRect();
    const itemRect = menuItem.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const left = itemRect.left - menuRect.left + (itemRect.width - tooltipRect.width) / 2;

    setTooltipPosition({
      left: Math.max(0, Math.min(left, menuRect.width - tooltipRect.width)),
      width: tooltipRect.width,
    });
  }, [activeIndex]);

  return (
    <div className={cn("relative", className)} {...props}>
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={springConfig}
            className="pointer-events-none absolute left-0 right-0 -top-[31px] z-50"
          >
            <motion.div
              ref={tooltipRef}
              className={cn(
                "tooltip-animation inline-flex h-7 items-center justify-center overflow-hidden rounded-lg px-3",
                "border border-border/50 bg-background/95 backdrop-blur",
                "shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
              )}
              initial={{ x: tooltipPosition.left }}
              animate={{ x: tooltipPosition.left }}
              transition={springConfig}
              style={{ width: "auto" }}
              data-state="open"
            >
              <p className="text-[13px] font-medium leading-tight whitespace-nowrap">
                {items[activeIndex].label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={menuRef}
        className={cn(
          "z-10 inline-flex h-10 items-center justify-center gap-[3px] overflow-hidden rounded-full px-1.5",
          "border border-border/50 bg-background/95 backdrop-blur",
          "shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_8px_16px_-4px_rgba(0,0,0,0.1)]"
        )}
      >
        {items.map((item, index) => {
          const isSelected = item.value === activeValue;
          return (
            <button
              key={item.value}
              type="button"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full px-3 py-1 transition-colors",
                isSelected ? "bg-muted/80 text-[color:var(--foreground)]" : "hover:bg-muted/80"
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => onValueChange?.(item.value)}
              aria-label={item.label}
              aria-pressed={isSelected}
            >
              <div className="flex h-[18px] w-[18px] items-center justify-center overflow-hidden">
                <item.icon className="h-full w-full" />
              </div>
              <span className="sr-only">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
