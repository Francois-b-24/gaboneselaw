import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionTitleSize = "lg" | "xl" | "2xl";

type SectionTitleProps = {
  children: ReactNode;
  /** Fragment en italique terra (différence clé ALIN vs LexGabon). */
  accent?: ReactNode;
  size?: SectionTitleSize;
  className?: string;
};

const sizes: Record<SectionTitleSize, string> = {
  lg: "text-4xl md:text-5xl",
  xl: "text-5xl md:text-7xl",
  "2xl": "text-6xl md:text-8xl lg:text-9xl",
};

export function SectionTitle({
  children,
  accent,
  size = "xl",
  className,
}: SectionTitleProps) {
  return (
    <h2
      className={cn(
        "font-serif leading-[1.05] tracking-tight max-w-4xl",
        sizes[size],
        className,
      )}
    >
      {children}
      {accent ? (
        <em className="accent-italic block md:inline md:ml-3 mt-1 md:mt-0">
          {accent}
        </em>
      ) : null}
    </h2>
  );
}
