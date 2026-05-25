import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EyebrowProps = {
  children: ReactNode;
  className?: string;
};

/** Sur-titre de section : capitales espacées, sobre. Grammaire partagée LexGabon. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return <p className={cn("eyebrow mb-8", className)}>{children}</p>;
}
