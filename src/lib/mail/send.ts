import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

/**
 * Envoi d'e-mails par SMTP standard. Fournisseur interchangeable sans toucher au code :
 * - Gmail (test)        : SMTP_HOST=smtp.gmail.com     SMTP_PORT=465 (mot de passe d'application)
 * - Microsoft 365       : SMTP_HOST=smtp.office365.com SMTP_PORT=587
 * - Autre hébergeur     : ses paramètres SMTP
 */
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASSWORD");
  if (!host || !user || !pass) return null;
  const port = Number(env("SMTP_PORT") ?? 465);
  transporter ??= nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

export type MailResult = { ok: true } | { ok: false; error: string };

export async function sendMail(message: { to: string; subject: string; html: string; text: string }): Promise<MailResult> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "Envoi d'e-mails non configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)." };
  const from = env("MAIL_FROM") ?? env("SMTP_USER")!;
  try {
    await t.sendMail({ from, replyTo: env("MAIL_REPLY_TO"), ...message });
    return { ok: true };
  } catch (error) {
    console.error("sendMail", error);
    return { ok: false, error: "Le serveur d'envoi a refusé le message." };
  }
}
