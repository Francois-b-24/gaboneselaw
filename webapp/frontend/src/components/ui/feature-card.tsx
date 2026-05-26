import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: ReactNode;
  description: ReactNode;
  tags?: string[];
  href?: string;
  /** Lien externe : ouvre dans un onglet, ajoute le glyphe ↗ et un aria-label. */
  external?: boolean;
  className?: string;
};

export function FeatureCard({
  title,
  description,
  tags,
  href,
  external,
  className,
}: FeatureCardProps) {
  const content = (
    <>
      {/* Glyphe ALIN — distinct du ◇ de LexGabon. */}
      <div aria-hidden className="text-terra/70 text-2xl mb-6 font-serif">
        ❖
      </div>
      <h3 className="font-serif text-2xl mb-3 leading-tight group-hover:text-terra-deep">
        {title}
        {external ? <span aria-hidden> ↗</span> : null}
      </h3>
      <p className="text-muted leading-relaxed mb-6 text-[15px]">{description}</p>
      {tags && tags.length > 0 ? (
        <div className="flex flex-wrap gap-x-2 text-xs uppercase tracking-wider text-muted">
          {tags.map((tag, i) => (
            <span key={tag}>
              {i > 0 && <span className="mr-2">·</span>}
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );

  const cardClass = cn(
    "group block border border-border-soft p-8 transition-all duration-300 hover:border-terra/40 hover:bg-paper-warm",
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        className={cardClass}
        {...(external
          ? {
              target: "_blank",
              rel: "noopener noreferrer",
              "aria-label":
                typeof title === "string"
                  ? `${title} (ouvre un nouvel onglet)`
                  : undefined,
            }
          : {})}
      >
        {content}
      </a>
    );
  }

  return <article className={cardClass}>{content}</article>;
}
