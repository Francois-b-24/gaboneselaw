import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";

export default async function MentionsLegalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage titleKey="legalNoticeTitle" bodyKey="legalNoticeBody" />;
}
