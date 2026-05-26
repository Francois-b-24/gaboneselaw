import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  // FR sans préfixe (/manifeste), EN préfixé (/en/manifeste).
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
