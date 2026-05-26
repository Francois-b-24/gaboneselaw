import type { ReactNode } from "react";

type StatBlockProps = {
  value: ReactNode;
  label: ReactNode;
};

/** Chiffre en exergue : valeur serif XXL + label en eyebrow. */
export function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div className="min-w-0">
      <p className="font-serif text-4xl text-ink leading-none tracking-tight sm:text-5xl md:text-7xl">
        {value}
      </p>
      <p className="eyebrow mt-4">{label}</p>
    </div>
  );
}
