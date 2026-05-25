import type { ReactNode } from "react";

type StatBlockProps = {
  value: ReactNode;
  label: ReactNode;
};

/** Chiffre en exergue : valeur serif XXL + label en eyebrow. */
export function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div>
      <p className="font-serif text-6xl md:text-7xl text-ink leading-none tracking-tight">
        {value}
      </p>
      <p className="eyebrow mt-4">{label}</p>
    </div>
  );
}
