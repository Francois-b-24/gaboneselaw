"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedTabs } from "@/components/ui/animated-tabs";

const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/enjeu", label: "Enjeu" },
  { href: "/methode", label: "Méthode" },
  { href: "/livrables", label: "Livrables" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/chatbot", label: "Chatbot" },
] as const;

type HeaderBarProps = {
  pathname: string;
};

function HeaderBar({ pathname }: HeaderBarProps) {
  const router = useRouter();
  const activeTab = NAV_ITEMS.find((item) => item.href === pathname)?.label;

  return (
    <div className="border-b" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
        <Link
          href="/"
          className="min-w-0 shrink pr-2 leading-tight no-underline hover:opacity-90"
        >
          <span className="block text-sm font-semibold tracking-wide text-[color:var(--foreground)]">
            ALIN
          </span>
          <span className="text-muted block max-w-[11rem] truncate text-[0.65rem] font-normal tracking-wide sm:max-w-[14rem] sm:text-xs md:max-w-none md:whitespace-normal">
            African Legal Innovation Network
          </span>
        </Link>
      </div>
      <div className="mx-auto w-full max-w-6xl px-2 pb-2 sm:px-4">
        <div className="overflow-x-auto">
          <div className="mx-auto w-max min-w-full">
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
        </div>
      </div>
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
