import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to: string = body?.to;
    const name: string | undefined = body?.name;

    if (!to || typeof to !== "string") {
      return NextResponse.json({ ok: false, error: "Parámetro 'to' requerido" }, { status: 400 });
    }

    const subject = "Bienvenido a Fídex Lex Asesoría Jurídica";
    const text = `Hola${name ? ` ${name}` : ""},

Gracias por registrarte en Fídex Lex Asesoría Jurídica. Ya puedes acceder a tu panel de cliente y comenzar a explorar nuestros servicios profesionales.

Un saludo cordial,
Equipo Fídex Lex`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#111; line-height:1.6; max-width:600px; margin:auto; padding:20px;">
        <h1 style="font-weight: 600; color:#000; margin-bottom:20px;">Bienvenido a Fídex Lex Asesoría Jurídica</h1>
        <p style="font-size:16px;">Hola${name ? ` ${name}` : ""},</p>
        <p style="font-size:16px; margin-top:8px; margin-bottom:16px;">
          Gracias por unirte a <strong>Fídex Lex Asesoría Jurídica</strong>. Ya puedes acceder a tu panel de cliente para gestionar tus consultas legales y agendar citas con facilidad.
        </p>
        <p style="font-size:16px; margin-bottom:16px;">
          Si no solicitaste esta cuenta, simplemente ignora este mensaje.
        </p>
        <p style="font-size:16px;">
          Un saludo cordial,<br/>
          <strong>Equipo Fídex Lex</strong>
        </p>
      </div>
    `;

    const { messageId } = await sendEmail({ to, subject, text, html });
    return NextResponse.json({ ok: true, messageId });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Error enviando email" }, { status: 500 });
  }
}
