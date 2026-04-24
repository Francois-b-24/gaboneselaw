"use client";

import { CSSProperties, useEffect, useRef } from "react";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delayMs?: number;
};

function isCoarseOrNarrowViewport(): boolean {
  if (typeof window === "undefined") return false;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return narrow || coarse;
}

function visibleRatioInViewport(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, vh);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  return visibleHeight / Math.max(rect.height, 1);
}

export function RevealOnScroll({
  children,
  className,
  id,
  delayMs = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLElement | null>(null);
  const visibleRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const clearHideTimer = () => {
      if (hideTimerRef.current !== null) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const applyShow = () => {
      clearHideTimer();
      visibleRef.current = true;
      node.classList.remove("is-visible");
      void node.offsetWidth;
      node.classList.add("is-visible");
    };

    const applyHide = () => {
      clearHideTimer();
      visibleRef.current = false;
      node.classList.remove("is-visible");
    };

    const rootMargin = isCoarseOrNarrowViewport()
      ? "0px 0px -10% 0px"
      : "0px 0px -6% 0px";

    const observer = new IntersectionObserver(
      ([entry]) => {
        const mobile = isCoarseOrNarrowViewport();
        const showThreshold = mobile ? 0.3 : 0.2;
        const hideThreshold = mobile ? 0.045 : 0.075;

        const shouldShow =
          entry.isIntersecting && entry.intersectionRatio >= showThreshold;
        const shouldHide = entry.intersectionRatio <= hideThreshold;

        if (shouldShow) {
          clearHideTimer();
          if (!visibleRef.current) {
            applyShow();
          }
          return;
        }

        if (!visibleRef.current || !shouldHide) {
          return;
        }

        if (mobile) {
          if (hideTimerRef.current !== null) return;
          hideTimerRef.current = setTimeout(() => {
            hideTimerRef.current = null;
            const el = ref.current;
            if (!el || !visibleRef.current) return;
            const ratio = visibleRatioInViewport(el);
            if (ratio > hideThreshold) return;
            applyHide();
          }, 160);
        } else {
          applyHide();
        }
      },
      {
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1],
        rootMargin,
      }
    );

    observer.observe(node);
    return () => {
      clearHideTimer();
      observer.disconnect();
    };
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
