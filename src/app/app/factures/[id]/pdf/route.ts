import { requireUser } from "@/lib/auth";
import { getInvoice } from "@/lib/invoices/data";
import { renderInvoicePdf } from "@/lib/invoices/pdf";
import { createClient } from "@/lib/supabase/server";

/** PDF de la facture : version archivée à l'émission, sinon rendu à la volée (brouillon). */
export async function GET(_request: Request, { params }: RouteContext<"/app/factures/[id]/pdf">) {
  await requireUser();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) return new Response("Facture introuvable", { status: 404 });

  let body: Buffer | null = null;
  if (invoice.pdf_path && invoice.status !== "brouillon") {
    const { data } = await (await createClient()).storage.from("documents").download(invoice.pdf_path);
    if (data) body = Buffer.from(await data.arrayBuffer());
  }
  body ??= await renderInvoicePdf(invoice);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${invoice.number ?? "brouillon"}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
