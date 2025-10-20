import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const to = url.searchParams.get("to") || process.env.EMAIL_FROM || "";
    const subject = url.searchParams.get("subject") || "Prueba SMTP Fideslex";
    const text = url.searchParams.get("text") || "Este es un correo de prueba enviado vía SMTP.";

    if (!to) {
      return NextResponse.json({ error: "Proporcione ?to o configure EMAIL_FROM" }, { status: 400 });
    }

    const { messageId } = await sendEmail({ to, subject, text });

    return NextResponse.json({ ok: true, to, subject, messageId });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}