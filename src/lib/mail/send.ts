import "server-only";
import { env } from "@/lib/env";
import { TIMEOUT_MS, userAgent } from "@/lib/live/http";

/**
 * Envoi d'e-mails par l'API Resend (https://resend.com/docs/api-reference/emails/send-email).
 * RESEND_API_KEY : clé « re_… » (serveur uniquement) ; MAIL_FROM : « REFIT Surface <adresse@domaine-vérifié> » ;
 * MAIL_REPLY_TO (facultatif) : adresse qui reçoit les réponses des clients.
 */
export type MailResult = { ok: true } | { ok: false; error: string };

export async function sendMail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Évite un double envoi si la même demande est rejouée (valable 24 h chez Resend). */
  idempotencyKey?: string;
}): Promise<MailResult> {
  const key = env("RESEND_API_KEY");
  const from = env("MAIL_FROM");
  if (!key || !from) return { ok: false, error: "Envoi d'e-mails non configuré (RESEND_API_KEY, MAIL_FROM)." };
  const replyTo = env("MAIL_REPLY_TO");

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "User-Agent": userAgent(),
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: "Resend injoignable." };
  }

  if (!response.ok) {
    // Seuls le code et le type d'erreur sont journalisés (jamais la clé ni le contenu de l'e-mail)
    const body = (await response.json().catch(() => null)) as { name?: string } | null;
    console.error("sendMail Resend", response.status, body?.name);
    return { ok: false, error: `Resend a refusé l'envoi (${response.status}${body?.name ? ` ${body.name}` : ""}).` };
  }
  return { ok: true };
}
