"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type SourceBadge = {
  citation: string;
  text: string;
  score: number;
  badge: string;
};
type ChatQuality = {
  has_citation?: boolean;
  has_disclaimer?: boolean;
};
type BackendChatPayload = {
  answer?: string;
  error?: string;
  sources?: SourceBadge[];
  quality?: ChatQuality;
  session_id?: string;
};

const INITIAL_ASSISTANT_MESSAGE =
  "Bonjour, je suis votre assistant en droit gabonais. Posez votre question et je vous réponds de façon claire et accessible.";
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
const CHAT_REQUEST_TIMEOUT_MS = 90000;

export function ChatbotPanel() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: INITIAL_ASSISTANT_MESSAGE },
  ]);
  const [lastAnswerSources, setLastAnswerSources] = useState<SourceBadge[]>([]);
  const [lastAnswerQuality, setLastAnswerQuality] = useState<ChatQuality | null>(null);
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
    setLastAnswerSources([]);
    setLastAnswerQuality(null);
    const history = [...messages, { role: "user" as const, content: prompt }];
    setMessages(history);

    try {
      if (!API_BASE_URL) {
        throw new Error(
          "Configuration manquante: renseignez NEXT_PUBLIC_API_BASE_URL pour connecter le chatbot au backend juridique."
        );
      }
      const endpoint = `${API_BASE_URL}/api/chat`;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort("chat-timeout"),
        CHAT_REQUEST_TIMEOUT_MS
      );
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, history, session_id: sessionId }),
        signal: controller.signal,
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      const payload = (await response.json()) as BackendChatPayload;
      if (!response.ok) {
        throw new Error(payload.error ?? "Le service de chat est indisponible.");
      }

      setLastAnswerSources(payload.sources ?? []);
      setLastAnswerQuality(payload.quality ?? null);
      if (payload.session_id) {
        setSessionId(payload.session_id);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: payload.answer ?? "Aucune reponse recue." },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "Le serveur juridique local ne repond pas a temps. Verifiez que le backend FastAPI tourne sur http://localhost:8000."
        );
        return;
      }
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

  async function clearConversation() {
    if (isLoading) return;
    setError(null);
    setQuestion("");
    setLastAnswerSources([]);
    setLastAnswerQuality(null);
    setMessages([{ role: "assistant", content: INITIAL_ASSISTANT_MESSAGE }]);

    if (!API_BASE_URL || !sessionId) {
      setSessionId(null);
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/api/session/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      // Reset local state even if backend session cleanup fails.
    } finally {
      setSessionId(null);
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-9rem)] w-full max-w-4xl flex-col px-3 py-4 sm:h-[calc(100vh-10rem)] sm:px-4 sm:py-6">
      <header className="mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold sm:text-3xl">Chatbot</h1>
          <button
            type="button"
            onClick={clearConversation}
            disabled={isLoading}
            title="Reinitialise la conversation en cours (messages et session)."
            aria-label="Reinitialiser la conversation en cours"
            className="rounded-md border border-slate-300/60 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Nouvelle conversation
          </button>
        </div>
        <p className="text-muted mt-2 text-sm">
          Posez votre question sur le droit gabonais. L&apos;assistant répond de facon
          claire, en tenant compte automatiquement du contexte disponible.
        </p>
      </header>

      <section
        ref={messageContainerRef}
        aria-live="polite"
        className="surface flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200/60 p-3 sm:gap-4 sm:p-4"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <article
              key={`${msg.role}-${index}`}
              className={`max-w-[92%] rounded-xl border px-3 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[85%] sm:px-4 sm:py-3 ${
                isUser
                  ? "ml-auto border-slate-700 bg-slate-700 text-slate-50"
                  : "surface-muted mr-auto border-slate-200/70 text-[color:var(--foreground)]"
              }`}
            >
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">
                {isUser ? "Vous" : "Assistant"}
              </p>
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

      <div className="sticky bottom-0 mt-3 bg-[color:var(--background)] pb-2 pt-2">
        {lastAnswerQuality &&
        (!lastAnswerQuality.has_citation || !lastAnswerQuality.has_disclaimer) ? (
          <div className="mb-2 rounded-md border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
            Reponse de prudence: certains elements ne sont pas appuyes par des
            citations documentaires completes. Verifiez les points sensibles avec un
            professionnel.
          </div>
        ) : null}
        {lastAnswerSources.length > 0 ? (
          <div className="mb-2 rounded-md border border-slate-300/40 bg-slate-50/60 px-3 py-2 text-xs text-slate-700">
            Sources utilisees: {lastAnswerSources.length}
          </div>
        ) : null}
        {error ? (
          <div className="mb-2 rounded-md border border-red-300/50 bg-red-50/70 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="surface rounded-xl border border-slate-200/60 p-3">
          <div className="flex flex-col gap-2.5">
            <label htmlFor="chatbot-question" className="text-sm font-medium">
              Votre question juridique
            </label>
            <textarea
              id="chatbot-question"
              ref={textareaRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={onTextareaKeyDown}
              placeholder="Ex: Mon employeur peut-il me licencier sans preavis ?"
              rows={1}
              className="surface min-h-12 w-full resize-none rounded-md border border-slate-300/50 bg-transparent px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted text-xs">Entrée pour envoyer, Maj+Entrée pour un saut de ligne.</p>
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                title={isLoading ? "L'assistant prepare la reponse" : "Envoyer votre question"}
                className="btn-primary min-w-24 rounded-md px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
              >
                {isLoading ? "Envoi..." : "Envoyer"}
              </button>
            </div>
            <p className="text-muted text-[11px]">{disclaimer}</p>
          </div>
        </form>
      </div>
    </main>
  );
}
