"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { InvoiceLineRow } from "@/lib/invoices/data";
import { invoiceTotals, lineTotal, type InvoiceLineInput } from "@/lib/invoices/totals";
import { euro } from "@/lib/quotes/pricing";
import { PendingButton } from "../agents/ui";
import { addPayment, createCreditNote, createInvoiceFromQuote, emitInvoice, saveInvoiceDraft, type InvoiceActionState } from "./actions";

const field = "block w-full rounded-sm border border-ink/15 bg-paper px-2.5 py-2 text-sm focus:border-accent focus:outline-none";
const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

type EditableLine = InvoiceLineInput & { key: string };
let counter = 0;

/** Éditeur d'une facture brouillon. */
export function InvoiceEditor({
  id,
  initialTitle,
  initialServiceDate,
  initialNotes,
  initialLines,
  vatRate,
  needsServiceDate,
}: {
  id: string;
  initialTitle: string;
  initialServiceDate: string;
  initialNotes: string;
  initialLines: InvoiceLineRow[];
  vatRate: number;
  needsServiceDate: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [serviceDate, setServiceDate] = useState(initialServiceDate);
  const [notes, setNotes] = useState(initialNotes);
  const [lines, setLines] = useState<EditableLine[]>(() =>
    initialLines.map((l) => ({ key: l.id, kind: l.kind, description: l.description, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price_ht })),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const totals = invoiceTotals(lines, vatRate);

  function update(key: string, patch: Partial<EditableLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    const result = await saveInvoiceDraft({
      id,
      title,
      service_date: serviceDate,
      notes,
      lines: lines.map((l) => ({ kind: l.kind, description: l.description, quantity: l.quantity, unit: l.unit, unit_price: l.unit_price })),
    });
    setSaving(false);
    setMessage(result.ok ? { ok: true, text: "Facture enregistrée." } : { ok: false, text: result.error ?? "Erreur." });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-sm bg-paper p-4 shadow-sm sm:grid-cols-3">
        <label className="text-xs font-semibold sm:col-span-2">
          Objet
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${field} mt-1`} />
        </label>
        <label className="text-xs font-semibold">
          Date de réalisation des travaux{needsServiceDate && <span className="text-accent-strong"> *</span>}
          <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className={`${field} mt-1`} />
        </label>
      </div>

      <ul className="space-y-2">
        {lines.map((l) => (
          <li key={l.key} className={`rounded-sm p-3 shadow-sm ${l.kind === "deduction" ? "bg-amber-50" : "bg-paper"}`}>
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-12">
                <input aria-label="Désignation" value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} className={`${field} sm:col-span-6`} />
                <input aria-label="Quantité" inputMode="decimal" value={l.quantity} onChange={(e) => update(l.key, { quantity: num(e.target.value) })} className={`${field} sm:col-span-2`} />
                <input aria-label="Unité" value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} className={`${field} sm:col-span-1`} />
                <input aria-label="Prix unitaire HT" inputMode="decimal" value={l.unit_price} onChange={(e) => update(l.key, { unit_price: num(e.target.value) })} className={`${field} sm:col-span-3`} />
              </div>
              <button type="button" onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))} aria-label="Supprimer la ligne" className="p-2 text-ink/60 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-right text-xs text-ink/60">
              {l.kind === "deduction" && "Déduction d'acompte · "}
              <strong className="text-ink">{euro.format(lineTotal(l))} HT</strong>
            </p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setLines((prev) => [...prev, { key: `n${++counter}`, kind: "libre", description: "", quantity: 1, unit: "u", unit_price: 0 }])}
        className="inline-flex items-center gap-1.5 rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm hover:border-ink/40"
      >
        <Plus className="size-4" /> Ajouter une ligne (travaux supplémentaires…)
      </button>

      <label className="block rounded-sm bg-paper p-4 text-xs font-semibold shadow-sm">
        Remarques imprimées sur la facture
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${field} mt-1`} />
      </label>

      <div className="rounded-sm bg-paper p-4 text-sm shadow-sm">
        <p className="flex justify-between py-0.5">
          <span>Total HT</span> <span>{euro.format(totals.total_ht)}</span>
        </p>
        <p className="flex justify-between py-0.5">
          <span>TVA {vatRate} %</span> <span>{euro.format(totals.vat)}</span>
        </p>
        <p className="flex justify-between py-0.5 font-semibold">
          <span>Total TTC</span> <span>{euro.format(totals.total_ttc)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-sm bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-60">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Enregistrer le brouillon
        </button>
        {message && <p className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.text}</p>}
      </div>
    </div>
  );
}

/** Émission (avec confirmation) : numéro définitif, facture figée. */
export function EmitInvoiceForm({ id, creditNote = false }: { id: string; creditNote?: boolean }) {
  const [state, action] = useActionState<InvoiceActionState, FormData>(emitInvoice, {});
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const what = creditNote ? "cet avoir" : "cette facture";
        if (!window.confirm(`Émettre ${what} ? Le document recevra son numéro définitif et ne pourra plus être modifié.`)) e.preventDefault();
      }}
      className="space-y-2 rounded-sm border border-accent/30 bg-paper p-4 shadow-sm"
    >
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-ink/70">Enregistrez d&apos;abord vos modifications. Une facture émise ne se modifie plus : une erreur se corrige par un avoir.</p>
      <PendingButton variant="primary" pendingLabel="Émission…">
        {creditNote ? "Émettre l'avoir" : "Émettre la facture"}
      </PendingButton>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

