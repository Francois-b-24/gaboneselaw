"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatedTabs } from "@/components/ui/animated-tabs";

const NAV_ITEMS = [
  { href: "/enjeu", label: "Enjeu" },
  { href: "/methode", label: "Méthode" },
  { href: "/livrables", label: "Livrables" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/chatbot", label: "Chatbot" },
] as const;

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      )}
    </svg>
  );
}

type HeaderBarProps = {
  pathname: string;
};

function HeaderBar({ pathname }: HeaderBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeTab = NAV_ITEMS.find((item) => item.href === pathname)?.label;

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
        <Link
          href="/"
          className="min-w-0 shrink pr-2 leading-tight no-underline hover:opacity-90"
          onClick={() => setMenuOpen(false)}
        >
          <span className="block text-sm font-semibold tracking-wide text-[color:var(--foreground)]">
            ALIN
          </span>
          <span className="text-muted block max-w-[11rem] truncate text-[0.65rem] font-normal tracking-wide sm:max-w-[14rem] sm:text-xs md:max-w-none md:whitespace-normal">
            African Legal Innovation Network
          </span>
        </Link>

        <div className="hidden md:block">
          <AnimatedTabs
            tabs={NAV_ITEMS.map((item) => ({ label: item.label }))}
            activeLabel={activeTab}
            onChange={(label) => {
              const item = NAV_ITEMS.find((navItem) => navItem.label === label);
              if (!item) return;
              router.push(item.href);
            }}
          />
        </div>

        <button
          type="button"
          className="btn-secondary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md md:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MenuIcon open={menuOpen} />
        </button>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/25 sm:top-16 md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav
            id="site-mobile-nav"
            className="absolute top-full right-0 left-0 z-50 max-h-[min(70vh,28rem)] overflow-y-auto border-b shadow-lg md:hidden"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-0.5 px-3 py-3 sm:px-4">
              {NAV_ITEMS.map((item) => {
                const href = item.href;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={href}
                    className={`rounded-md px-3 py-3 text-sm ${
                      active
                        ? "btn-primary"
                        : "text-muted hover:bg-[color-mix(in_srgb,var(--surface-muted)_85%,transparent)]"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      ) : null}
    </>
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
      {/* Remonte l’état du menu à chaque changement de route (ferme le menu sans useEffect). */}
      <HeaderBar key={pathname} pathname={pathname} />
    </header>
  );
}
