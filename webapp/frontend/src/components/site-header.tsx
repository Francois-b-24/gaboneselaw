"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LanguageTranslateToggle } from "@/components/language-translate-toggle";
import { TranslatedLink } from "@/components/translated-link";
import { sitePrefersEnglishUI } from "@/lib/google-translate-session";
import { AnimatedTabs } from "@/components/ui/animated-tabs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/manifeste", label: "Manifeste" },
  { href: "/blog", label: "Blog" },
  { href: "/contacts", label: "Contacts" },
] as const;

function navigateToHref(
  href: string,
  router: ReturnType<typeof useRouter>,
) {
  if (sitePrefersEnglishUI()) {
    window.location.assign(href);
  } else {
    router.push(href);
  }
}

function activeNavHref(pathname: string): string {
  const match = NAV_ITEMS.find((item) =>
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.href ?? "/";
}

type HeaderBarProps = {
  pathname: string;
};

function HeaderBar({ pathname }: HeaderBarProps) {
  const router = useRouter();
  const activeHref = activeNavHref(pathname);
  const activeTab =
    NAV_ITEMS.find((item) => item.href === activeHref)?.label ??
    NAV_ITEMS[0].label;

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-2 sm:h-16 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-3 sm:px-4 sm:py-0",
      )}
    >
      <TranslatedLink
        href="/"
        className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 self-center pr-1 leading-tight no-underline hover:opacity-90 sm:pr-2"
      >
        <Image
          src="/icon.svg"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0"
        />
        <span className="line-clamp-2 min-w-0 text-left text-xs font-semibold tracking-wide text-[color:var(--foreground)] sm:text-sm sm:leading-tight sm:line-clamp-none">
          ALIN - African Legal Innovation Network
        </span>
      </TranslatedLink>
      <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3 sm:row-start-1 sm:justify-self-auto">
        <LanguageTranslateToggle />
      </div>
      <nav
        className="col-span-2 col-start-1 row-start-2 min-w-0 w-full sm:col-span-1 sm:col-start-2 sm:col-end-3 sm:row-start-1 sm:w-auto"
        aria-label="Navigation principale"
      >
        <select
          id="site-nav-mobile"
          aria-label="Choisir une page"
          className={cn(
            "sm:hidden mb-0.5 w-full min-h-10 rounded-md border px-3 py-2 text-sm font-medium outline-none",
            "focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2",
          )}
          style={{
            borderColor: "var(--border)",
            backgroundColor:
              "color-mix(in srgb, var(--surface) 88%, transparent)",
            color: "var(--foreground)",
          }}
          value={activeHref}
          onChange={(e) => {
            const href = e.target.value;
            navigateToHref(href, router);
          }}
        >
          {NAV_ITEMS.map((item) => (
            <option key={item.href} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="hidden w-max min-w-full justify-center sm:flex sm:min-w-0 sm:justify-end">
          <AnimatedTabs
            tabs={NAV_ITEMS.map((item) => ({ label: item.label }))}
            activeLabel={activeTab}
            onChange={(label) => {
              const item = NAV_ITEMS.find((navItem) => navItem.label === label);
              if (!item) return;
              navigateToHref(item.href, router);
            }}
          />
        </div>
      </nav>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "color-mix(in srgb, var(--surface) 94%, transparent)",
      }}
    >
      <HeaderBar pathname={pathname} />
    </header>
  );
}
