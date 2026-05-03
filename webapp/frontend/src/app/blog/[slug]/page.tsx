import { TranslatedLink } from "@/components/translated-link";
import { notFound } from "next/navigation";
import { BLOG_ARTICLES, getBlogArticleBySlug } from "@/data/blog-articles";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({ slug: article.slug }));
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = getBlogArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-10 sm:px-4 sm:py-12">
      <TranslatedLink href="/blog" className="text-muted text-sm hover:underline">
        ← Retour au blog
      </TranslatedLink>

      <article className="mt-5">
        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
          <img
            src={article.coverImage}
            alt={article.coverAlt}
            className="h-full max-h-[420px] w-full object-cover"
          />
        </div>

        <header className="mt-6">
          <p className="text-muted text-xs uppercase tracking-wide">
            {article.category} · {formatDate(article.date)} · Lecture {article.readTime}
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
            {article.title}
          </h1>
          <p className="text-muted mt-4 max-w-[72ch] text-base leading-relaxed">
            {article.intro}
          </p>
        </header>

        <section className="mt-8 space-y-7">
          {article.sections.map((section) => {
            const HeadingTag = section.level === "h3" ? "h3" : "h2";

            return (
              <section key={`${article.slug}-${section.heading}`} className="space-y-4">
                <HeadingTag
                  className={
                    section.level === "h3"
                      ? "text-xl font-semibold"
                      : "text-2xl font-semibold"
                  }
                >
                  {section.heading}
                </HeadingTag>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={`${article.slug}-${section.heading}-${paragraph.slice(0, 24)}`}
                    className="max-w-[72ch] text-base leading-8"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.quote ? (
                  <blockquote className="surface max-w-[72ch] rounded-xl border-l-4 p-5 italic leading-8">
                    {section.quote}
                  </blockquote>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="max-w-[72ch] list-disc space-y-2 pl-6 text-base leading-8">
                    {section.bullets.map((bullet) => (
                      <li key={`${article.slug}-${section.heading}-${bullet.slice(0, 20)}`}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.link ? (
                  <p>
                    <TranslatedLink
                      href={section.link.href}
                      className="text-sm font-medium text-[color:var(--primary)] hover:underline"
                    >
                      {section.link.label}
                    </TranslatedLink>
                  </p>
                ) : null}
              </section>
            );
          })}
        </section>
      </article>
    </main>
  );
}
