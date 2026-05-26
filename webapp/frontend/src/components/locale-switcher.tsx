"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Bascule FR/EN : conserve le chemin courant, change uniquement la locale. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Locale");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: (typeof routing.locales)[number]) {
    if (next === locale) return;
    // pathname est déjà sans préfixe de locale (next-intl), on rejoue les params.
    router.replace(
      // @ts-expect-error -- params dynamiques compatibles avec la route courante
      { pathname, params },
      { locale: next },
    );
  }

  return (
    <div
      role="group"
      aria-label={t("switchLabel")}
      className="flex items-center gap-3 text-xs uppercase tracking-wider"
    >
      {routing.locales.map((loc, i) => (
        <span key={loc} className="flex items-center gap-3">
          {i > 0 ? <span aria-hidden className="text-border-soft">·</span> : null}
          <button
            type="button"
            onClick={() => switchTo(loc)}
            aria-pressed={loc === locale}
            className={cn(
              "uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-terra",
              loc === locale ? "font-medium text-ink" : "text-muted hover:text-ink",
            )}
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
