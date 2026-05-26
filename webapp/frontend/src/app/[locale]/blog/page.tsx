import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionTitle } from "@/components/ui/section-title";
import { getLocalizedArticles } from "@/data/blog-articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("blogTitle"), description: t("blogDescription") };
}

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BlogContent locale={locale} />;
}

function BlogContent({ locale }: { locale: string }) {
  const t = useTranslations("Blog");
  const articles = getLocalizedArticles(locale);
  const [featured, ...rest] = articles;
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <SectionTitle accent={t("accent")} size="xl">
          {t("title")}
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          {t("lede")}
        </p>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <span className="eyebrow text-ink">{t("all")}</span>
          {categories.map((category) => (
            <span key={category} className="eyebrow">
              {category}
            </span>
          ))}
        </div>
      </header>

      {featured ? (
        <Link
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
              {featured.category} · {formatDate(featured.date, locale)} ·{" "}
              {featured.readTime}
            </p>
            <h2 className="mb-4 font-serif text-3xl leading-tight transition-colors group-hover:text-terra-deep md:text-4xl">
              {featured.title}
            </h2>
            <p className="leading-relaxed text-muted">{featured.excerpt}</p>
          </div>
        </Link>
      ) : null}

      <section className="mt-24 grid grid-cols-1 gap-12 border-t border-border-soft pt-20 md:grid-cols-3">
        {rest.map((article) => (
          <Link
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
          </Link>
        ))}
      </section>
    </main>
  );
}
