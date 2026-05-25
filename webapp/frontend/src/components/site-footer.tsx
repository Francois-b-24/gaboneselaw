import { TranslatedLink } from "@/components/translated-link";

export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-border-soft px-6 pb-12 pt-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Marque */}
          <div className="md:col-span-2">
            <p className="mb-4 font-serif text-xl text-ink">ALIN</p>
            <p className="max-w-md text-sm leading-relaxed text-muted">
              African Legal Innovation Network — réseau panafricain dédié à
              l&apos;innovation juridique et à l&apos;accès au droit en Afrique
              francophone.
            </p>
            <p className="eyebrow mt-6">Libreville · Paris · 2026</p>
          </div>

          {/* Réseau */}
          <div>
            <p className="eyebrow mb-6">Réseau</p>
            <ul className="space-y-3 text-sm">
              <li>
                <TranslatedLink href="/a-propos" className="hover:text-terra">
                  À propos
                </TranslatedLink>
              </li>
              <li>
                <TranslatedLink href="/manifeste" className="hover:text-terra">
                  Manifeste
                </TranslatedLink>
              </li>
              <li>
                <TranslatedLink href="/blog" className="hover:text-terra">
                  Blog
                </TranslatedLink>
              </li>
              <li>
                <TranslatedLink href="/contacts" className="hover:text-terra">
                  Contacts
                </TranslatedLink>
              </li>
            </ul>
          </div>

          {/* Initiatives */}
          <div>
            <p className="eyebrow mb-6">Initiatives</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.lexgabon.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LexGabon (ouvre un nouvel onglet)"
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
          <p>© 2026 African Legal Innovation Network. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-6">
            <TranslatedLink href="/mentions-legales" className="hover:text-terra">
              Mentions légales
            </TranslatedLink>
            <TranslatedLink href="/confidentialite" className="hover:text-terra">
              Confidentialité
            </TranslatedLink>
            <TranslatedLink href="/cgu" className="hover:text-terra">
              CGU
            </TranslatedLink>
            <a
              href="https://www.linkedin.com/company/alin-african-legal-innovation-network"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn (ouvre un nouvel onglet)"
              className="hover:text-terra"
            >
              LinkedIn <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
