"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useCallback, useState } from "react";

const DEFAULT_CONTACT_EMAIL = "felicia.oi@alin-africa.com";
/** Longueur max. prudente pour les liens mailto (varie selon les clients mail). */
const MAX_MAILTO_CHARS = 1900;

function contactRecipient(): string {
  const raw = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return raw || DEFAULT_CONTACT_EMAIL;
}

function buildMailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Champ éditorial : pas de label visible, bordure basse uniquement. */
const fieldClass =
  "w-full border-0 border-b border-border-soft bg-transparent py-3 text-base text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-terra";

export function ContactForm() {
  const t = useTranslations("ContactForm");
  const [status, setStatus] = useState<"idle" | "opened" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrorMessage(null);
      const form = e.currentTarget;
      const fd = new FormData(form);
      const name = String(fd.get("name") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const subject = String(fd.get("subject") ?? "").trim();
      const message = String(fd.get("message") ?? "").trim();

      if (!name || !email || !message) {
        setStatus("error");
        setErrorMessage(t("errRequired"));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setStatus("error");
        setErrorMessage(t("errEmail"));
        return;
      }

      const to = contactRecipient();
      const subjectLine = subject || t("subjectFallback", { name });
      const body = [t("bodyFrom", { name, email }), "", message].join("\n");
      const href = buildMailtoHref(to, subjectLine, body);

      if (href.length > MAX_MAILTO_CHARS) {
        setStatus("error");
        setErrorMessage(t("errTooLong", { max: MAX_MAILTO_CHARS, email: to }));
        return;
      }

      setStatus("idle");
      window.location.href = href;
      setStatus("opened");
    },
    [t],
  );

  const to = contactRecipient();

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      {status === "opened" && (
        <p className="border-l-2 border-terra pl-4 text-sm text-muted">
          {t("opened")}{" "}
          <a className="text-terra hover:text-terra-deep" href={`mailto:${to}`}>
            {to}
          </a>
          .
        </p>
      )}
      {status === "error" && errorMessage && (
        <p
          role="alert"
          className="border-l-2 pl-4 text-sm text-ink"
          style={{ borderColor: "#b91c1c" }}
        >
          {errorMessage}
        </p>
      )}

      <div>
        <label htmlFor="contact-name" className="sr-only">
          {t("name")}
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder={t("name")}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="sr-only">
          {t("email")}
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("email")}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="sr-only">
          {t("subject")}
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          placeholder={t("subject")}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="sr-only">
          {t("message")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder={t("message")}
          className={`${fieldClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        className="border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
      >
        {t("submit")} →
      </button>
    </form>
  );
}
