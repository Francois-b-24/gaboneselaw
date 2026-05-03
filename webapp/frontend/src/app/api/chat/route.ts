import { NextRequest, NextResponse } from "next/server";

function backendBase(): string | null {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return raw || null;
}

/**
 * Relais same-origin vers le FastAPI `/api/chat` (évite CORS navigateur en dev / prod).
 */
export async function POST(request: NextRequest) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      {
        error:
          "NEXT_PUBLIC_API_BASE_URL manquant : le serveur Next ne sait pas ou relayer le chat.",
      },
      { status: 500 }
    );
  }

  const bodyText = await request.text();
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: bodyText,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Le backend juridique ne repond pas. Verifiez qu'il tourne et que NEXT_PUBLIC_API_BASE_URL pointe vers la bonne URL (ex. http://127.0.0.1:8000).",
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
