import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="mt-32 border-t border-border-soft px-6 pb-12 pt-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Marque */}
          <div className="md:col-span-2">
            <p className="mb-4 font-serif text-xl text-ink">ALIN</p>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              {t("blurb")}
            </p>
            <p className="eyebrow mt-6">{t("places")}</p>
          </div>

          {/* Réseau */}
          <div>
            <p className="eyebrow mb-6">{t("network")}</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.linkedin.com/company/alin-african-legal-innovation-network"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("linkedinAria")}
                  className="hover:text-terra"
                >
                  LinkedIn <span aria-hidden>↗</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Initiatives */}
          <div>
            <p className="eyebrow mb-6">{t("initiatives")}</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.lexgabon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("lexgabonAria")}
                  className="hover:text-terra"
                >
                  LexGabon <span aria-hidden>↗</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bande basse */}
        <div className="flex flex-col items-start justify-between gap-4 border-t border-border-soft pt-6 text-xs text-muted md:flex-row md:items-center">
          <p>{t("rights")}</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/mentions-legales" className="hover:text-terra">
              {t("legal")}
            </Link>
            <Link href="/confidentialite" className="hover:text-terra">
              {t("privacy")}
            </Link>
            <Link href="/cgu" className="hover:text-terra">
              {t("terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
