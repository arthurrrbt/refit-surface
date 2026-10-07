import { requireUser } from "@/lib/auth";
import { getQuote } from "@/lib/quotes/data";
import { renderQuotePdf } from "@/lib/quotes/pdf";
import { createClient } from "@/lib/supabase/server";

/** PDF du devis : version signée, sinon version envoyée (figée), sinon aperçu du brouillon. */
export async function GET(_request: Request, { params }: RouteContext<"/app/devis/[id]/pdf">) {
  await requireUser();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) return new Response("Devis introuvable", { status: 404 });

  const stored = quote.signed_pdf_path ?? (quote.status !== "brouillon" ? quote.pdf_path : null);
  let body: Buffer;
  if (stored) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from("documents").download(stored);
    if (error || !data) return new Response("PDF introuvable", { status: 404 });
    body = Buffer.from(await data.arrayBuffer());
  } else {
    body = await renderQuotePdf(quote);
  }

  const name = `${quote.signed_pdf_path ? "devis-signe" : "devis"}-${quote.number ?? "brouillon"}.pdf`;
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
