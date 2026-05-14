"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LinkedInIcon } from "@/components/linkedin-icon";
import { TranslatedLink } from "@/components/translated-link";
import Globe from "@/components/ui/globe";
import { BLOG_ARTICLES } from "@/data/blog-articles";
import { cn } from "@/lib/utils";

type SectionAction = {
  label: string;
  variant: "primary" | "secondary";
  onClick?: () => void;
};

type SectionFeature = {
  title: string;
  description: string;
  /** Lien interne (ex. article de blog) */
  href?: string;
};

function blogFeatureFromSlug(slug: string): SectionFeature {
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);
  if (!article) {
    return { title: "", description: "" };
  }
  return {
    title: article.title,
    description: article.excerpt,
    href: `/blog/${article.slug}`,
  };
}

type SectionExternalLink = {
  href: string;
  /** Texte du lien, ou libellé d’accessibilité si `icon` est défini. */
  label: string;
  icon?: "linkedin";
};

type SectionPortrait = {
  src: string;
  alt: string;
};

type LandingSection = {
  id: string;
  badge?: string;
  title: ReactNode;
  subtitle?: string;
  description: string;
  /** Portrait optionnel (ex. section À propos). */
  portrait?: SectionPortrait;
  paragraphs?: string[];
  links?: SectionExternalLink[];
  backgroundImage?: string;
  align?: "left" | "center" | "right";
  features?: SectionFeature[];
  actions?: SectionAction[];
};

interface ScrollGlobeProps {
  sections: LandingSection[];
  globeConfig?: {
    positions: {
      top: string;
      left: string;
      scale: number;
    }[];
  };
  className?: string;
}

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },
    { top: "25%", left: "50%", scale: 0.9 },
    { top: "15%", left: "90%", scale: 2 },
    { top: "50%", left: "50%", scale: 1.8 },
    { top: "68%", left: "15%", scale: 1.2 },
    { top: "35%", left: "20%", scale: 1.3 },
  ],
};

const parsePercent = (str: string): number => Number.parseFloat(str.replace("%", ""));

