"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedTabs } from "@/components/ui/animated-tabs";

const NAV_ITEMS = [
  { href: "/", label: "À propos" },
  { href: "/manifeste", label: "Manifeste" },
  { href: "/blog", label: "Blog" },
  { href: "/chatbot", label: "Ama'IA" },
  { href: "/contacts", label: "Contacts" },
] as const;

type HeaderBarProps = {
  pathname: string;
};

function HeaderBar({ pathname }: HeaderBarProps) {
  const router = useRouter();
  const activeTab =
    NAV_ITEMS.find((item) =>
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    )?.label;

  return (
    <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-3 sm:h-16 sm:px-4">
        <Link
          href="/"
          className="min-w-0 shrink-0 pr-2 leading-tight no-underline hover:opacity-90"
        >
          <span className="block text-sm font-semibold tracking-wide text-[color:var(--foreground)]">
            ALIN - Africa Legal Innovation Network
          </span>
        </Link>
        <nav className="min-w-0 flex-1 overflow-x-auto" aria-label="Navigation principale">
          <div className="flex w-max min-w-full justify-end">
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
