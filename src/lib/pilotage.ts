import "server-only";
import { requireUser } from "@/lib/auth";
import { addDays, parisDate } from "@/lib/booking/time";
import { createClient } from "@/lib/supabase/server";

const round2 = (n: number) => Math.round(n * 100) / 100;
const monthKey = (iso: string) => iso.slice(0, 7); // AAAA-MM

export type MonthPoint = { month: string; label: string; invoicedHt: number; collectedTtc: number };

/**
 * Indicateurs de pilotage calculés à partir des documents réels :
 * factures et avoirs émis (CA), encaissements, devis (transformation, marge), planning (jours de pose).
 */
export async function getPilotage() {
  await requireUser();
  const supabase = await createClient();
  const today = parisDate();
  const year = today.slice(0, 4);
  const month = monthKey(today);
  const since = `${Number(year) - 1}-${today.slice(5, 7)}-01`; // 12 derniers mois

  const [invoicesRes, paymentsRes, quotesRes, posesRes, leadsRes] = await Promise.all([
    supabase.from("invoices").select("id, kind, status, issued_at, due_at, total_ht, total_ttc, amount_paid, amount_imputed, credited_invoice_id").neq("status", "brouillon"),
    supabase.from("invoice_payments").select("paid_on, amount, invoices(kind)").gte("paid_on", since),
    supabase
      .from("quotes")
      .select("id, status, univers, issued_at, signed_at, total_ht, total_cost_ht, labour_days, quote_lines(kind, total_ht)")
      .neq("status", "brouillon"),
    supabase.from("events").select("starts_at").eq("kind", "pose").gte("starts_at", `${year}-01-01`),
    supabase.from("leads").select("id, status, source, created_at").gte("created_at", `${year}-01-01`),
  ]);

  const invoices = (invoicesRes.data ?? []) as {
    id: string;
    kind: string;
    status: string;
    issued_at: string | null;
    due_at: string | null;
    total_ht: number;
    total_ttc: number;
    amount_paid: number;
    amount_imputed: number;
    credited_invoice_id: string | null;
  }[];
  const payments = (paymentsRes.data ?? []) as unknown as { paid_on: string; amount: number; invoices: { kind: string } | null }[];
  const quotes = (quotesRes.data ?? []) as unknown as {
    id: string;
    status: string;
    univers: string | null;
    issued_at: string | null;
    signed_at: string | null;
    total_ht: number;
    total_cost_ht: number;
    labour_days: number | null;
    quote_lines: { kind: string; total_ht: number }[];
  }[];

  // ─── Chiffre d'affaires facturé (factures − avoirs) et encaissé, par mois ──
  const months: MonthPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(Number(year), Number(today.slice(5, 7)) - 1 - i, 1));
    const key = d.toISOString().slice(0, 7);
    months.push({
      month: key,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(d).replace(".", ""),
      invoicedHt: 0,
      collectedTtc: 0,
    });
  }
  const byMonth = new Map(months.map((m) => [m.month, m]));
  for (const inv of invoices) {
    const m = inv.issued_at && byMonth.get(monthKey(inv.issued_at));
    if (m) m.invoicedHt += Number(inv.total_ht); // les avoirs sont négatifs
  }
  for (const p of payments) {
    const m = byMonth.get(monthKey(p.paid_on));
    if (m) m.collectedTtc += (p.invoices?.kind === "avoir" ? -1 : 1) * Number(p.amount); // remboursement d'avoir
  }
  months.forEach((m) => {
    m.invoicedHt = round2(m.invoicedHt);
    m.collectedTtc = round2(m.collectedTtc);
  });

  const sumInvoiced = (prefix: string) => round2(invoices.filter((i) => i.issued_at?.startsWith(prefix)).reduce((s, i) => s + Number(i.total_ht), 0));
  const sumCollected = (prefix: string) =>
    round2(payments.filter((p) => p.paid_on.startsWith(prefix)).reduce((s, p) => s + (p.invoices?.kind === "avoir" ? -1 : 1) * Number(p.amount), 0));

  // ─── Reste à encaisser et retards (avoirs imputés déduits) ──────────────
  const imputed = new Map<string, number>();
  for (const i of invoices) if (i.kind === "avoir" && i.credited_invoice_id) imputed.set(i.credited_invoice_id, (imputed.get(i.credited_invoice_id) ?? 0) + Number(i.amount_imputed));
  let toCollect = 0;
  let overdue = 0;
  for (const i of invoices) {
    if (i.kind === "avoir" || (i.status !== "emise" && i.status !== "transmise")) continue;
    const remaining = Math.max(Number(i.total_ttc) - Number(i.amount_paid) - (imputed.get(i.id) ?? 0), 0);
    toCollect += remaining;
    if (remaining > 0 && i.due_at && i.due_at < today) overdue += remaining;
  }

  // ─── Devis : transformation, marge matière, € par jour de pose ─────────
  const yearQuotes = quotes.filter((q) => q.issued_at?.startsWith(year));
  const decided = yearQuotes.filter((q) => q.status === "signe" || q.status === "refuse" || q.status === "expire");
  const signedYear = quotes.filter((q) => q.status === "signe" && q.signed_at?.startsWith(year));
  const signedMonth = signedYear.filter((q) => q.signed_at?.startsWith(month));
  const pending = quotes.filter((q) => q.status === "envoye");

  const materialSale = signedYear.reduce((s, q) => s + q.quote_lines.filter((l) => l.kind === "matiere").reduce((a, l) => a + Number(l.total_ht), 0), 0);
  const materialCost = signedYear.reduce((s, q) => s + Number(q.total_cost_ht), 0);
  const travel = signedYear.reduce((s, q) => s + q.quote_lines.filter((l) => l.kind === "deplacement").reduce((a, l) => a + Number(l.total_ht), 0), 0);
  const signedHt = signedYear.reduce((s, q) => s + Number(q.total_ht), 0);
  const labourDays = signedYear.reduce((s, q) => s + Number(q.labour_days ?? 0), 0);

  const universTotals = new Map<string, number>();
  for (const q of signedYear) universTotals.set(q.univers ?? "autre", (universTotals.get(q.univers ?? "autre") ?? 0) + Number(q.total_ht));

  // ─── Jours de pose au planning ──────────────────────────────────────────
  const poseDays = new Set((posesRes.data ?? []).map((e) => parisDate(new Date(e.starts_at as string))));
  const nextMonthLimit = addDays(today, 30);
  const leads = leadsRes.data ?? [];

  return {
    year,
    months,
    kpis: {
      invoicedMonth: sumInvoiced(month),
      invoicedYear: sumInvoiced(year),
      collectedMonth: sumCollected(month),
      collectedYear: sumCollected(year),
      toCollect: round2(toCollect),
      overdue: round2(overdue),
      signedCountYear: signedYear.length,
      signedCountMonth: signedMonth.length,
      signedHtYear: round2(signedHt),
      conversionRate: decided.length ? decided.filter((q) => q.status === "signe").length / decided.length : null,
      decidedCount: decided.length,
      pendingCount: pending.length,
      pendingHt: round2(pending.reduce((s, q) => s + Number(q.total_ht), 0)),
      materialMarginRate: materialSale > 0 ? (materialSale - materialCost) / materialSale : null,
      earnedPerDay: labourDays > 0 ? round2((signedHt - materialCost - travel) / labourDays) : null,
      labourDaysSold: round2(labourDays),
      poseDaysYear: [...poseDays].filter((d) => d <= today).length,
      poseDaysNext30: [...poseDays].filter((d) => d > today && d <= nextMonthLimit).length,
    },
    funnel: {
      leads: leads.length,
      rdv: leads.filter((l) => ["rdv", "devis_envoye", "gagne"].includes(l.status as string)).length,
      quotes: yearQuotes.length,
      signed: signedYear.length,
    },
    univers: [...universTotals.entries()].map(([key, value]) => ({ key, value: round2(value) })).sort((a, b) => b.value - a.value),
  };
}