/** Saisie d'un encaissement. */
export function PaymentForm({ invoiceId, remaining, today, refund = false }: { invoiceId: string; remaining: number; today: string; refund?: boolean }) {
  const [state, action] = useActionState<InvoiceActionState, FormData>(addPayment, {});
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-5">
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <label className="text-xs font-semibold">
        Date
        <input type="date" name="paid_on" defaultValue={today} required className={`${field} mt-1`} />
      </label>
      <label className="text-xs font-semibold">
        {refund ? "Montant remboursé TTC" : "Montant TTC"}
        <input name="amount" inputMode="decimal" defaultValue={remaining > 0 ? remaining.toFixed(2) : ""} required className={`${field} mt-1`} />
      </label>
      <label className="text-xs font-semibold">
        Moyen
        <select name="method" defaultValue="virement" className={`${field} mt-1`}>
          <option value="virement">Virement</option>
          <option value="cheque">Chèque</option>
          <option value="carte">Carte</option>
          <option value="especes">Espèces</option>
          <option value="autre">Autre</option>
        </select>
      </label>
      <label className="text-xs font-semibold">
        Référence
        <input name="reference" placeholder="N° chèque…" className={`${field} mt-1`} />
      </label>
      <div className="flex items-end">
        <PendingButton variant="primary" pendingLabel="…">
          Enregistrer
        </PendingButton>
      </div>
      {state.error && <p className="text-sm text-red-600 sm:col-span-5">{state.error}</p>}
    </form>
  );
}

/** Boutons de facturation d'un devis signé. */
export function CreateInvoiceButtons({ quoteId, depositPercent, options }: { quoteId: string; depositPercent: number; options: ("acompte" | "solde" | "globale")[] }) {
  const [state, action] = useActionState<InvoiceActionState, FormData>(createInvoiceFromQuote, {});
  const labels = { acompte: `Facture d'acompte (${depositPercent} %)`, solde: "Facture de solde", globale: "Facture globale (sans acompte)" };
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="quote_id" value={quoteId} />
      <div className="flex flex-wrap gap-2">
        {options.map((kind) => (
          <PendingButton key={kind} name="kind" value={kind} variant={kind === "globale" ? "secondary" : "primary"} pendingLabel="Création…">
            {labels[kind]}
          </PendingButton>
        ))}
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

/** Avoir sur une facture émise : total (annule la facture) ou partiel (montant HT + motif). */
export function CreditNoteForm({ invoiceId, creditableHt, allowTotal }: { invoiceId: string; creditableHt: number; allowTotal: boolean }) {
  const [state, action] = useActionState<InvoiceActionState, FormData>(createCreditNote, {});
  const [mode, setMode] = useState<"total" | "partiel">(allowTotal ? "total" : "partiel");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <div className="flex flex-wrap gap-4 text-sm">
        {allowTotal && (
          <label className="flex items-center gap-2">
            <input type="radio" name="mode" value="total" checked={mode === "total"} onChange={() => setMode("total")} className="accent-accent" />
            Avoir total (annule la facture)
          </label>
        )}
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" value="partiel" checked={mode === "partiel"} onChange={() => setMode("partiel")} className="accent-accent" />
          Avoir partiel
        </label>
      </div>
      {mode === "partiel" && (
        <label className="block text-xs font-semibold">
          Montant HT à créditer (au plus {euro.format(creditableHt)})
          <input name="amount_ht" inputMode="decimal" required className={`${field} mt-1 max-w-48`} />
        </label>
      )}
      <label className="block text-xs font-semibold">
        Motif (imprimé sur l&apos;avoir)
        <input name="motif" required minLength={3} placeholder="Erreur de quantité, geste commercial, prestation annulée…" className={`${field} mt-1`} />
      </label>
      <PendingButton pendingLabel="Préparation…">Préparer l&apos;avoir</PendingButton>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
