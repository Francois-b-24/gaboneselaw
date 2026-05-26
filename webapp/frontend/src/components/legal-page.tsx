import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui/eyebrow";

type LegalPageProps = {
  titleKey: "cguTitle" | "privacyTitle" | "legalNoticeTitle";
  bodyKey: "cguBody" | "privacyBody" | "legalNoticeBody";
};

/** Gabarit éditorial partagé pour les pages légales (placeholders bilingues). */
export function LegalPage({ titleKey, bodyKey }: LegalPageProps) {
  const t = useTranslations("Legal");
  return (
    <main className="mx-auto w-full max-w-7xl px-6 pt-20">
      <header className="border-b border-border-soft pb-16">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="max-w-4xl font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
          {t(titleKey)}
        </h1>
      </header>
      <div className="prose-editorial py-20">
        <p>{t(bodyKey)}</p>
      </div>
    </main>
  );
}
