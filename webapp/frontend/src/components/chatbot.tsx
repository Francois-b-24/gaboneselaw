"use client";

import { FormEvent, useMemo, useState } from "react";

type Source = {
  citation: string;
  text: string;
  score: number;
  badge: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const DOMAIN_OPTIONS = [
  { value: "", label: "Tous les domaines" },
  { value: "travail", label: "Droit du travail" },
  { value: "foncier", label: "Droit foncier" },
  { value: "famille", label: "Droit de la famille" },
  { value: "commercial", label: "Droit commercial" },
  { value: "administratif", label: "Droit administratif" },
  { value: "penal", label: "Droit pénal" },
  { value: "fiscal", label: "Droit fiscal" },
  { value: "numerique", label: "Droit du numérique" },
];

const SUGGESTED_BY_DOMAIN: Record<string, string[]> = {
  all: [
    "Quels sont mes droits en cas de licenciement abusif au Gabon ?",
    "Quelles démarches pour sécuriser un acte foncier ?",
    "Comment fonctionne la garde des enfants après divorce ?",
  ],
  travail: [
    "Quel préavis s'applique en cas de rupture du contrat ?",
    "Comment est calculée l'indemnité de licenciement ?",
    "Quels recours en cas de salaire impayé ?",
  ],
  foncier: [
    "Comment obtenir un titre foncier au Gabon ?",
    "Comment contester un conflit de limites de terrain ?",
    "Quels documents vérifier avant d'acheter un terrain ?",
  ],
  famille: [
    "Quelles conditions pour un divorce par consentement mutuel ?",
    "Comment est organisée la garde des enfants ?",
    "Quelles règles de succession en l'absence de testament ?",
  ],
  commercial: [
    "Quelles formalités pour créer une société commerciale ?",
    "Comment sécuriser juridiquement un contrat commercial ?",
    "Quels recours en cas de facture impayée ?",
  ],
  administratif: [
    "Comment contester une décision administrative ?",
    "Quels délais pour introduire un recours administratif ?",
    "Quels documents fournir pour un recours gracieux ?",
  ],
  penal: [
    "Quelles étapes d'une procédure pénale au Gabon ?",
    "Quels sont les droits d'une personne en garde à vue ?",
    "Comment déposer plainte et suivre la procédure ?",
  ],
  fiscal: [
    "Comment régulariser une situation fiscale d'entreprise ?",
    "Quels risques en cas de retard de déclaration fiscale ?",
    "Comment contester un redressement fiscal ?",
  ],
  numerique: [
    "Quelles obligations sur les données personnelles au Gabon ?",
    "Comment encadrer l'usage de l'IA en entreprise ?",
    "Quelles clauses mettre dans une politique de confidentialité ?",
  ],
};

const INITIAL_ASSISTANT_MESSAGE =
  "Bienvenue sur ALIN. Je peux vous aider sur le droit gabonais (travail, foncier, famille).";

export function ChatbotPanel() {
  const [question, setQuestion] = useState("");
  const [domaine, setDomaine] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Prêt");
  const [includeUploads, setIncludeUploads] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Aucun document téléversé.");
  const [lastQuestion, setLastQuestion] = useState("");
  const [extraOutput, setExtraOutput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);

  const disclaimer = useMemo(
    () =>
      "Ce chatbot fournit des informations juridiques générales, pas un conseil juridique personnalisé.",
    []
  );
  const effectiveQuestion =
    lastQuestion ||
    [...messages].reverse().find((m) => m.role === "user")?.content ||
    "";
  const suggestedQuestions =
    SUGGESTED_BY_DOMAIN[domaine] || SUGGESTED_BY_DOMAIN.all;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || isLoading) return;

    setQuestion("");
    setIsLoading(true);
    setLoadingLabel("Analyse de votre question et recherche des sources...");
    setLastQuestion(prompt);
    setExtraOutput("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          domaine: domaine || null,
          session_id: sessionId,
          history: [],
          include_uploads: includeUploads,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error("Le streaming backend est indisponible.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const lines = frame.split("\n");
          let eventName = currentEvent;
          let dataPayload = "";
          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataPayload += line.slice(5).trim();
            }
          }
          currentEvent = eventName;
          if (!dataPayload) continue;

          const parsed = JSON.parse(dataPayload) as {
            token?: string;
            session_id?: string;
            answer?: string;
            sources?: Source[];
            message?: string;
          };

          if (eventName === "token" && parsed.token) {
            assistantText += parsed.token;
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return copy;
            });
          }

          if (eventName === "done") {
            if (parsed.session_id) setSessionId(parsed.session_id);
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                role: "assistant",
                content: parsed.answer ?? assistantText,
                sources: parsed.sources ?? [],
              };
              return copy;
            });
          }

          if (eventName === "error") {
            throw new Error(parsed.message ?? "Erreur serveur.");
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur inconnue est survenue.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Erreur: ${message}` },
      ]);
    } finally {
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) {
      await fetch(`${API_BASE_URL}/api/clear-upload`, { method: "POST" });
      setIncludeUploads(false);
      setUploadStatus("Aucun document téléversé.");
      return;
    }
    setIsLoading(true);
    setLoadingLabel("Indexation du document en cours...");
    setUploadStatus("Indexation du document en cours...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Échec du téléversement.");
      }
      const data = (await response.json()) as {
        filename: string;
        chunks: number;
        enabled: boolean;
      };
      setIncludeUploads(data.enabled);
      setUploadStatus(
        data.enabled
          ? `${data.filename} indexé (${data.chunks} extrait(s)).`
          : "Le PDF n'a pas pu être indexé (OCR manquant ?)."
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur de téléversement.";
      setIncludeUploads(false);
      setUploadStatus(`Erreur: ${message}`);
    } finally {
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  async function runSynthesis() {
    if (!effectiveQuestion) {
      setExtraOutput("Veuillez d'abord poser une question avant de lancer une synthèse.");
      return;
    }
    setIsLoading(true);
    setLoadingLabel("Génération de la synthèse des sources...");
    setExtraOutput("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/synthesis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: effectiveQuestion,
          domaine: domaine || null,
          include_uploads: includeUploads,
          focus: null,
        }),
      });
      if (!response.ok) {
        throw new Error("Synthèse indisponible.");
      }
      const data = (await response.json()) as { text: string };
      setExtraOutput(data.text || "Aucun contenu de synthèse.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la synthèse.";
      setExtraOutput(`Erreur: ${message}`);
    } finally {
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  async function runReport() {
    if (!effectiveQuestion) {
      setExtraOutput("Veuillez d'abord poser une question avant de générer un rapport.");
      return;
    }
    setIsLoading(true);
    setLoadingLabel("Rédaction du rapport juridique en cours...");
    setExtraOutput("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: effectiveQuestion,
          domaine: domaine || null,
          include_uploads: includeUploads,
        }),
      });
      if (!response.ok) {
        throw new Error("Rapport indisponible.");
      }
      const data = (await response.json()) as { markdown: string };
      setExtraOutput(data.markdown || "Aucun contenu de rapport.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors du rapport.";
      setExtraOutput(`Erreur: ${message}`);
    } finally {
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  async function downloadReportPdf() {
    if (!effectiveQuestion) {
      setExtraOutput("Veuillez d'abord poser une question avant de télécharger un PDF.");
      return;
    }
    setIsLoading(true);
    setLoadingLabel("Préparation du rapport PDF...");
    try {
      const response = await fetch(`${API_BASE_URL}/api/report/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: effectiveQuestion,
          domaine: domaine || null,
          include_uploads: includeUploads,
        }),
      });
      if (!response.ok) {
        throw new Error("Export PDF indisponible.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "rapport-juridique.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      setExtraOutput("Le rapport PDF a été généré et le téléchargement a été lancé.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la génération du PDF.";
      setExtraOutput(`Erreur: ${message}`);
    } finally {
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  async function clearConversation() {
    if (isLoading) return;
    setIsLoading(true);
    setLoadingLabel("Suppression de la conversation en cours...");
    try {
      if (sessionId) {
        await fetch(`${API_BASE_URL}/api/session/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
      }
      await fetch(`${API_BASE_URL}/api/clear-upload`, { method: "POST" });
    } finally {
      setSessionId(null);
      setQuestion("");
      setLastQuestion("");
      setExtraOutput("");
      setIncludeUploads(false);
      setUploadStatus("Aucun document téléversé.");
      setMessages([{ role: "assistant", content: INITIAL_ASSISTANT_MESSAGE }]);
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col px-4 py-8">
      <h1 className="text-3xl font-semibold">
        Bienvenue sur ALIN. Je peux vous aider sur le droit gabonais (travail, foncier, famille).
      </h1>
      <p className="text-muted mt-2 text-sm">{disclaimer}</p>
      <p className="mt-1 text-xs text-amber-300">
        Ce chatbot répond uniquement aux questions relevant du droit gabonais.
      </p>
      <div className="surface mt-4 rounded-xl p-4">
        <label className="mb-2 block text-sm font-medium">Domaine juridique</label>
        <select
          value={domaine}
          onChange={(event) => setDomaine(event.target.value)}
          className="surface-muted w-full rounded-md px-3 py-2 text-sm"
        >
          {DOMAIN_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="mt-3">
          <p className="text-muted text-xs">Questions suggérées</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedQuestions.map((item) => (
              <button
                key={item}
                type="button"
                className="btn-secondary rounded-full px-3 py-1 text-xs"
                onClick={() => setQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="surface mt-4 rounded-xl p-4">
        <label className="mb-2 block text-sm font-medium">
          Analyser un document PDF
        </label>
        <p className="text-muted mb-3 text-xs leading-relaxed">
          Le document téléversé est analysé puis découpé en extraits juridiques.
          Ces extraits sont ajoutés temporairement à la session pour enrichir les
          réponses du chatbot, les synthèses et les rapports. Le document n&apos;est
          pas conservé comme source permanente.
        </p>
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        <p className="text-muted mt-2 text-xs">{uploadStatus}</p>
      </div>

      <section className="surface mt-6 flex-1 space-y-4 rounded-xl p-4">
        {isLoading && (
          <div className="surface-muted rounded-lg p-3 text-sm text-[color:var(--foreground)]">
            {loadingLabel}
          </div>
        )}
        {messages.map((msg, index) => (
          <article
            key={`${msg.role}-${index}`}
            className={`rounded-lg p-3 ${
              msg.role === "user"
                ? "ml-10 border border-amber-300/30 bg-slate-700 text-slate-50"
                : "surface-muted mr-10 text-[color:var(--foreground)]"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm">{msg.content || "..."}</p>
            {!!msg.sources?.length && (
              <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                {msg.sources.map((source, sourceIndex) => (
                  <div
                    key={`${source.citation}-${sourceIndex}`}
                    className="surface rounded-md p-3 text-xs"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-amber-300">{source.citation}</p>
                      <span className="surface-muted rounded-full px-2 py-0.5 text-[10px]">
                        Type: {source.badge}
                      </span>
                      <span className="surface-muted rounded-full px-2 py-0.5 text-[10px]">
                        Pertinence: {source.score}
                      </span>
                    </div>
                    <p className="text-[color:var(--foreground)]/90">{source.text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Posez votre question juridique..."
          className="surface flex-1 rounded-md bg-transparent px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          {isLoading ? "Analyse..." : "Envoyer"}
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runSynthesis}
          disabled={isLoading}
          className="btn-secondary rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          Synthèse des sources
        </button>
        <button
          type="button"
          onClick={runReport}
          disabled={isLoading}
          className="btn-secondary rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          Générer un rapport
        </button>
        <button
          type="button"
          onClick={downloadReportPdf}
          disabled={isLoading}
          className="btn-secondary rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          Télécharger le PDF
        </button>
        <button
          type="button"
          onClick={clearConversation}
          disabled={isLoading}
          className="btn-secondary rounded-md px-4 py-2 text-sm disabled:opacity-50"
        >
          Supprimer la conversation
        </button>
      </div>
      {!!extraOutput && (
        <section className="surface-muted mt-4 rounded-xl p-4">
          <p className="whitespace-pre-wrap text-sm text-[color:var(--foreground)]">
            {extraOutput}
          </p>
        </section>
      )}
    </main>
  );
}
