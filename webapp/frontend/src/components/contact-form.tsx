"use client";

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
  const [status, setStatus] = useState<"idle" | "opened" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
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
      setErrorMessage("Nom, email et message sont requis.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setErrorMessage("Adresse email invalide.");
      return;
    }

    const to = contactRecipient();
    const subjectLine = subject || `Contact site ALIN — ${name}`;
    const body = [`De : ${name} <${email}>`, "", message].join("\n");
    const href = buildMailtoHref(to, subjectLine, body);

    if (href.length > MAX_MAILTO_CHARS) {
      setStatus("error");
      setErrorMessage(
        `Le message est trop long pour s'ouvrir automatiquement dans la messagerie (limite d'environ ${MAX_MAILTO_CHARS} caractères). Réduisez le texte ou écrivez directement à ${to}.`,
      );
      return;
    }

    setStatus("idle");
    window.location.href = href;
    setStatus("opened");
  }, []);

  const to = contactRecipient();

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      {status === "opened" && (
        <p className="border-l-2 border-terra pl-4 text-sm text-muted">
          Si la messagerie ne s&apos;est pas ouverte, vérifiez qu&apos;un client
          mail est installé sur cet appareil, ou écrivez directement à{" "}
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
          Nom
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Votre nom"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="sr-only">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Votre adresse email"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="sr-only">
          Objet (optionnel)
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          placeholder="Objet (optionnel)"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="sr-only">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder="Votre message"
          className={`${fieldClass} resize-y`}
        />
      </div>

      <button
        type="submit"
        className="border-b border-ink pb-1 text-base transition-colors hover:border-terra hover:text-terra"
      >
        Ouvrir ma messagerie →
      </button>
    </form>
  );
}
