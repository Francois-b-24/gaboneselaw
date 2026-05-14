import { TranslatedLink } from "@/components/translated-link";
import { SocialLinks } from "@/components/social-links";

export function SiteFooter() {
  return (
    <footer
      className="mt-20 border-t bg-[color:var(--surface)]/85 py-10 backdrop-blur"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-3">
        <section>
          <p className="text-sm font-semibold">Ama&apos;IA</p>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Rendre le droit gabonais accessible par l&apos;innovation, avec des réponses
            pédagogiques et responsables.
          </p>
        </section>

        <section>
          <p className="text-sm font-semibold">Navigation rapide</p>
          <ul className="text-muted mt-2 space-y-1 text-sm">
            <li><TranslatedLink href="/" className="hover:underline">Accueil</TranslatedLink></li>
            <li><TranslatedLink href="/a-propos" className="hover:underline">À propos</TranslatedLink></li>
            <li><TranslatedLink href="/manifeste" className="hover:underline">Manifeste</TranslatedLink></li>
            <li><TranslatedLink href="/blog" className="hover:underline">Blog</TranslatedLink></li>
            <li><TranslatedLink href="/contacts" className="hover:underline">Contacts</TranslatedLink></li>
          </ul>
        </section>

        <section>
          <p className="text-sm font-semibold">Retrouvez-nous</p>
          <SocialLinks className="mt-3 flex flex-wrap gap-2 text-[color:var(--foreground)]" />
        </section>
      </div>

      <div
        className="mx-auto mt-8 w-full max-w-6xl border-t pt-4 text-xs text-muted"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Ama&apos;IA. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-3">
            <TranslatedLink href="/mentions-legales" className="hover:underline">Mentions légales</TranslatedLink>
            <TranslatedLink href="/confidentialite" className="hover:underline">Confidentialité</TranslatedLink>
            <TranslatedLink href="/cgu" className="hover:underline">CGU</TranslatedLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
