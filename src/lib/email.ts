import nodemailer from "nodemailer";

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD || !EMAIL_FROM) {
  console.warn(
    "Faltan variables de entorno de email. Defina EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD y EMAIL_FROM en .env"
  );
}

const port = Number(EMAIL_PORT || 587);
const secure = port === 465; // true para puerto 465 (TLS), false para 587 (STARTTLS)

export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port,
  secure,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}) {
  if (!EMAIL_FROM) throw new Error("EMAIL_FROM no está definido en .env");

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo,
  });

  return { messageId: info.messageId };
}