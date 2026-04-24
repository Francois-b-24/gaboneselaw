"use client";

import { CSSProperties, useEffect, useRef } from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delayMs?: number;
};

export function RevealOnScroll({
  children,
  className,
  id,
  delayMs = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLElement | null>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hystérésis pour éviter les bascules rapides (effet "tremblement")
        // quand la section est proche du seuil de visibilité.
        const shouldShow = entry.intersectionRatio >= 0.24;
        const shouldHide = entry.intersectionRatio <= 0.08;

        if (!visibleRef.current && shouldShow) {
          visibleRef.current = true;
          node.classList.add("is-visible");
        } else if (visibleRef.current && shouldHide) {
          visibleRef.current = false;
          node.classList.remove("is-visible");
        }
      },
      { threshold: [0, 0.08, 0.24, 0.5, 1], rootMargin: "-6% 0px -6% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`reveal-section ${className ?? ""}`.trim()}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </section>
  );
}
