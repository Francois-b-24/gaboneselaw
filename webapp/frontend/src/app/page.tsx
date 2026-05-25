import { TranslatedLink } from "@/components/translated-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionTitle } from "@/components/ui/section-title";
import { StatBlock } from "@/components/ui/stat-block";
import { BLOG_ARTICLES } from "@/data/blog-articles";

const LEXGABON_URL = "https://www.lexgabon.com";

export default function Home() {
  const [featured, ...rest] = BLOG_ARTICLES;
  const gridArticles = rest.slice(0, 3);

  return (
    <main>
      {/* 3.1 — Hero manifeste */}
      <section className="mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-6 pt-20">
        <Eyebrow>Réseau panafricain d&apos;innovation juridique</Eyebrow>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl lg:text-[9rem]">
          Rendre le droit africain
          <em className="accent-italic mt-2 block">clair, utile et partagé.</em>
        </h1>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          African Legal Innovation Network vulgarise et connecte les
          informations juridiques à travers le continent, pour un langage
          accessible, fiable et ancré dans les réalités africaines.
        </p>
        <div className="mt-16 flex flex-wrap items-center gap-8">
          <TranslatedLink
            href="/manifeste"
            className="border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
          >
            Lire le manifeste →
          </TranslatedLink>
          <a
            href={LEXGABON_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Découvrir LexGabon (ouvre un nouvel onglet)"
            className="text-base text-muted transition-colors hover:text-terra"
          >
            Découvrir LexGabon <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      {/* 3.2 — Manifeste */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>Notre position</Eyebrow>
        <SectionTitle accent="à l'ère de l'intelligence artificielle." size="xl">
          Affirmer l&apos;expertise juridique africaine
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          Une affirmation publique de notre vision : un droit africain pensé,
          écrit et outillé par des juristes africains, augmenté par les
          technologies d&apos;intelligence artificielle au service du continent.
        </p>
        <TranslatedLink
          href="/manifeste"
          className="mt-12 inline-block border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
        >
          Lire le manifeste en intégralité →
        </TranslatedLink>
      </section>

      {/* 3.3 — Nos initiatives (pont LexGabon) */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>Nos initiatives</Eyebrow>
        <SectionTitle accent="pour démocratiser l'accès au droit." size="xl">
          Des outils concrets,
        </SectionTitle>

        <div className="mt-20 grid grid-cols-1 items-start gap-12 lg:grid-cols-3">
          {/* Carte LexGabon mise en avant */}
          <div className="border border-border-soft p-10 transition-all hover:border-terra/40 lg:col-span-2">
            <div aria-hidden className="mb-6 font-serif text-2xl text-terra/70">
              ❖
            </div>
            <p className="eyebrow mb-4">Plateforme · République Gabonaise</p>
            <h3 className="mb-6 font-serif text-4xl leading-tight">
              LexGabon
              <em className="accent-italic mt-2 block text-2xl">
                Le droit applicable au Gabon, ouvert et structuré.
              </em>
            </h3>
            <p className="mb-8 max-w-xl leading-relaxed text-muted">
              Plateforme de données juridiques ouvertes centralisant les textes
              applicables en République Gabonaise ainsi que les textes OHADA et
              CEMAC applicables au Gabon.
            </p>

            <div className="mb-8 flex flex-wrap gap-x-12 gap-y-4 border-b border-border-soft pb-8">
              <div>
                <p className="font-serif text-3xl">2500+</p>
                <p className="eyebrow mt-1">Textes indexés</p>
              </div>
              <div>
                <p className="font-serif text-3xl">5</p>
                <p className="eyebrow mt-1">Sources officielles</p>
              </div>
              <div>
                <p className="font-serif text-3xl">Libre</p>
                <p className="eyebrow mt-1">Accès</p>
              </div>
            </div>

            <a
              href={LEXGABON_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Accéder à lexgabon.com (ouvre un nouvel onglet)"
              className="inline-flex items-center gap-2 border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
            >
              Accéder à lexgabon.com <span aria-hidden>↗</span>
            </a>
          </div>

          {/* Placeholder futures initiatives */}
          <div className="border border-dashed border-border-soft p-10 lg:p-8">
            <div aria-hidden className="mb-6 font-serif text-2xl text-muted/40">
              ❖
            </div>
            <p className="eyebrow mb-4">À venir</p>
            <h4 className="mb-3 font-serif text-xl text-muted">
              D&apos;autres initiatives prennent forme.
            </h4>
            <p className="text-sm leading-relaxed text-muted/80">
              ALIN développe progressivement de nouveaux outils pour étendre la
              couverture juridique à d&apos;autres pays et matières.
            </p>
          </div>
        </div>
      </section>

      {/* 3.4 — Le réseau en chiffres */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>Le réseau en chiffres</Eyebrow>
        <SectionTitle accent="appliqué aux réalités du continent." size="xl">
          Un droit africain,
        </SectionTitle>

        <div className="mt-20 grid grid-cols-2 gap-12 md:grid-cols-4">
          <StatBlock value="5+" label="Pays visés à terme" />
          <StatBlock value="2500+" label="Textes indexés via LexGabon" />
          <StatBlock value="Libre" label="Accès aux ressources" />
          <StatBlock value="2026" label="Année de lancement" />
        </div>
      </section>

      {/* 3.5 — Le journal ALIN */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>Le journal ALIN</Eyebrow>
        <SectionTitle accent="appliqué aux réalités africaines." size="xl">
          Comprendre le droit,
        </SectionTitle>

        {featured ? (
          <TranslatedLink
            href={`/blog/${featured.slug}`}
            className="group mt-20 grid grid-cols-1 gap-8 no-underline md:grid-cols-5"
          >
            <div className="aspect-[4/3] border border-border-soft bg-paper-warm md:col-span-3" />
            <div className="flex flex-col justify-center md:col-span-2">
              <p className="eyebrow mb-4">
                {featured.category} · {featured.readTime}
              </p>
              <h3 className="mb-4 font-serif text-3xl leading-tight group-hover:text-terra-deep md:text-4xl">
                {featured.title}
              </h3>
              <p className="leading-relaxed text-muted">{featured.excerpt}</p>
            </div>
          </TranslatedLink>
        ) : null}

        {gridArticles.length > 0 ? (
          <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3">
            {gridArticles.map((article) => (
              <FeatureCard
                key={article.slug}
                href={`/blog/${article.slug}`}
                title={article.title}
                description={article.excerpt}
                tags={[article.category, article.readTime]}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-20 text-center">
          <TranslatedLink
            href="/blog"
            className="inline-block border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
          >
            Voir tous les articles →
          </TranslatedLink>
        </div>
      </section>

      {/* 3.6 — Contribuons ensemble */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 text-center md:py-40">
        <SectionTitle
          accent="à l'innovation juridique africaine."
          size="xl"
          className="mx-auto"
        >
          Contribuons ensemble
        </SectionTitle>
        <p className="mx-auto mt-12 max-w-xl text-lg leading-relaxed text-muted">
          Pour une démonstration, un partenariat ou une question
          institutionnelle, notre équipe reste disponible.
        </p>
        <TranslatedLink
          href="/contacts"
          className="mt-12 inline-block border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
        >
          Accéder aux contacts →
        </TranslatedLink>
      </section>
    </main>
  );
}