function ScrollGlobe({
  sections,
  globeConfig = defaultGlobeConfig,
  className,
}: ScrollGlobeProps) {
  const initialPosition = globeConfig.positions[0];
  const initialTransform = `translate3d(${parsePercent(initialPosition.left)}vw, ${parsePercent(initialPosition.top)}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPosition.scale}, ${initialPosition.scale}, 1)`;
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState(initialTransform);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map((pos) => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale,
    }));
  }, [globeConfig.positions]);

  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / Math.max(docHeight, 1), 0), 1);
    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Number.POSITIVE_INFINITY;

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const rect = ref.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const distance = Math.abs(sectionCenter - viewportCenter);
      if (distance < minDistance) {
        minDistance = distance;
        newActiveSection = index;
      }
    });

    const currentPos =
      calculatedPositions[newActiveSection % calculatedPositions.length];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      animationFrameId.current = requestAnimationFrame(() => {
        updateScrollPosition();
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    animationFrameId.current = requestAnimationFrame(() => {
      updateScrollPosition();
    });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full max-w-screen overflow-x-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className="fixed left-0 top-0 z-50 h-0.5 w-full bg-gradient-to-r from-border/20 via-border/40 to-border/20">
        <div
          className="h-full bg-gradient-to-r from-primary via-blue-600 to-blue-900 shadow-sm will-change-transform"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: "left center",
            transition: "transform 0.15s ease-out",
            filter: "drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))",
          }}
        />
      </div>

      <div className="fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 sm:flex lg:right-8">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {sections.map((section, index) => (
            <div key={section.id} className="group relative">
              <div
                className={cn(
                  "nav-label absolute right-5 top-1/2 -translate-y-1/2 rounded-md border border-border/60 bg-background/95 px-2 py-1 text-xs font-medium whitespace-nowrap shadow-xl backdrop-blur-md sm:right-6 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-sm lg:right-8 lg:px-4 lg:py-2",
                  activeSection === index ? "animate-fadeOut" : "opacity-0",
                )}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary animate-pulse sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2" />
                  <span>{section.badge || `Section ${index + 1}`}</span>
                </div>
              </div>
              <button
                onClick={() =>
                  sectionRefs.current[index]?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  })
                }
                className={cn(
                  "relative h-2 w-2 rounded-full border-2 transition-all duration-300 hover:scale-125 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3",
                  "before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300",
                  activeSection === index
                    ? "border-primary bg-primary shadow-lg before:animate-ping before:bg-primary/20"
                    : "border-muted-foreground/40 bg-transparent hover:border-primary/60 hover:bg-primary/10",
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>
        <div className="absolute -z-10 left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/20 to-transparent lg:w-px" />
      </div>

      <div
        className="pointer-events-none fixed z-10 transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform"
        style={{
          transform: globeTransform,
          filter: `opacity(${activeSection === sections.length - 1 ? 0.25 : 0.42})`,
        }}
      >
        <div className="scale-75 sm:scale-90 lg:scale-100">
          <Globe />
        </div>
      </div>

      {sections.map((section, index) => (
        <section
          id={section.id}
          key={section.id}
          ref={(el) => {
            sectionRefs.current[index] = el;
          }}
          className={cn(
            "relative z-20 flex min-h-screen w-full max-w-full flex-col justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16 md:px-8 lg:px-12 lg:py-20",
            section.align === "center" && "items-center text-center",
            section.align === "right" && "items-end text-right",
            section.align !== "center" && section.align !== "right" && "items-start text-left",
          )}
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-300/20 bg-slate-950/72 p-5 text-slate-50 shadow-2xl backdrop-blur-sm opacity-100 transition-all duration-700 will-change-transform sm:max-w-lg sm:p-6 md:max-w-2xl lg:max-w-4xl lg:p-8 xl:max-w-5xl">
            <h2
              className={cn(
                "font-bold leading-[1.1] tracking-tight",
                section.portrait ? "mb-4 sm:mb-5" : "mb-6 sm:mb-8",
                index === 0
                  ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
                  : "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl",
              )}
            >
              {section.subtitle ? (
                <div className="space-y-1 sm:space-y-2">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent">
                    {section.title}
                  </div>
                  <div className="text-[0.6em] font-medium tracking-wider text-slate-300 sm:text-[0.7em]">
                    {section.subtitle}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent">
                  {section.title}
                </div>
              )}
            </h2>

            {section.portrait ? (
              <div
                className={cn(
                  "mb-6 sm:mb-8",
                  section.align === "center" && "flex justify-center",
                  section.align === "right" && "flex justify-end",
                )}
              >
                <Image
                  src={section.portrait.src}
                  alt={section.portrait.alt}
                  width={320}
                  height={320}
                  className="h-28 w-28 rounded-full object-cover shadow-lg ring-2 ring-slate-300/35 sm:h-36 sm:w-36"
                  sizes="(max-width: 640px) 112px, 144px"
                />
              </div>
            ) : null}

            <div
              className={cn(
                "mb-8 text-base font-light leading-relaxed text-slate-200 sm:mb-10 sm:text-lg lg:text-xl",
                section.align === "center" ? "mx-auto max-w-full text-center" : "max-w-full",
              )}
            >
              <p className="mb-3 sm:mb-4">{section.description}</p>
            </div>

            {!!(section.paragraphs?.length || section.links?.length) && (
              <div
                className="mb-8 space-y-4 rounded-xl border border-slate-300/25 bg-slate-950/45 p-4 text-sm leading-relaxed text-slate-100 backdrop-blur-sm sm:mb-10 sm:p-6 sm:text-base"
                style={
                  section.backgroundImage
                    ? {
                        backgroundImage: `linear-gradient(to bottom right, rgba(2, 6, 23, 0.88), rgba(15, 23, 42, 0.8)), url(${section.backgroundImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {section.paragraphs?.map((paragraph, idx) => (
                  <p key={`${section.id}-paragraph-${idx}`}>{paragraph}</p>
                ))}
                {section.links?.map((link) => (
                  <p
                    key={link.href}
                    className={cn(
                      "border-t border-slate-300/20 pt-4",
                      section.align === "center" && "text-center",
                    )}
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.icon ? link.label : undefined}
                      className={cn(
                        "inline-flex items-center justify-center transition-colors",
                        link.icon === "linkedin"
                          ? "rounded-md text-[#0A66C2] hover:text-[#004182] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                          : "font-medium text-primary underline-offset-4 hover:text-primary/90 hover:underline",
                      )}
                    >
                      {link.icon === "linkedin" ? (
                        <LinkedInIcon className="h-9 w-9 sm:h-10 sm:w-10" />
                      ) : (
                        link.label
                      )}
                    </a>
                  </p>
                ))}
              </div>
            )}

            {!!section.features?.length && (
              <div className="mb-8 grid gap-3 sm:mb-10 sm:gap-4">
                {section.features.map((feature) => {
                  const cardClass =
                    "group rounded-lg border border-slate-300/20 bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-slate-800/70 hover:shadow-lg hover:shadow-primary/20 sm:rounded-xl sm:p-5 lg:p-6";
                  const inner = (
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60 transition-colors group-hover:bg-primary sm:mt-2 sm:h-2 sm:w-2" />
                      <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                        <h3 className="text-base font-semibold text-slate-100 sm:text-lg">
                          {feature.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                  return feature.href ? (
                    <TranslatedLink
                      key={feature.href}
                      href={feature.href}
                      className={`${cardClass} block cursor-pointer no-underline outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950`}
                    >
                      {inner}
                    </TranslatedLink>
                  ) : (
                    <div key={feature.title} className={cardClass}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}

            {!!section.actions?.length && (
              <div
                className={cn(
                  "flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4",
                  section.align === "center" && "justify-center",
                  section.align === "right" && "justify-end",
                  (!section.align || section.align === "left") && "justify-start",
                )}
              >
                {section.actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "group relative w-full rounded-lg px-6 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-primary/20 focus:outline-none active:scale-[0.98] sm:w-auto sm:rounded-xl sm:px-8 sm:py-4 sm:text-base",
                      action.variant === "primary"
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30"
                        : "border-2 border-slate-300/40 bg-slate-900/45 text-slate-100 backdrop-blur-sm hover:border-primary/50 hover:bg-slate-800/60",
                    )}
                  >
                    <span className="relative z-10">{action.label}</span>
                    {action.variant === "primary" ? (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:rounded-xl" />
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function LandingPage() {
  const goTo = (href: string) => {
    window.location.href = href;
  };

  const sections: LandingSection[] = [
    {
      id: "hero",
      badge: "Accueil",
      title: "Rendre le droit africain",
      subtitle: "clair, utile et partagé",
      description:
        "African Legal Innovation Network vulgarise et connecte les informations juridiques à travers le continent, pour un langage accessible, fiable et ancré dans les réalités africaines.",
      align: "left",
      actions: [
        {
          label: "À propos",
          variant: "primary",
          onClick: () => goTo("/a-propos"),
        },
      ],
    },
    {
      id: "manifeste",
      badge: "Manifeste",
      title: "Notre Manifeste :",
      description:
        "Affirmer l'expertise juridique africaine à l'ère de l'intelligence artificielle.",
      align: "left",
      actions: [
        {
          label: "Lire le manifeste",
          variant: "primary",
          onClick: () => goTo("/manifeste"),
        },
      ],
    },
    {
      id: "blog",
      badge: "Blog",
      title: "Actualités et analyses",
      subtitle: "du droit gabonais",
      description:
        "Retrouve des articles pédagogiques pour suivre les évolutions, comprendre les notions clés et appliquer le droit à des cas concrets.",
      align: "center",
      features: [
        blogFeatureFromSlug("droit-du-travail-et-automatisation"),
        blogFeatureFromSlug("reforme-fonciere-gabon-ce-qui-change"),
        blogFeatureFromSlug("comprendre-le-code-civil-gabonais-en-5-minutes"),
      ],
      actions: [
        {
          label: "Voir tous les articles",
          variant: "secondary",
          onClick: () => goTo("/blog"),
        },
      ],
    },
    {
      id: "contacts",
      badge: "Contacts",
      title: "Parlons de vos besoins",
      description:
        "Pour une démonstration, un partenariat ou une question institutionnelle, notre équipe reste disponible.",
      align: "right",
      actions: [
        {
          label: "Accéder aux contacts",
          variant: "primary",
          onClick: () => goTo("/contacts"),
        },
      ],
    },
  ];

  return (
    <ScrollGlobe
      sections={sections}
      className="bg-gradient-to-br from-background via-muted/20 to-background"
    />
  );
}
