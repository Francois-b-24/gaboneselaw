import Link from "next/link";
import { BLOG_ARTICLES } from "@/data/blog-articles";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-10 sm:px-4 sm:py-12">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold sm:text-3xl">Blog</h1>
        <p className="text-muted mt-3">
          Analyses, décryptages et repères pratiques pour comprendre le droit
          gabonais à l&apos;ère de l&apos;innovation juridique.
        </p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_ARTICLES.map((article) => (
          <article
            key={article.slug}
            className="surface group overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <Link href={`/blog/${article.slug}`} className="block h-full">
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.coverAlt}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <p className="text-muted text-xs">
                  {formatDate(article.date)} · {article.category}
                </p>
                <h2 className="mt-2 text-lg font-medium leading-snug">{article.title}</h2>
                <p className="text-muted mt-3 line-clamp-3 text-sm leading-relaxed">
                  {article.excerpt}
                </p>
                <p className="mt-4 text-xs font-medium text-[color:var(--primary)]">
                  Lire l'article
                </p>
              </div>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
