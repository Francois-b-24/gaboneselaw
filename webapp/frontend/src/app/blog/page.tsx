import { TranslatedLink } from "@/components/translated-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionTitle } from "@/components/ui/section-title";
import { BLOG_ARTICLES } from "@/data/blog-articles";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const [featured, ...rest] = BLOG_ARTICLES;
  const categories = Array.from(
    new Set(BLOG_ARTICLES.map((a) => a.category)),
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      {/* Hero court */}
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>Le journal ALIN</Eyebrow>
        <SectionTitle accent="appliqué aux réalités africaines." size="xl">
          Comprendre le droit,
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          Analyses, décryptages et repères pratiques pour comprendre le droit
          gabonais et africain à l&apos;ère de l&apos;innovation juridique.
        </p>

        {/* Filtres par catégorie en eyebrow inline */}
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <span className="eyebrow text-ink">Tous</span>
          {categories.map((category) => (
            <span key={category} className="eyebrow">
              {category}
            </span>
          ))}
        </div>
      </header>

      {/* Article featured — 5 colonnes (3 image + 2 texte) */}
      {featured ? (
        <TranslatedLink
          href={`/blog/${featured.slug}`}
          className="group mt-20 grid grid-cols-1 gap-8 no-underline md:grid-cols-5"
        >
          <div className="aspect-[4/3] overflow-hidden border border-border-soft bg-paper-warm md:col-span-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.coverImage}
              alt={featured.coverAlt}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="eager"
            />
          </div>
          <div className="flex flex-col justify-center md:col-span-2">
            <p className="eyebrow mb-4">
              {featured.category} · {formatDate(featured.date)} ·{" "}
              {featured.readTime}
            </p>
            <h2 className="mb-4 font-serif text-3xl leading-tight transition-colors group-hover:text-terra-deep md:text-4xl">
              {featured.title}
            </h2>
            <p className="leading-relaxed text-muted">{featured.excerpt}</p>
          </div>
        </TranslatedLink>
      ) : null}

      {/* Grille 3 colonnes, ratio 4:5 */}
      <section className="mt-24 grid grid-cols-1 gap-12 border-t border-border-soft pt-20 md:grid-cols-3">
        {rest.map((article) => (
          <TranslatedLink
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group block no-underline"
          >
            <div className="aspect-[4/5] overflow-hidden border border-border-soft bg-paper-warm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImage}
                alt={article.coverAlt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            <p className="eyebrow mt-6 mb-3">
              {article.category} · {article.readTime}
            </p>
            <h3 className="font-serif text-2xl leading-tight transition-colors group-hover:text-terra-deep">
              {article.title}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              {article.excerpt}
            </p>
          </TranslatedLink>
        ))}
      </section>
    </main>
  );
}
