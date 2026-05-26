import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage titleKey="privacyTitle" bodyKey="privacyBody" />;
}
