import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "Falta NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL" },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") || "application/json";
  const body = await request.text();

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body,
      cache: "no-store",
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Error al contactar con n8n",
        detail: (error as Error).message,
      },
      { status: 502 }
    );
  }
}