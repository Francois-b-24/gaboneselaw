"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

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

type LearningMode = "chat" | "lesson" | "exercise" | "correction";

type LessonRequest = {
  topic: string;
  domaine: string | null;
  level: "intro" | "intermediate" | "advanced";
};

type ExerciseRequest = {
  topic: string;
  domaine: string | null;
  format: "qcm";
  count: number;
};

type CorrectionRequest = {
  exercise_id: string;
  topic: string;
  domaine: string | null;
  answers: Array<{ question_id: string; selected_option: number | null }>;
};

type ExerciseQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correct_option: number;
  explanation: string;
};

type ExerciseData = {
  exercise_id: string;
  title: string;
  context: string;
  questions: ExerciseQuestion[];
};

type CorrectionFeedback = {
  question_id: string;
  selected_option: number | null;
  expected_option: number;
  is_correct: boolean;
  explanation: string;
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

const MODE_LABELS: Record<LearningMode, string> = {
  chat: "Chat juridique",
  lesson: "Cours de droit",
  exercise: "Exercices",
  correction: "Corrections guidées",
};

const MODE_DESCRIPTIONS: Record<LearningMode, string> = {
  chat: "Posez une question juridique et obtenez une réponse claire avec des sources.",
  lesson: "Demandez un mini-cours structuré sur un thème de droit gabonais.",
  exercise: "Générez un QCM pour vous entraîner sur un sujet précis.",
  correction: "Corrigez votre QCM et recevez un retour guidé, question par question.",
};

const PHASE2_ENDPOINTS = {
  lesson: "/api/lesson",
  exercise: "/api/exercise",
  correction: "/api/correction",
} as const;

function toParagraphs(content: string): string[] {
  const normalized = content
    .replace(/\r\n/g, "\n")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!normalized) return [];
  return normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}

