"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { company } from "@/content/company";
import { parisDate } from "@/lib/booking/time";
import { createJobFromQuote } from "@/lib/jobs/create";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import { getQuoteByToken } from "@/lib/quotes/public";
import { isRateLimited, TOO_MANY } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const CONSENT = "J'ai lu le devis et je l'accepte — Bon pour accord.";

const signSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{48}$/),
  name: z.string().trim().min(3, "Indiquez votre nom complet.").max(120),
  consent: z.literal(true, "Cochez la mention « Bon pour accord »."),
  cgv: z.literal(true, "Acceptez les conditions générales de prestation."),
  earlyStart: z.boolean(),
  signature: z
    .string()
    .startsWith("data:image/png;base64,", "Signature manquante.")
    .max(600_000, "Signature trop lourde."),
});

export type SignResult = { ok: true } | { ok: false; error: string };

export async function signQuote(input: z.input<typeof signSchema>): Promise<SignResult> {
  const parsed = signSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Signature invalide." };
  const { token, name, signature, earlyStart } = parsed.data;
  if (await isRateLimited("signature")) return { ok: false, error: TOO_MANY };

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

  const png = Buffer.from(signature.split(",")[1], "base64");
  // Le tracé doit être une vraie image PNG (signature des 8 premiers octets)
  if (!png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ok: false, error: "Signature illisible : recommencez le tracé." };
  }

  try {
    // Fichiers propres à cette tentative, jamais écrasés : deux signatures simultanées ne peuvent pas
    // remplacer la preuve enregistrée par l'autre (seule la mise à jour conditionnelle ci-dessous l'emporte).
    const attempt = randomBytes(6).toString("hex");
    const signaturePath = `devis/${quote.number}-signature-${attempt}.png`;
    const { error: sigError } = await db.storage.from("documents").upload(signaturePath, png, { contentType: "image/png", upsert: false });
    if (sigError) throw sigError;

    const signedPdf = await renderQuotePdf(quote, { name, imageDataUrl: signature, signedAt, ip, userAgent, sentPdfSha256: sentHash, earlyStart });
    const signedPath = `devis/${quote.number}-signe-${attempt}.pdf`;
    const { error: pdfError } = await db.storage.from("documents").upload(signedPath, signedPdf, { contentType: "application/pdf", upsert: false });
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
          cgv_accepted: true,
          cgv_url: `https://${company.website}/cgv`,
          early_start_requested: earlyStart,
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
    // Le chantier et sa liste de matière sont préparés dès la signature
    await createJobFromQuote(db, quote.id).catch((e) => console.error("createJobFromQuote", e));
    return { ok: true };
  } catch (error) {
    console.error("signQuote", error);
    return { ok: false, error: "La signature n'a pas pu être enregistrée. Réessayez dans un instant." };
  }
}
