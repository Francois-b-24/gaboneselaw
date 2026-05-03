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
        `Le message est trop long pour s'ouvrir automatiquement dans la messagerie (limite d'environ ${MAX_MAILTO_CHARS} caractères). Réduisez le texte ou écrivez directement à ${to}.`
      );
      return;
    }

    setStatus("idle");
    window.location.href = href;
    setStatus("opened");
  }, []);

  const to = contactRecipient();

  return (
    <form
      onSubmit={onSubmit}
      className="surface mt-6 space-y-4 rounded-xl p-5 sm:p-6"
    >
      <h2 className="text-lg font-medium">Nous écrire</h2>
      <p className="text-muted text-sm">
        En validant le formulaire, votre logiciel de messagerie s&apos;ouvre avec un
        message prérempli vers notre équipe. Il vous suffit alors d&apos;envoyer
        l&apos;email depuis votre boîte mail.
      </p>
      <p className="text-muted text-sm">
        Adresse de contact :{" "}
        <a className="font-medium text-[color:var(--primary)] underline" href={`mailto:${to}`}>
          {to}
        </a>
      </p>
      {status === "opened" && (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-[color:var(--foreground)]">
          Si la messagerie ne s&apos;est pas ouverte, vérifiez qu&apos;un client mail est
          installé sur cet appareil, ou utilisez le lien email ci-dessus.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p
          className="rounded-md border px-3 py-2 text-sm text-[color:var(--foreground)]"
          style={{
            borderColor: "color-mix(in srgb, #b91c1c 35%, var(--border))",
            backgroundColor: "color-mix(in srgb, #fef2f2 90%, var(--surface))",
          }}
        >
          {errorMessage}
        </p>
      )}
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium">
          Nom
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <div>
        <label htmlFor="contact-subject" className="block text-sm font-medium">
          Objet <span className="font-normal text-muted">(optionnel)</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-[color:var(--primary)] px-4 py-2.5 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--primary)]"
      >
        Ouvrir ma messagerie
      </button>
    </form>
  );
}
