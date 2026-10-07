import { INVOICE_SELECT, type InvoiceRow } from "@/lib/invoices/data";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
import { createAdminClient } from "@/lib/supabase/admin";

/** Lien personnel envoyé au client : téléchargement de sa facture émise. */
export async function GET(_request: Request, { params }: RouteContext<"/facture/[token]">) {
  const { token } = await params;
  if (!/^[0-9a-f]{48}$/.test(token)) return new Response("Lien invalide", { status: 404 });

  const db = createAdminClient();
  const { data } = await db
    .from("invoices")
    .select(INVOICE_SELECT)
    .eq("share_token", token)
    .neq("status", "brouillon")
    .order("position", { referencedTable: "invoice_lines" })
    .maybeSingle();
  const invoice = data as InvoiceRow | null;
  if (!invoice) return new Response("Facture introuvable", { status: 404 });
  if (invoice.kind === "avoir" && invoice.credited_invoice_id) {
    // Mention obligatoire : référence de la facture corrigée
    const { data: original } = await db.from("invoices").select("id, number, issued_at").eq("id", invoice.credited_invoice_id).maybeSingle();
    invoice.original = original as InvoiceRow["original"];
  }

  let body: Buffer | null = null;
  if (invoice.pdf_path) {
    const { data: file } = await db.storage.from("documents").download(invoice.pdf_path);
    if (file) body = Buffer.from(await file.arrayBuffer());
  }
  body ??= await renderInvoicePdf(invoice);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-refit-surface-${invoice.number}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
