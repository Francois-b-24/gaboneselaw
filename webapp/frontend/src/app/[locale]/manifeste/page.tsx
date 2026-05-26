import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getManifesto } from "@/data/manifesto";

/** Séparateur de section — glyphe ALIN ❖ (distinct du ◇ LexGabon). */
function Divider() {
  return (
    <p className="my-16 text-center text-2xl text-terra/60" aria-hidden>
      ❖
    </p>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("manifestoTitle"), description: t("manifestoDescription") };
}

export default async function ManifestePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const m = getManifesto(locale);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      {/* Hero court */}
      <header className="border-b border-border-soft pb-20">
        <Eyebrow>{m.eyebrow}</Eyebrow>
        <h1 className="font-serif text-6xl leading-[0.95] tracking-tight md:text-8xl">
          {m.title}
          <em className="accent-italic mt-2 block text-4xl md:text-5xl">
            {m.accent}
          </em>
        </h1>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          {m.lede}
        </p>
        <p className="eyebrow mt-8">{m.launch}</p>
      </header>

      {/* Corps long-form */}
      <article className="prose-editorial py-24">
        {m.sections.map((section, i) => (
          <div key={section.heading}>
            {i > 0 ? <Divider /> : null}
            <h2>{section.heading}</h2>
            {section.subtitle ? (
              <p className="eyebrow !text-sm">{section.subtitle}</p>
            ) : null}
            {section.paragraphs?.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}

            {section.subsections?.map((sub) => (
              <div key={sub.heading}>
                <h3>{sub.heading}</h3>
                {sub.paragraphs.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
            ))}

            {section.numbered ? (
              <ol className="mt-8 space-y-8 border-t border-border-soft pt-8">
                {section.numbered.map((item) => (
                  <li key={item.label}>
                    <p className="eyebrow mb-2">{item.label}</p>
                    <p>{item.body}</p>
                  </li>
                ))}
              </ol>
            ) : null}

            {section.axes ? (
              <ul className="mt-8 space-y-8 border-t border-border-soft pt-8">
                {section.axes.map((axis) => (
                  <li key={axis.label}>
                    <p className="font-serif text-xl text-ink">{axis.label}</p>
                    <p className="mt-2">{axis.body}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.joinList ? (
              <ul className="mt-6 space-y-4 border-t border-border-soft pt-6">
                {section.joinList.map((item) => (
                  <li
                    key={item.term}
                    className="text-lg leading-[1.8] text-ink/85"
                  >
                    <span className="hexagram font-serif text-ink">
                      {item.term}
                    </span>{" "}
                    — {item.detail}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        <blockquote className="mt-16 border-l-2 border-terra pl-8 font-serif text-2xl italic leading-relaxed text-ink md:text-3xl">
          {m.quote.line1}
          <span className="mt-2 block not-italic text-terra">
            {m.quote.line2}
          </span>
        </blockquote>
      </article>

      <footer className="border-t border-border-soft py-16 text-center">
        <p className="font-serif text-xl text-ink">{m.footerName}</p>
        <p className="eyebrow mt-3">{m.footerPlace}</p>
      </footer>
    </main>
  );
}
