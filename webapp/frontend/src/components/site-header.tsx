"use client";

import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/manifeste", key: "manifesto" },
  { href: "/blog", key: "blog" },
  { href: "/contacts", key: "contacts" },
  { href: "/a-propos", key: "about" },
] as const;

function isActive(pathname: string, href: string): boolean {
  // "/" (Accueil) ne doit être actif que sur la home exacte, sinon startsWith
  // matcherait toutes les routes.
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");
  const activeHref =
    NAV_ITEMS.find((item) => isActive(pathname, item.href))?.href ?? "";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-soft bg-paper/80 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-6 py-4 sm:flex sm:justify-between sm:py-5">
        {/* Wordmark serif */}
        <Link
          href="/"
          className="col-start-1 row-start-1 flex flex-col leading-none no-underline"
        >
          <span className="font-serif text-xl text-ink">ALIN</span>
          <span className="eyebrow mt-1 text-[10px]">{t("tagline")}</span>
        </Link>

        {/* Bascule de langue */}
        <div className="col-start-2 row-start-1 justify-self-end sm:order-last">
          <LocaleSwitcher />
        </div>

        {/* Navigation */}
        <nav
          className="col-span-2 col-start-1 row-start-2 min-w-0 sm:col-auto sm:row-auto"
          aria-label={t("mainNav")}
        >
          {/* Mobile : select natif */}
          <select
            aria-label={t("choosePage")}
            className="w-full rounded-md border border-border-soft bg-paper px-3 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-terra sm:hidden"
            value={activeHref}
            onChange={(e) => router.push(e.target.value)}
          >
            <option value="">{t("menu")}</option>
            {NAV_ITEMS.map((item) => (
              <option key={item.href} value={item.href}>
                {t(item.key)}
              </option>
            ))}
          </select>

          {/* Desktop : liens texte */}
          <div className="hidden items-center gap-10 text-sm sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "no-underline transition-colors hover:text-terra",
                  isActive(pathname, item.href) ? "text-ink" : "text-muted",
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
