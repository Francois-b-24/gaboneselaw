export const PAGE_LANG = "fr";
export const TARGET_LANG = "en";

const STORAGE_KEY = "alin-site-lang";

/** Persistée avec le cookie pour fiabiliser l’UI (onglets, liens) si le cookie est retardé ou reformulé. */
export function setStoredSiteLang(lang: "fr" | "en") {
  if (typeof window === "undefined") return;
  try {
    if (lang === "en") {
      window.localStorage.setItem(STORAGE_KEY, "en");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* quota / mode privé */
  }
}

/** Préférence anglais côté site (localStorage), indépendante de Google. */
export function storedSiteLangIsEnglish(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "en";
  } catch {
    return false;
  }
}

/**
 * Valeur brute du cookie googtrans (Google peut utiliser plusieurs formes).
 */
function readGoogtransValue(): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((c) => c.trim());
  for (const p of parts) {
    if (p.toLowerCase().startsWith("googtrans=")) {
      const v = p.slice("googtrans=".length);
      try {
        return decodeURIComponent(v).trim();
      } catch {
        return v.trim();
      }
    }
  }
  return null;
}

/**
 * Cookie Google : passage FR → EN (ex. `/fr/en`, `/auto/en`).
 */
export function cookieHasEnglishTranslate(): boolean {
  const raw = readGoogtransValue();
  if (!raw) return false;
  const segments = raw.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  const to = segments[segments.length - 1]?.toLowerCase();
  const from = segments[segments.length - 2]?.toLowerCase();
  if (to !== TARGET_LANG) return false;
  return from === PAGE_LANG || from === "auto";
}

/** Anglais pour l’UI (liens pleine page, onglets) : cookie Google ou choix stocké localement. */
export function sitePrefersEnglishUI(): boolean {
  if (typeof document === "undefined") return false;
  return cookieHasEnglishTranslate() || storedSiteLangIsEnglish();
}
