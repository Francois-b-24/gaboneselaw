import { NextRequest, NextResponse } from "next/server";

function backendBase(): string | null {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return raw || null;
}

export async function POST(request: NextRequest) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL manquant." }, { status: 500 });
  }

  const bodyText = await request.text();
  try {
    const upstream = await fetch(`${base}/api/session/clear`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: bodyText,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend injoignable pour /api/session/clear." }, { status: 502 });
  }
}
