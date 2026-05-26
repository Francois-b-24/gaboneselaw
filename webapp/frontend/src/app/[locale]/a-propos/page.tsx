import type { Metadata } from "next";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LinkedInIcon } from "@/components/linkedin-icon";
import { Eyebrow } from "@/components/ui/eyebrow";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/f%C3%A9licia-ombanda-indoumou-4b265392/";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("aboutTitle"), description: t("aboutDescription") };
}

export default async function AProposPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AboutContent />;
}

function AboutContent() {
  const t = useTranslations("About");
  const strong = (chunks: React.ReactNode) => (
    <span className="font-serif text-ink">{chunks}</span>
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
          {t("title")}
          <em className="accent-italic mt-2 block text-4xl md:text-5xl">
            {t("accent")}
          </em>
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-12 py-20 md:grid-cols-5 md:gap-16">
        <div className="md:col-span-2">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden border border-border-soft md:mx-0 md:max-w-none">
            <Image
              src="/felicia-ombanda-indoumou.png"
              alt={t("portraitAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 320px, 40vw"
              priority
            />
          </div>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("linkedinAria")}
            className="mt-6 inline-flex items-center gap-3 text-sm text-muted transition-colors hover:text-terra"
          >
            <LinkedInIcon className="h-5 w-5" />
            <span>
              Félicia Ombanda Indoumou <span aria-hidden>↗</span>
            </span>
          </a>
        </div>

        <div className="md:col-span-3">
          <p className="text-lg leading-[1.8] text-ink/85">
            {t.rich("intro", { strong })}
          </p>
          <ul className="mt-6 space-y-4">
            <li className="text-lg leading-[1.8] text-ink/85">
              <span className="hexagram" />
              {t("point1")}
            </li>
            <li className="text-lg leading-[1.8] text-ink/85">
              <span className="hexagram" />
              {t("point2")}
            </li>
          </ul>
          <p className="mt-8 text-lg leading-[1.8] text-ink/85">
            {t.rich("body", { strong })}
          </p>
        </div>
      </section>
    </main>
  );
}
