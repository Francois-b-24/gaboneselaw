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
  "Bonjour, je suis Ama'IA, votre assistant en droit gabonais. Posez votre question et je vous réponds de façon claire et accessible.";
const CHAT_REQUEST_TIMEOUT_MS = 90000;
const CHAT_PROXY_PATH = "/api/chat";
const SESSION_CLEAR_PROXY_PATH = "/api/session/clear";

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
  const shouldAutoScrollRef = useRef(true);

  const disclaimer = useMemo(() => {
    return "L'assistant peut faire des erreurs. Vérifiez les informations importantes.";
  }, []);

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    if (!shouldAutoScrollRef.current) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  function handleMessageScroll() {
    const container = messageContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  }

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
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort("chat-timeout"),
        CHAT_REQUEST_TIMEOUT_MS
      );
      const response = await fetch(CHAT_PROXY_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, history, session_id: sessionId }),
        signal: controller.signal,
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      const payload = (await response.json()) as BackendChatPayload & {
        detail?: string | { msg?: string }[];
      };
      if (!response.ok) {
        const detail = payload.detail;
        const detailStr =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : "")).filter(Boolean).join(" ")
              : "";
        throw new Error(
          (typeof payload.error === "string" && payload.error.trim()
            ? payload.error.trim()
            : detailStr.trim()) || "Le service de chat est momentanément indisponible."
        );
      }

      setLastAnswerSources(payload.sources ?? []);
      setLastAnswerQuality(payload.quality ?? null);
      if (payload.session_id) {
        setSessionId(payload.session_id);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: payload.answer ?? "Aucune réponse reçue." },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "Le service met trop de temps à répondre. Réessayez dans un instant ou rechargez la page."
        );
        return;
      }
      if (err instanceof TypeError) {
        const raw = String(err.message ?? "");
        if (/failed to fetch|load failed|networkerror/i.test(raw)) {
          setError(
            "Connexion interrompue. Vérifiez votre réseau, puis rechargez la page."
          );
          return;
        }
      }
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue pendant la réponse de l'assistant."
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

    if (!sessionId) {
      setSessionId(null);
      return;
    }

    try {
      await fetch(SESSION_CLEAR_PROXY_PATH, {
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
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col min-h-0 px-3 py-4 sm:px-4 sm:py-6">
      <header className="mb-3 sm:mb-4">
        <h1 className="text-2xl font-semibold sm:text-3xl">Ama&apos;IA</h1>
        <p className="text-muted mt-2 text-sm">
          Posez votre question sur le droit gabonais. Ama&apos;IA répond de façon
          claire, en tenant compte automatiquement du contexte disponible.
        </p>
      </header>

      <section
        ref={messageContainerRef}
        aria-live="polite"
        onScroll={handleMessageScroll}
        className="surface flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-slate-200/60 p-3 sm:gap-4 sm:p-4"
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
                {isUser ? "Vous" : "Ama'IA"}
              </p>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {msg.content}
              </p>
            </article>
          );
        })}

        {isLoading ? (
          <article className="surface-muted mr-auto inline-flex items-center gap-2 rounded-lg p-3 text-sm" aria-live="polite">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--primary)]" />
            <span>Ama&apos;IA redige sa reponse...</span>
          </article>
        ) : null}
      </section>

      <div
        className="sticky bottom-0 mt-3 bg-[color:var(--background)] pb-2 pt-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <p className="text-muted text-xs sm:max-w-[55%]">
                Entrée pour envoyer, Maj+Entrée pour un saut de ligne.
              </p>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  title={isLoading ? "Ama'IA prépare la réponse" : "Envoyer votre question"}
                  className="btn-primary min-w-24 rounded-md px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2"
                >
                  {isLoading ? "Envoi..." : "Envoyer"}
                </button>
                <button
                  type="button"
                  onClick={() => void clearConversation()}
                  disabled={isLoading}
                  title="Efface tous les messages et la session sur le serveur."
                  aria-label="Supprimer la conversation"
                  className="rounded-md border border-red-200/80 bg-white px-3 py-2.5 text-sm font-medium text-red-800 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Supprimer la conversation
                </button>
              </div>
            </div>
            <p className="text-muted text-[11px]">{disclaimer}</p>
          </div>
        </form>
      </div>
    </main>
  );
}
