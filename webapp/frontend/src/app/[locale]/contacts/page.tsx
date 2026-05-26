import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/contact-form";
import { SocialLinks } from "@/components/social-links";
import { Eyebrow } from "@/components/ui/eyebrow";
import { SectionTitle } from "@/components/ui/section-title";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("contactsTitle"), description: t("contactsDescription") };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContactsContent />;
}

function ContactsContent() {
  const t = useTranslations("Contacts");

  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <SectionTitle accent={t("accent")} size="lg">
          {t("title")}
        </SectionTitle>
        <p className="mt-12 max-w-2xl text-lg leading-relaxed text-muted">
          {t("lede")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-16 py-20 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>

        <aside className="lg:col-span-2">
          <p className="eyebrow mb-6">{t("followUs")}</p>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted">
            {t("followDesc")}
          </p>
          <SocialLinks className="mt-6 flex flex-wrap gap-3" />
        </aside>
      </div>
    </main>
  );
}