export function ChatbotPanel() {
  const [question, setQuestion] = useState("");
  const [domaine, setDomaine] = useState("");
  const [mode, setMode] = useState<LearningMode>("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Prêt");
  const [includeUploads, setIncludeUploads] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("Aucun document téléversé.");
  const [selectedUploadName, setSelectedUploadName] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [extraOutput, setExtraOutput] = useState("");
  const [currentExercise, setCurrentExercise] = useState<ExerciseData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>(
    {}
  );
  const [score, setScore] = useState<number | null>(null);
  const [correctionFeedback, setCorrectionFeedback] = useState<CorrectionFeedback[]>([]);
  const [loadingTick, setLoadingTick] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: INITIAL_ASSISTANT_MESSAGE,
    },
  ]);
  const messageContainerRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setInterval(() => {
      setLoadingTick((prev) => (prev + 1) % 4);
    }, 380);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || isLoading) return;

    setQuestion("");
    setIsLoading(true);
    setLoadingLabel(
      mode === "chat"
        ? "Analyse de votre question et recherche des sources..."
        : `Préparation ${MODE_LABELS[mode].toLowerCase()}...`
    );
    setLastQuestion(prompt);
    setExtraOutput("");
    setScore(null);
    setCorrectionFeedback([]);
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      if (mode === "lesson") {
        const payload: LessonRequest = {
          topic: prompt,
          domaine: domaine || null,
          level: "intro",
        };
        const response = await fetch(`${API_BASE_URL}${PHASE2_ENDPOINTS.lesson}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Le module cours est indisponible.");
        const data = (await response.json()) as { lesson: string };
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: data.lesson || "Aucun cours n'a pu etre genere pour ce sujet.",
          };
          return copy;
        });
        return;
      }

      if (mode === "exercise") {
        const payload: ExerciseRequest = {
          topic: prompt,
          domaine: domaine || null,
          format: "qcm",
          count: 3,
        };
        const response = await fetch(`${API_BASE_URL}${PHASE2_ENDPOINTS.exercise}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Le module exercices est indisponible.");
        const data = (await response.json()) as { exercise: ExerciseData };
        const exercise = data.exercise;
        setCurrentExercise(exercise);
        const freshAnswers = Object.fromEntries(
          exercise.questions.map((q) => [q.id, null])
        ) as Record<string, number | null>;
        setSelectedAnswers(freshAnswers);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content:
              `Exercice genere: ${exercise.title}\n\n${exercise.context}\n\n` +
              "Vous pouvez maintenant selectionner vos reponses, puis passer en mode Corrections guidees pour obtenir une evaluation detaillee.",
          };
          return copy;
        });
        return;
      }

      if (mode === "correction") {
        if (!currentExercise) {
          throw new Error("Générez d'abord un exercice QCM avant la correction guidée.");
        }
        const payload: CorrectionRequest = {
          exercise_id: currentExercise.exercise_id,
          topic: prompt,
          domaine: domaine || null,
          answers: currentExercise.questions.map((question) => ({
            question_id: question.id,
            selected_option: selectedAnswers[question.id] ?? null,
          })),
        };
        const response = await fetch(`${API_BASE_URL}${PHASE2_ENDPOINTS.correction}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Le module correction est indisponible.");
        const data = (await response.json()) as {
          score: number;
          total: number;
          feedback: CorrectionFeedback[];
          revision_tips: string[];
        };
        setScore(data.score);
        setCorrectionFeedback(data.feedback || []);
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content:
              `Correction terminee. Score obtenu: ${data.score}/${data.total}.\n\n` +
              `Analyse detaillee disponible ci-dessous pour chaque question.\n\n` +
              `Pistes de revision: ${(data.revision_tips || []).join(" ")}`,
          };
          return copy;
        });
        return;
      }

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
      setSelectedUploadName("");
      setUploadStatus("Aucun document téléversé.");
      return;
    }
    setSelectedUploadName(file.name);
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
      setSelectedUploadName("");
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
      setCurrentExercise(null);
      setSelectedAnswers({});
      setScore(null);
      setCorrectionFeedback([]);
      setIncludeUploads(false);
      setSelectedUploadName("");
      setUploadStatus("Aucun document téléversé.");
      setMessages([{ role: "assistant", content: INITIAL_ASSISTANT_MESSAGE }]);
      setLoadingLabel("Prêt");
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">
        Bienvenue sur ALIN. Je peux vous aider sur le droit gabonais (travail, foncier, famille).
      </h1>
      <p className="text-muted mt-2 text-sm">{disclaimer}</p>
      <p className="mt-1 text-xs text-amber-300">
        Ce chatbot répond uniquement aux questions relevant du droit gabonais.
      </p>
      <section className="surface mt-4 rounded-xl p-4">
        <h2 className="text-base font-semibold">A quoi sert ce chatbot ?</h2>
        <p className="text-muted mt-2 text-sm leading-relaxed">
          Cet outil vous aide a comprendre des notions de droit gabonais avec un langage simple.
          Il peut repondre a vos questions, proposer un cours, generer un exercice QCM et corriger
          vos reponses. Les reponses restent des informations generales et ne remplacent pas un
          conseil juridique personnalise.
        </p>
        <h3 className="mt-4 text-sm font-semibold">Comment utiliser cet outil (3 etapes)</h3>
        <ol className="text-muted mt-2 space-y-1 text-sm leading-relaxed">
          <li>1. Choisissez un mode ci-dessous.</li>
          <li>2. Ecrivez votre sujet ou votre question, puis cliquez sur Envoyer.</li>
          <li>3. Lisez la reponse et, si besoin, continuez avec un autre mode.</li>
        </ol>
      </section>
      <div className="surface mt-4 rounded-xl p-4">
        <label className="mb-2 block text-sm font-medium">Mode</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(MODE_LABELS) as LearningMode[]).map((value) => {
            const isActive = mode === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  isActive
                    ? "border-[color:var(--primary)] bg-amber-50/50"
                    : "border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--surface-muted)]"
                )}
              >
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{MODE_LABELS[value]}</p>
                <p className="text-muted mt-1 text-xs leading-relaxed">{MODE_DESCRIPTIONS[value]}</p>
              </button>
            );
          })}
        </div>
        <p className="text-muted mt-3 text-xs">
          Mode actif: <span className="font-medium text-[color:var(--foreground)]">{MODE_LABELS[mode]}</span>.
          {mode === "correction"
            ? " Commencez par generer un exercice en mode Exercices, puis revenez ici pour la correction."
            : " Saisissez ensuite votre demande puis cliquez sur Envoyer."}
        </p>
      </div>
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
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted text-xs">Questions suggérées</p>
            <p className="text-muted text-[11px]">
              Astuce: cliquez sur une question pour la préparer.
            </p>
          </div>
          <div className="mt-2 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {suggestedQuestions.map((item) => (
              <button
                key={item}
                type="button"
                className="btn-secondary shrink-0 snap-start rounded-full px-3 py-1.5 text-xs transition-transform hover:-translate-y-0.5"
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
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="chatbot-upload-pdf"
            className="inline-flex cursor-pointer items-center rounded-md border border-[color:var(--primary)]/45 bg-amber-50/60 px-3 py-2 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-amber-100/70"
          >
            Choisissez un fichier
          </label>
          <span className="text-muted text-xs">
            {selectedUploadName || "Aucun fichier choisi"}
          </span>
          {selectedUploadName ? (
            <button
              type="button"
              onClick={() => handleUpload(null)}
              className="btn-secondary rounded-md px-2 py-1 text-[11px]"
            >
              Retirer
            </button>
          ) : null}
        </div>
        <input
          id="chatbot-upload-pdf"
          type="file"
          accept="application/pdf"
          onChange={(event) => handleUpload(event.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <p className="text-muted mt-2 text-xs">{uploadStatus}</p>
      </div>

      <section
        ref={messageContainerRef}
        className="surface mt-6 flex max-h-[52vh] flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-3 sm:max-h-[58vh] sm:p-4"
      >
        {isLoading && (
          <div className="surface-muted rounded-lg p-3 text-sm text-[color:var(--foreground)]">
            <p className="font-medium">{loadingLabel}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-[color:var(--primary)]" />
            </div>
            <p className="text-muted mt-2 text-xs">
              Le modele traite votre demande{".".repeat(Math.max(1, loadingTick))}
            </p>
          </div>
        )}
        {messages.map((msg, index) => (
          <article
            key={`${msg.role}-${index}`}
            className={`rounded-lg p-3 text-sm ${
              msg.role === "user"
                ? "ml-4 border border-amber-300/30 bg-slate-700 text-slate-50 sm:ml-10"
                : "surface-muted mr-4 text-[color:var(--foreground)] sm:mr-10"
            }`}
          >
            <div className="space-y-2">
              {toParagraphs(msg.content || "...").map((paragraph, paragraphIndex) => (
                <p
                  key={`${index}-p-${paragraphIndex}`}
                  className={cn(
                    "whitespace-pre-wrap text-[0.92rem] leading-relaxed",
                    msg.role === "assistant" ? "text-[color:var(--foreground)]" : "text-slate-50"
                  )}
                >
                  {paragraph}
                </p>
              ))}
            </div>
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

      {currentExercise && (
        <section className="surface mt-4 rounded-xl p-4">
          <h2 className="text-sm font-semibold">QCM en cours: {currentExercise.title}</h2>
          <p className="text-muted mt-1 text-xs">{currentExercise.context}</p>
          <div className="mt-3 space-y-4">
            {currentExercise.questions.map((question, index) => (
              <article key={question.id} className="surface-muted rounded-lg p-3">
                <p className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <div className="mt-2 grid gap-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={`${question.id}-${optionIndex}`} className="flex items-start gap-2 text-sm">
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={selectedAnswers[question.id] === optionIndex}
                        onChange={() =>
                          setSelectedAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {(score !== null || correctionFeedback.length > 0) && (
        <section className="surface mt-4 rounded-xl p-4">
          {score !== null && (
            <p className="text-sm font-semibold">
              Resultat global: {score}/{currentExercise?.questions.length ?? 0}
            </p>
          )}
          <div className="mt-3 space-y-2">
            {correctionFeedback.map((item) => (
              <article key={item.question_id} className="surface-muted rounded-md p-3 text-sm">
                <p className="font-medium">
                  {item.is_correct ? "Reponse correcte" : "Reponse incorrecte"} - Question {item.question_id}
                </p>
                <p className="text-muted mt-1">
                  Votre choix: {item.selected_option ?? "Aucun"} | Reponse attendue: {item.expected_option}
                </p>
                <p className="mt-1 leading-relaxed">{item.explanation}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <form onSubmit={onSubmit} className="surface mt-4 rounded-xl p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Posez votre question juridique..."
            className="surface min-h-11 w-full flex-1 rounded-md bg-transparent px-3 py-2.5 text-sm outline-none sm:min-h-0"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary shrink-0 rounded-md px-4 py-2.5 text-sm disabled:opacity-50 sm:min-w-[7rem]"
          >
            {isLoading ? "Analyse..." : "Envoyer"}
          </button>
        </div>
      </form>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={runSynthesis}
          disabled={isLoading}
          className="btn-secondary w-full rounded-md px-4 py-2.5 text-sm disabled:opacity-50 sm:w-auto"
        >
          Synthèse des sources
        </button>
        <button
          type="button"
          onClick={runReport}
          disabled={isLoading}
          className="btn-secondary w-full rounded-md px-4 py-2.5 text-sm disabled:opacity-50 sm:w-auto"
        >
          Générer un rapport
        </button>
        <button
          type="button"
          onClick={downloadReportPdf}
          disabled={isLoading}
          className="btn-secondary w-full rounded-md px-4 py-2.5 text-sm disabled:opacity-50 sm:w-auto"
        >
          Télécharger le PDF
        </button>
        <button
          type="button"
          onClick={clearConversation}
          disabled={isLoading}
          className="btn-secondary w-full rounded-md px-4 py-2.5 text-sm disabled:opacity-50 sm:w-auto"
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
