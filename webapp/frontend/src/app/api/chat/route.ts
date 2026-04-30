import { NextRequest, NextResponse } from "next/server";
import { searchDocuments } from "@/lib/search-documents";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
};

type ResolvedEnvVar = {
  value: string;
  key: string;
};

const ANTHROPIC_API_KEY_ENV_KEYS = [
  "ANTHROPIC_API_KEY",
  "CLAUDE_API_KEY",
  "ANTHROPIC_KEY",
] as const;
const ANTHROPIC_MODEL_ENV_KEYS = ["ANTHROPIC_MODEL", "CLAUDE_MODEL"] as const;
const ANTHROPIC_FALLBACK_MODEL_ENV_KEYS = [
  "ANTHROPIC_MODEL_FALLBACK",
  "CLAUDE_MODEL_FALLBACK",
] as const;
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-6";
const DEFAULT_ANTHROPIC_FALLBACK_MODEL = "claude-haiku-4-5";
const DEFAULT_LLM_TEMPERATURE = 0.2;

const SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé en droit gabonais. Ton rôle est de répondre de manière claire, précise et accessible aux questions des utilisateurs sur le droit du Gabon.

Si un contexte documentaire t'est fourni, appuie-toi prioritairement dessus. Sinon, réponds sur la base de tes connaissances générales en signalant les limites éventuelles.

Précise toujours que tes réponses ne constituent pas un conseil juridique professionnel et invite l'utilisateur à consulter un avocat pour les cas concrets.

Réponds en français.`;

function resolveFirstEnv(keys: string[]): ResolvedEnvVar | null {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return { value, key };
    }
  }
  return null;
}

function resolveAnthropicRuntimeConfig() {
  const apiKeyCandidate = resolveFirstEnv([...ANTHROPIC_API_KEY_ENV_KEYS]);
  const modelCandidate = resolveFirstEnv([...ANTHROPIC_MODEL_ENV_KEYS]);
  const fallbackModelCandidate = resolveFirstEnv([
    ...ANTHROPIC_FALLBACK_MODEL_ENV_KEYS,
  ]);
  const temperatureRaw = process.env.LLM_TEMPERATURE ?? `${DEFAULT_LLM_TEMPERATURE}`;
  const temperature = Number(temperatureRaw);

  return {
    apiKeyCandidate,
    modelCandidate,
    fallbackModelCandidate,
    fallbackModel: fallbackModelCandidate?.value ?? DEFAULT_ANTHROPIC_FALLBACK_MODEL,
    temperature: Number.isFinite(temperature) ? temperature : DEFAULT_LLM_TEMPERATURE,
  };
}

function buildContextBlock(docs: Awaited<ReturnType<typeof searchDocuments>>) {
  if (!docs.length) return "";

  return docs
    .map((doc, index) => {
      const source = doc.source ? ` (source: ${doc.source})` : "";
      return `[Doc ${index + 1}] ${doc.title}${source}\n${doc.excerpt}`;
    })
    .join("\n\n");
}

async function askAnthropic(params: {
  apiKey: string;
  model: string;
  temperature: number;
  system: string;
  messages: ChatMessage[];
}) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 900,
      temperature: params.temperature,
      system: params.system,
      messages: params.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as AnthropicResponse;
  const answer = data.content
    ?.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();

  return answer || "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      question?: unknown;
      history?: unknown;
    };

    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      return NextResponse.json(
        { error: "La question est obligatoire." },
        { status: 400 }
      );
    }

    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history
          .filter((item): item is ChatMessage => {
            if (!item || typeof item !== "object") return false;
            const candidate = item as Record<string, unknown>;
            return (
              (candidate.role === "user" || candidate.role === "assistant") &&
              typeof candidate.content === "string"
            );
          })
          .slice(-10)
      : [];

    const docs = await searchDocuments(question);
    const context = buildContextBlock(docs);

    const messages: ChatMessage[] = [
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      {
        role: "user",
        content: context
          ? `Contexte documentaire:\n${context}\n\nQuestion:\n${question}`
          : question,
      },
    ];

    const config = resolveAnthropicRuntimeConfig();
    const apiKey = config.apiKeyCandidate?.value;
    const model = config.modelCandidate?.value ?? DEFAULT_ANTHROPIC_MODEL;
    const fallbackModel = config.fallbackModel;
    const temperature = config.temperature;

    if (!apiKey) {
      console.error(
        `[/api/chat] Configuration Anthropic manquante (api key). Variables supportees: ${ANTHROPIC_API_KEY_ENV_KEYS.join(
          ", "
        )}.`
      );
      return NextResponse.json(
        {
          error:
            "Configuration manquante: renseignez une cle API Anthropic via ANTHROPIC_API_KEY (ou CLAUDE_API_KEY / ANTHROPIC_KEY) et un modele via ANTHROPIC_MODEL (ou CLAUDE_MODEL).",
        },
        { status: 500 }
      );
    }

    console.info("[/api/chat] Configuration LLM resolue", {
      apiKeyEnv: config.apiKeyCandidate?.key ?? null,
      modelEnv: config.modelCandidate?.key ?? `default:${DEFAULT_ANTHROPIC_MODEL}`,
      fallbackModelEnv:
        config.fallbackModelCandidate?.key ??
        `default:${DEFAULT_ANTHROPIC_FALLBACK_MODEL}`,
    });

    let answer = "";
    try {
      answer = await askAnthropic({
        apiKey,
        model,
        temperature,
        system: SYSTEM_PROMPT,
        messages,
      });
    } catch (primaryError) {
      if (fallbackModel === model) {
        return NextResponse.json(
          {
            error: "Le fournisseur LLM a renvoye une erreur.",
            detail: primaryError instanceof Error ? primaryError.message : undefined,
          },
          { status: 500 }
        );
      }
      try {
        answer = await askAnthropic({
          apiKey,
          model: fallbackModel,
          temperature,
          system: SYSTEM_PROMPT,
          messages,
        });
      } catch (fallbackError) {
        return NextResponse.json(
          {
            error: "Le fournisseur LLM a renvoye une erreur.",
            detail:
              fallbackError instanceof Error ? fallbackError.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      answer:
        answer ??
        "Je n'ai pas pu generer de reponse pour le moment. Veuillez reessayer.",
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne lors du traitement de la demande." },
      { status: 500 }
    );
  }
}
