import { getQuoteByToken } from "@/lib/quotes/public";
import { createAdminClient } from "@/lib/supabase/admin";

/** PDF du devis pour le client : version signée si elle existe, sinon la version envoyée. */
export async function GET(_request: Request, { params }: RouteContext<"/signature/[token]/pdf">) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);
  const path = quote?.signed_pdf_path ?? quote?.pdf_path;
  if (!quote || !path) return new Response("Document introuvable", { status: 404 });

  const { data, error } = await createAdminClient().storage.from("documents").download(path);
  if (error || !data) return new Response("Document introuvable", { status: 404 });

  return new Response(new Uint8Array(await data.arrayBuffer()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="devis-${quote.number}${quote.signed_pdf_path ? "-signe" : ""}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
