export function SiteFooter() {
  return (
    <footer
      className="mt-20 border-t bg-[color:var(--surface)]/85 py-10 backdrop-blur"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
        <section>
          <p className="text-sm font-semibold">ALIN - African Legal Innovation Network</p>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Plateforme d&apos;information juridique et pédagogique sur le droit gabonais.
            Les contenus sont conçus pour rester clairs, traçables et exploitables.
          </p>
        </section>

        <section>
          <p className="text-sm font-semibold">Navigation</p>
          <ul className="text-muted mt-2 space-y-1 text-sm">
            <li><a href="/enjeu" className="hover:underline">Enjeu</a></li>
            <li><a href="/methode" className="hover:underline">Méthode</a></li>
            <li><a href="/livrables" className="hover:underline">Livrables</a></li>
            <li><a href="/a-propos" className="hover:underline">À propos</a></li>
            <li><a href="/contact" className="hover:underline">Contact</a></li>
            <li><a href="/chatbot" className="hover:underline">Chatbot</a></li>
          </ul>
        </section>

        <section>
          <p className="text-sm font-semibold">Contact</p>
          <p className="text-muted mt-2 text-sm">felicia.oi@alin-africa.com</p>
          <div className="text-muted mt-4 space-y-1 text-xs leading-relaxed">
            <p><strong>Éditeur:</strong> ALIN (à compléter)</p>
            <p><strong>Responsable publication:</strong> À compléter</p>
            <p><strong>Siège / RC:</strong> À compléter</p>
          </div>
        </section>
      </div>

      <div
        className="mx-auto mt-8 w-full max-w-6xl border-t pt-4 text-xs text-muted"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>
            Ce site fournit des informations juridiques générales et ne remplace pas
            une consultation juridique personnalisée.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/mentions-legales" className="hover:underline">Mentions légales</a>
            <a href="/confidentialite" className="hover:underline">Confidentialité</a>
            <a href="/cgu" className="hover:underline">CGU</a>
          </div>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} ALIN. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
