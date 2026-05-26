import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { FeatureCard } from "@/components/ui/feature-card";
import { SectionTitle } from "@/components/ui/section-title";

type ResourceItem = { title: string; text: string; level: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("resourcesTitle"), description: t("resourcesDescription") };
}

export default async function RessourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ResourcesContent />;
}

function ResourcesContent() {
  const t = useTranslations("Resources");
  const items = t.raw("items") as ResourceItem[];

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
      </header>

      <section className="grid grid-cols-1 gap-12 py-20 md:grid-cols-3">
        {items.map((item) => (
          <FeatureCard
            key={item.title}
            title={item.title}
            description={item.text}
            tags={[item.level]}
          />
        ))}
      </section>
    </main>
  );
}
