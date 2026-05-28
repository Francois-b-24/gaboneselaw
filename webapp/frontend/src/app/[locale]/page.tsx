import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionTitle } from "@/components/ui/section-title";
import { StatBlock } from "@/components/ui/stat-block";
import { getLocalizedArticles } from "@/data/blog-articles";
import { getLexGabonStats, type LexGabonStats } from "@/lib/lexgabon-stats";

const LEXGABON_URL = "https://www.lexgabon.com";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const stats = await getLexGabonStats();
  return <HomeContent locale={locale} stats={stats} />;
}

function HomeContent({ locale, stats }: { locale: string; stats: LexGabonStats }) {
  const t = useTranslations("Home");
  const articles = getLocalizedArticles(locale);
  const [featured, ...rest] = articles;
  const gridArticles = rest.slice(0, 3);

  return (
    <main>
      {/* Hero manifeste */}
      <section className="mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-center px-6 pt-20">
        <Eyebrow>{t("heroEyebrow")}</Eyebrow>
        <h1 className="font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl lg:text-8xl">
          {t("heroTitle")}
          <em className="accent-italic mt-2 block">{t("heroAccent")}</em>
        </h1>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          {t("heroLede")}
        </p>
        <div className="mt-16 flex flex-wrap items-center gap-8">
          <Link
            href="/manifeste"
            className="border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
          >
            {t("readManifesto")} →
          </Link>
          <a
            href={LEXGABON_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("discoverLexgabonAria")}
            className="text-base text-muted transition-colors hover:text-terra"
          >
            {t("discoverLexgabon")} <span aria-hidden>↗</span>
          </a>
        </div>
      </section>

      {/* Manifeste */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>{t("positionEyebrow")}</Eyebrow>
        <SectionTitle accent={t("positionAccent")} size="xl">
          {t("positionTitle")}
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          {t("positionLede")}
        </p>
        <Link
          href="/manifeste"
          className="mt-12 inline-block border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
        >
          {t("readFullManifesto")} →
        </Link>
      </section>

      {/* Nos initiatives (pont LexGabon) */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>{t("initiativesEyebrow")}</Eyebrow>
        <SectionTitle accent={t("initiativesAccent")} size="xl">
          {t("initiativesTitle")}
        </SectionTitle>

        <div className="mt-20 grid grid-cols-1 items-start gap-12 lg:grid-cols-3">
          <div className="border border-border-soft p-10 transition-all hover:border-terra/40 lg:col-span-2">
            <div aria-hidden className="mb-6 font-serif text-2xl text-terra/70">
              ❖
            </div>
            <p className="eyebrow mb-4">{t("lexgabonTag")}</p>
            <h3 className="mb-6 font-serif text-4xl leading-tight">
              LexGabon
              <em className="accent-italic mt-2 block text-2xl">
                {t("lexgabonAccent")}
              </em>
            </h3>
            <p className="mb-8 max-w-xl leading-relaxed text-muted">
              {t("lexgabonDesc")}
            </p>

            <div className="mb-8 flex flex-wrap gap-x-12 gap-y-4 border-b border-border-soft pb-8">
              <div>
                <p className="font-serif text-3xl">{stats.indexedArticlesCount.toLocaleString(locale)}</p>
                <p className="eyebrow mt-1">{t("statTextsIndexed")}</p>
              </div>
              <div>
                <p className="font-serif text-3xl">{stats.officialSourcesCount}</p>
                <p className="eyebrow mt-1">{t("statSources")}</p>
              </div>
              <div>
                <p className="font-serif text-3xl">{t("statAccessValue")}</p>
                <p className="eyebrow mt-1">{t("statAccess")}</p>
              </div>
            </div>

            <a
              href={LEXGABON_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("accessLexgabonAria")}
              className="inline-flex items-center gap-2 border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
            >
              {t("accessLexgabon")} <span aria-hidden>↗</span>
            </a>
          </div>

          <div className="border border-dashed border-border-soft p-10 lg:p-8">
            <div aria-hidden className="mb-6 font-serif text-2xl text-muted/40">
              ❖
            </div>
            <p className="eyebrow mb-4">{t("comingSoon")}</p>
            <h4 className="mb-3 font-serif text-xl text-muted">
              {t("comingSoonTitle")}
            </h4>
            <p className="text-sm leading-relaxed text-muted/80">
              {t("comingSoonDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Le réseau en chiffres */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>{t("figuresEyebrow")}</Eyebrow>
        <SectionTitle accent={t("figuresAccent")} size="xl">
          {t("figuresTitle")}
        </SectionTitle>

        <div className="mt-20 grid grid-cols-2 gap-12 md:grid-cols-4">
          <StatBlock value="5+" label={t("figCountries")} />
          <StatBlock value={stats.indexedArticlesCount.toLocaleString(locale)} label={t("figTexts")} />
          <StatBlock value={t("figAccessValue")} label={t("figAccess")} />
          <StatBlock value="2026" label={t("figYear")} />
        </div>
      </section>

      {/* Le journal ALIN */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 md:py-40">
        <Eyebrow>{t("journalEyebrow")}</Eyebrow>
        <SectionTitle accent={t("journalAccent")} size="xl">
          {t("journalTitle")}
        </SectionTitle>

        {featured ? (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-20 grid grid-cols-1 gap-8 no-underline md:grid-cols-5"
          >
            <div className="relative aspect-[4/3] overflow-hidden border border-border-soft bg-paper-warm md:col-span-3">
              <Image
                src={featured.coverImage}
                alt={featured.coverAlt}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-col justify-center md:col-span-2">
              <p className="eyebrow mb-4">
                {featured.category} · {featured.readTime}
              </p>
              <h3 className="mb-4 font-serif text-3xl leading-tight group-hover:text-terra-deep md:text-4xl">
                {featured.title}
              </h3>
              <p className="leading-relaxed text-muted">{featured.excerpt}</p>
            </div>
          </Link>
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
          <Link
            href="/blog"
            className="inline-block border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
          >
            {t("allArticles")} →
          </Link>
        </div>
      </section>

      {/* Contribuons ensemble */}
      <section className="mx-auto max-w-7xl border-t border-border-soft px-6 py-32 text-center md:py-40">
        <SectionTitle accent={t("ctaAccent")} size="xl" className="mx-auto">
          {t("ctaTitle")}
        </SectionTitle>
        <p className="mx-auto mt-12 max-w-xl text-lg leading-relaxed text-muted">
          {t("ctaLede")}
        </p>
        <Link
          href="/contacts"
          className="mt-12 inline-block border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
        >
          {t("goContacts")} →
        </Link>
      </section>
    </main>
  );
}
