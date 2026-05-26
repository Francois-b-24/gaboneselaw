import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  getAllSlugs,
  getLocalizedArticle,
  getLocalizedArticles,
} from "@/data/blog-articles";

type Params = { locale: string; slug: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getAllSlugs().map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getLocalizedArticle(slug, locale);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!getLocalizedArticle(slug, locale)) {
    notFound();
  }
  return <ArticleContent locale={locale} slug={slug} />;
}

function ArticleContent({ locale, slug }: { locale: string; slug: string }) {
  const t = useTranslations("Blog");
  const article = getLocalizedArticle(slug, locale);
  if (!article) notFound();

  const related = getLocalizedArticles(locale)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <Link
        href="/blog"
        className="eyebrow inline-block no-underline transition-colors hover:text-terra"
      >
        ← {t("back")}
      </Link>

      <header className="mt-8 border-b border-border-soft pb-16">
        <Eyebrow>{article.category}</Eyebrow>
        <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          {article.title}
        </h1>
        <p className="eyebrow mt-8">
          {formatDate(article.date, locale)} ·{" "}
          {t("readingLabel", { time: article.readTime })}
        </p>
        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-muted">
          {article.intro}
        </p>
      </header>

      <div className="mt-12 aspect-[16/7] overflow-hidden border border-border-soft bg-paper-warm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImage}
          alt={article.coverAlt}
          className="h-full w-full object-cover"
        />
      </div>

      <article className="prose-editorial py-24">
        {article.sections.map((section) => {
          const HeadingTag = section.level === "h3" ? "h3" : "h2";
          return (
            <section key={`${article.slug}-${section.heading}`}>
              <HeadingTag>{section.heading}</HeadingTag>

              {section.paragraphs?.map((paragraph) => (
                <p key={`${article.slug}-${paragraph.slice(0, 24)}`}>
                  {paragraph}
                </p>
              ))}

              {section.quote ? (
                <blockquote className="my-8 border-l-2 border-terra pl-6 font-serif text-xl italic leading-relaxed text-ink">
                  {section.quote}
                </blockquote>
              ) : null}

              {section.bullets?.length ? (
                <ul className="mb-6 space-y-3">
                  {section.bullets.map((bullet) => (
                    <li
                      key={`${article.slug}-${bullet.slice(0, 20)}`}
                      className="text-lg leading-[1.8] text-ink/85"
                    >
                      <span className="hexagram" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.link ? (
                <p>
                  <Link
                    href={section.link.href}
                    className="border-b border-ink pb-1 text-base no-underline transition-colors hover:border-terra hover:text-terra"
                  >
                    {section.link.label} →
                  </Link>
                </p>
              ) : null}
            </section>
          );
        })}
      </article>

      <div className="prose-editorial border-t border-border-soft py-12">
        <p className="eyebrow mb-3">{t("publishedBy")}</p>
        <p className="font-serif text-2xl text-ink">{t("authorName")}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          {t("authorBio")}
        </p>
      </div>

      {related.length > 0 ? (
        <section className="border-t border-border-soft py-20">
          <Eyebrow>{t("alsoRead")}</Eyebrow>
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/${item.slug}`}
                className="group block no-underline"
              >
                <div className="aspect-[4/5] overflow-hidden border border-border-soft bg-paper-warm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverImage}
                    alt={item.coverAlt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </div>
                <p className="eyebrow mt-6 mb-3">
                  {item.category} · {item.readTime}
                </p>
                <h3 className="font-serif text-2xl leading-tight transition-colors group-hover:text-terra-deep">
                  {item.title}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
