"use client";

import { type FormEvent, useCallback, useState } from "react";

/** FormSubmit : l’appel doit partir du navigateur (CORS « cross-origin » documenté) ; un proxy Next côté serveur est souvent refusé. */
function formSubmitEndpoint(): string {
  const raw = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "felicia.oi@alin-africa.com").trim();
  return `https://formsubmit.co/ajax/${encodeURIComponent(raw)}`;
}

type FormSubmitAjaxResponse = {
  success?: string | boolean;
  message?: string;
};

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
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

    const subjectLine = subject || `Contact site ALIN — ${name}`;
    const textBody = [`De : ${name} <${email}>`, "", message].join("\n");

    try {
      const res = await fetch(formSubmitEndpoint(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          _replyto: email,
          _subject: subjectLine,
          _captcha: "false",
          message: textBody,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as FormSubmitAjaxResponse & {
        error?: string;
      };

      const okSuccess =
        data.success === true ||
        data.success === "true" ||
        (res.ok && data.success !== false && data.success !== "false");

      if (!res.ok || !okSuccess) {
        setStatus("error");
        setErrorMessage(
          typeof data.message === "string" && data.message.trim()
            ? data.message.trim()
            : data.error ??
                "L'envoi a échoué. Si c'est la première utilisation, l'équipe doit activer le formulaire depuis l'email FormSubmit."
        );
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        "Impossible d'envoyer le message (réseau ou blocage). Réessayez plus tard."
      );
    }
  }, []);

  return (
    <form
      onSubmit={onSubmit}
      className="surface mt-6 space-y-4 rounded-xl p-5 sm:p-6"
    >
      <h2 className="text-lg font-medium">Nous écrire</h2>
      <p className="text-muted text-sm">
        Votre message est envoyé directement à notre équipe. Nous vous répondrons
        sur l&apos;adresse email indiquée.
      </p>
      {status === "success" && (
        <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-[color:var(--foreground)]">
          Message envoyé. Merci pour votre prise de contact.
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
          disabled={status === "sending"}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
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
          disabled={status === "sending"}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
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
          disabled={status === "sending"}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
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
          disabled={status === "sending"}
          className="mt-1 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
          }}
        />
      </div>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-lg bg-[color:var(--primary)] px-4 py-2.5 text-sm font-medium text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--primary)]"
      >
        {status === "sending" ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
