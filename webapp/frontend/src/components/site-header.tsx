"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { section: "accueil", label: "Accueil" },
  { section: "enjeu", label: "Enjeu" },
  { section: "methode", label: "Méthode" },
  { section: "livrables", label: "Livrables" },
  { section: "a-propos", label: "À propos" },
  { section: "contact", label: "Contact" },
  { href: "/chatbot", label: "Chatbot" },
];

type NavItem = (typeof NAV_ITEMS)[number];

function isLinkItem(item: NavItem): item is Extract<NavItem, { href: string }> {
  return "href" in item;
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b backdrop-blur"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "color-mix(in srgb, var(--surface) 92%, transparent)",
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-wide">
          ALIN - African Legal Innovation Network
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const href = isLinkItem(item)
              ? item.href
              : `${pathname === "/" ? "" : "/"}#${item.section}`;
            const active = isLinkItem(item) ? pathname === item.href : false;
            return (
              <Link
                key={item.label}
                href={href}
                className={`rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "btn-primary"
                    : "text-muted hover:text-[color:var(--foreground)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
