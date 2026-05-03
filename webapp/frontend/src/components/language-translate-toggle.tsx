"use client";

import { useEffect, useState } from "react";
import {
  PAGE_LANG,
  TARGET_LANG,
  cookieHasEnglishTranslate,
  setStoredSiteLang,
  sitePrefersEnglishUI,
  storedSiteLangIsEnglish,
} from "@/lib/google-translate-session";

const SCRIPT_ID = "google-translate-script";
const CALLBACK = "googleTranslateElementInit";

type TranslateElementCtor = new (
  options: {
    pageLanguage: string;
    includedLanguages?: string;
  },
  containerId: string
) => unknown;

function setHtmlLang(lang: typeof PAGE_LANG | typeof TARGET_LANG) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
}

/** Single init per full page lifecycle (avoid duplicate gadgets on Strict Mode dev remount after reload). */
let translateGadgetCreated = false;

export function LanguageTranslateToggle() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setHasMounted(true);
    });
  }, []);

  const isEnglishUi = hasMounted && sitePrefersEnglishUI();

  useEffect(() => {
    if (!hasMounted) return;
    if (storedSiteLangIsEnglish() && !cookieHasEnglishTranslate()) {
      document.cookie = `googtrans=/${PAGE_LANG}/${TARGET_LANG};path=/;SameSite=Lax`;
      window.location.reload();
      return;
    }
    setHtmlLang(isEnglishUi ? TARGET_LANG : PAGE_LANG);
  }, [hasMounted, isEnglishUi]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initGadget = () => {
      const google = (
        window as unknown as {
          google?: {
            translate?: { TranslateElement: TranslateElementCtor };
          };
        }
      ).google;
      const Ctor = google?.translate?.TranslateElement;
      if (!Ctor || translateGadgetCreated) return;
      translateGadgetCreated = true;

      try {
        new Ctor(
          {
            pageLanguage: PAGE_LANG,
            includedLanguages: TARGET_LANG,
          },
          "google_translate_element"
        );
      } catch {
        translateGadgetCreated = false;
      }
    };

    (window as Window & { googleTranslateElementInit?: () => void })[CALLBACK] =
      initGadget;

    if (document.getElementById(SCRIPT_ID)) {
      const ctor = (
        window as unknown as {
          google?: { translate?: { TranslateElement: TranslateElementCtor } };
        }
      ).google?.translate?.TranslateElement;
      if (ctor) initGadget();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://translate.google.com/translate_a/element.js?cb=${CALLBACK}`;
    document.body.appendChild(script);
  }, []);

  const switchToFrench = () => {
    setStoredSiteLang("fr");
    document.cookie =
      "googtrans=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;SameSite=Lax";
    setHtmlLang(PAGE_LANG);
    window.location.reload();
  };

  const switchToEnglish = () => {
    setStoredSiteLang("en");
    document.cookie = `googtrans=/${PAGE_LANG}/${TARGET_LANG};path=/;SameSite=Lax`;
    setHtmlLang(TARGET_LANG);
    window.location.reload();
  };

  return (
      <div
        role="group"
        aria-label="Langue du site"
        className="flex shrink-0 items-center rounded-md border text-[0.6875rem] font-semibold leading-none"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "color-mix(in srgb, var(--surface) 88%, transparent)",
        }}
      >
        <button
          type="button"
          aria-label="Français"
          aria-pressed={!isEnglishUi}
          onClick={() => {
            if (!isEnglishUi) return;
            switchToFrench();
          }}
          className="min-h-8 cursor-pointer px-2.5 py-1.5 uppercase tracking-wide outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 sm:min-h-9 sm:text-xs rounded-l-[calc(0.375rem-1px)] rounded-r-none"
          style={
            !isEnglishUi
              ? {
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }
              : { color: "var(--muted-foreground)" }
          }
        >
          FR
        </button>
        <button
          type="button"
          aria-label="English"
          aria-pressed={isEnglishUi}
          onClick={() => {
            if (isEnglishUi) return;
            switchToEnglish();
          }}
          className="min-h-8 cursor-pointer border-l px-2.5 py-1.5 uppercase tracking-wide outline-none transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 sm:min-h-9 sm:text-xs rounded-r-[calc(0.375rem-1px)] rounded-l-none"
          style={{
            borderColor: "var(--border)",
            ...(isEnglishUi
              ? {
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }
              : { color: "var(--muted-foreground)" }),
          }}
        >
          EN
        </button>
      </div>
  );
}
