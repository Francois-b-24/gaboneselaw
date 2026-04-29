"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };

const INITIAL_ASSISTANT_MESSAGE =
  "Bonjour, je suis votre assistant en droit gabonais. Posez votre question et je vous réponds de façon claire et accessible.";

export function ChatbotPanel() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_ASSISTANT_MESSAGE },
  ]);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const disclaimer = useMemo(() => {
    return "L'assistant peut faire des erreurs. Vérifiez les informations importantes.";
  }, []);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [question]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const prompt = question.trim();
    if (!prompt || isLoading) return;

    setQuestion("");
    setError(null);
    setIsLoading(true);
    const history = [...messages, { role: "user" as const, content: prompt }];
    setMessages(history);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, history }),
      });

      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Le service de chat est indisponible.");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: payload.answer ?? "Aucune reponse recue." },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la reponse de l'assistant."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function onTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-10rem)] w-full max-w-4xl flex-col px-3 py-6 sm:h-[calc(100vh-11rem)] sm:px-4 sm:py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">Chatbot</h1>
        <p className="text-muted mt-2 text-sm">
          Posez votre question sur le droit gabonais. L&apos;assistant répond de facon
          claire, en tenant compte automatiquement du contexte disponible.
        </p>
      </header>

      <section
        ref={messageContainerRef}
        aria-live="polite"
        className="surface flex flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-3 sm:p-4"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <article
              key={`${msg.role}-${index}`}
              className={`max-w-[88%] rounded-lg p-3 text-sm leading-relaxed ${
                isUser
                  ? "ml-auto bg-slate-700 text-slate-50"
                  : "surface-muted mr-auto text-[color:var(--foreground)]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </article>
          );
        })}

        {isLoading ? (
          <article className="surface-muted mr-auto inline-flex items-center gap-2 rounded-lg p-3 text-sm" aria-live="polite">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--primary)]" />
            <span>L&apos;assistant rédige sa réponse...</span>
          </article>
        ) : null}
      </section>

      <div className="sticky bottom-0 mt-4 bg-[color:var(--background)] pb-2 pt-2">
        {error ? (
          <div className="mb-2 rounded-md border border-red-300/50 bg-red-50/70 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="surface rounded-xl p-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="chatbot-question" className="text-sm font-medium">
              Votre question juridique
            </label>
            <textarea
              id="chatbot-question"
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onTextareaKeyDown}
              placeholder="Posez votre question juridique..."
              rows={1}
              className="surface min-h-11 w-full resize-none rounded-md bg-transparent px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted text-xs">{disclaimer}</p>
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="btn-primary rounded-md px-4 py-2.5 text-sm disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
              >
                {isLoading ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
