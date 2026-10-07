"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { parisDate } from "@/lib/booking/time";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import { getQuoteByToken } from "@/lib/quotes/public";
import { createAdminClient } from "@/lib/supabase/admin";

const CONSENT = "J'ai lu le devis et je l'accepte — Bon pour accord.";

const signSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{48}$/),
  name: z.string().trim().min(3, "Indiquez votre nom complet.").max(120),
  consent: z.literal(true, "Cochez la mention « Bon pour accord »."),
  signature: z
    .string()
    .startsWith("data:image/png;base64,", "Signature manquante.")
    .max(600_000, "Signature trop lourde."),
});

export type SignResult = { ok: true } | { ok: false; error: string };

export async function signQuote(input: z.input<typeof signSchema>): Promise<SignResult> {
  const parsed = signSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Signature invalide." };
  const { token, name, signature } = parsed.data;

  const quote = await getQuoteByToken(token);
  if (!quote || quote.status !== "envoye" || !quote.pdf_path || !quote.number) {
    return { ok: false, error: "Ce devis n'est plus disponible à la signature." };
  }
  if (quote.valid_until && quote.valid_until < parisDate()) {
    return { ok: false, error: "La durée de validité de ce devis est dépassée : contactez-nous pour une mise à jour." };
  }

  const db = createAdminClient();
  // Le devis signé doit être exactement celui qui a été envoyé
  const { data: sentPdf } = await db.storage.from("documents").download(quote.pdf_path);
  const sentHash = sentPdf ? createHash("sha256").update(Buffer.from(await sentPdf.arrayBuffer())).digest("hex") : null;
  if (!sentHash || sentHash !== quote.pdf_sha256) {
    return { ok: false, error: "Le document a été modifié depuis son envoi : signature impossible. Contactez-nous." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "inconnue";
  const userAgent = (h.get("user-agent") ?? "inconnu").slice(0, 300);
  const signedAt = new Date().toISOString();

  try {
    const signaturePath = `devis/${quote.number}-signature.png`;
    const png = Buffer.from(signature.split(",")[1], "base64");
    const { error: sigError } = await db.storage.from("documents").upload(signaturePath, png, { contentType: "image/png", upsert: true });
    if (sigError) throw sigError;

    const signedPdf = await renderQuotePdf(quote, { name, imageDataUrl: signature, signedAt, ip, userAgent, sentPdfSha256: sentHash });
    const signedPath = `devis/${quote.number}-signe.pdf`;
    const { error: pdfError } = await db.storage.from("documents").upload(signedPath, signedPdf, { contentType: "application/pdf", upsert: true });
    if (pdfError) throw pdfError;

    const { data: updated, error } = await db
      .from("quotes")
      .update({
        status: "signe",
        signed_at: signedAt,
        signer_name: name,
        signature_path: signaturePath,
        signed_pdf_path: signedPath,
        signature_meta: {
          ip,
          user_agent: userAgent,
          signed_at: signedAt,
          consent: CONSENT,
          sent_pdf_sha256: sentHash,
          signed_pdf_sha256: createHash("sha256").update(signedPdf).digest("hex"),
        },
      })
      .eq("id", quote.id)
      .eq("status", "envoye") // évite une double signature simultanée
      .select("id");
    if (error) throw error;
    if (!updated?.length) return { ok: false, error: "Ce devis vient déjà d'être signé." };

    if (quote.lead_id) await db.from("leads").update({ status: "gagne" }).eq("id", quote.lead_id);
    return { ok: true };
  } catch (error) {
    console.error("signQuote", error);
    return { ok: false, error: "La signature n'a pas pu être enregistrée. Réessayez dans un instant." };
  }
}
