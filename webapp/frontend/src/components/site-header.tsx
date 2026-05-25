"use client";

import { usePathname, useRouter } from "next/navigation";
import { LanguageTranslateToggle } from "@/components/language-translate-toggle";
import { TranslatedLink } from "@/components/translated-link";
import { sitePrefersEnglishUI } from "@/lib/google-translate-session";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/a-propos", label: "À propos" },
  { href: "/manifeste", label: "Manifeste" },
  { href: "/blog", label: "Blog" },
  { href: "/contacts", label: "Contacts" },
] as const;

function navigateToHref(href: string, router: ReturnType<typeof useRouter>) {
  if (sitePrefersEnglishUI()) {
    window.location.assign(href);
  } else {
    router.push(href);
  }
}

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const activeHref =
    NAV_ITEMS.find((item) => isActive(pathname, item.href))?.href ?? "";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-soft bg-paper/80 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-6 py-4 sm:flex sm:justify-between sm:py-5">
        {/* Wordmark serif */}
        <TranslatedLink
          href="/"
          className="col-start-1 row-start-1 flex flex-col leading-none no-underline"
        >
          <span className="font-serif text-xl text-ink">ALIN</span>
          <span className="eyebrow mt-1 text-[10px]">
            African Legal Innovation Network
          </span>
        </TranslatedLink>

        {/* Lang switch (Google Translate FR/EN — remplacé en Phase 5) */}
        <div className="col-start-2 row-start-1 justify-self-end sm:order-last">
          <LanguageTranslateToggle />
        </div>

        {/* Navigation */}
        <nav
          className="col-span-2 col-start-1 row-start-2 min-w-0 sm:col-auto sm:row-auto"
          aria-label="Navigation principale"
        >
          {/* Mobile : select natif */}
          <select
            aria-label="Choisir une page"
            className="w-full rounded-md border border-border-soft bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-terra sm:hidden"
            value={activeHref}
            onChange={(e) => navigateToHref(e.target.value, router)}
          >
            <option value="">Menu</option>
            {NAV_ITEMS.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>

          {/* Desktop : liens texte */}
          <div className="hidden items-center gap-10 text-sm sm:flex">
            {NAV_ITEMS.map((item) => (
              <TranslatedLink
                key={item.href}
                href={item.href}
                className={cn(
                  "no-underline transition-colors hover:text-terra",
                  isActive(pathname, item.href) ? "text-ink" : "text-muted",
                )}
              >
                {item.label}
              </TranslatedLink>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
