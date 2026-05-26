import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next 16 : convention `proxy` (ex-`middleware`). next-intl gère la
// négociation de locale et les préfixes d'URL (as-needed).
export const proxy = createMiddleware(routing);

export const config = {
  // Ignore /api, les internes _next, et tout ce qui ressemble à un fichier.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
