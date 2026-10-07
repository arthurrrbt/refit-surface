import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { univers as universList } from "@/content/univers";
import { getPilotage, type MonthPoint } from "@/lib/pilotage";
import { euro } from "@/lib/quotes/pricing";
import Loading from "../loading";
import { PageHeader } from "../ModulePlaceholder";

export const metadata: Metadata = { title: "Pilotage" };

const euro0 = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 0 });

export default function PilotagePage() {
  return (
    <>
      <PageHeader title="Pilotage">Vos chiffres calculés à partir des factures, devis, encaissements et du planning.</PageHeader>
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const { year, months, kpis, funnel, univers } = await getPilotage();

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <Group title="Chiffre d'affaires">
        <Tile label="Facturé ce mois (HT)" value={euro0.format(kpis.invoicedMonth)} />
        <Tile label={`Facturé ${year} (HT)`} value={euro0.format(kpis.invoicedYear)} />
        <Tile label="Encaissé ce mois (TTC)" value={euro0.format(kpis.collectedMonth)} />
        <Tile label={`Encaissé ${year} (TTC)`} value={euro0.format(kpis.collectedYear)} />
      </Group>

      <section className="rounded-sm bg-paper p-5 shadow-sm">
        <h2 className="font-display font-semibold">Chiffre d&apos;affaires facturé HT — 12 derniers mois</h2>
        <p className="text-xs text-ink/60">Factures émises moins les avoirs, par mois d&apos;émission.</p>
        <BarChart data={months} />
      </section>

      <Group title="Trésorerie">
        <Tile label="Reste à encaisser (TTC)" value={euro0.format(kpis.toCollect)} href="/app/factures" />
        <Tile
          label="Dont en retard"
          value={euro0.format(kpis.overdue)}
          href="/app/factures"
          alert={kpis.overdue > 0 ? "Relancez les clients concernés" : undefined}
        />
      </Group>

      <Group title={`Commercial ${year}`}>
        <Tile label="Devis signés" value={`${kpis.signedCountYear}`} hint={`${kpis.signedCountMonth} ce mois · ${euro0.format(kpis.signedHtYear)} HT`} />
        <Tile
          label="Taux de transformation"
          value={kpis.conversionRate != null ? pct.format(kpis.conversionRate) : "—"}
          hint={`sur ${kpis.decidedCount} devis tranchés`}
        />
        <Tile label="Devis en attente" value={`${kpis.pendingCount}`} hint={`${euro0.format(kpis.pendingHt)} HT`} href="/app/devis" />
        <Tile label="Demandes reçues" value={`${funnel.leads}`} href="/app/prospects" />
      </Group>

      <Group title={`Rentabilité ${year} (devis signés)`}>
        <Tile label="Marge matière" value={kpis.materialMarginRate != null ? pct.format(kpis.materialMarginRate) : "—"} hint="vente − achat TEGO" />
        <Tile label="Gagné par jour de pose" value={kpis.earnedPerDay != null ? euro.format(kpis.earnedPerDay) : "—"} hint={`${kpis.labourDaysSold} jours vendus`} />
        <Tile label="Jours de pose réalisés" value={`${kpis.poseDaysYear}`} hint="d'après le planning" />
        <Tile label="Jours de pose à venir" value={`${kpis.poseDaysNext30}`} hint="dans les 30 jours" href="/app/planning" />
      </Group>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-sm bg-paper p-5 shadow-sm">
          <h2 className="font-display font-semibold">Entonnoir commercial {year}</h2>
          <Funnel
            steps={[
              { label: "Demandes", value: funnel.leads },
              { label: "Rendez-vous et au-delà", value: funnel.rdv },
              { label: "Devis émis", value: funnel.quotes },
              { label: "Devis signés", value: funnel.signed },
            ]}
          />
        </section>
        <section className="rounded-sm bg-paper p-5 shadow-sm">
          <h2 className="font-display font-semibold">Devis signés par univers ({year}, HT)</h2>
          <HBars
            items={univers.map((u) => ({
              label: universList.find((x) => x.slug === u.key)?.name ?? "Autre",
              value: u.value,
            }))}
          />
        </section>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-semibold">{title}</h2>
      <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Tile({ label, value, hint, href, alert }: { label: string; value: string; hint?: string; href?: string; alert?: string }) {
  const body = (
    <>
      <p className="text-xs text-ink/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink/60">{hint}</p>}
      {alert && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-700">
          <AlertTriangle className="size-3.5" /> {alert}
        </p>
      )}
    </>
  );
  const cls = "block rounded-sm bg-paper p-4 shadow-sm";
  return href ? (
    <Link href={href} className={`${cls} transition-shadow hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Histogramme mensuel (une seule série) : survol / focus clavier pour le détail, tableau en repli. */
function BarChart({ data }: { data: MonthPoint[] }) {
  const max = Math.max(...data.map((d) => d.invoicedHt), 0);
  const scale = max > 0 ? max : 1;
  return (
    <div className="mt-4">
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-ink/10" aria-hidden />
        <span className="absolute -top-2 right-0 bg-paper pl-1 text-[0.65rem] text-ink/60 tabular-nums">{euro0.format(max)}</span>
        <ul className="flex h-44 items-end gap-0.5 border-b border-ink/20" aria-label="Chiffre d'affaires facturé HT par mois">
          {data.map((d) => {
            const h = Math.max((Math.max(d.invoicedHt, 0) / scale) * 100, d.invoicedHt > 0 ? 2 : 0);
            return (
              <li key={d.month} className="group relative flex h-full flex-1 items-end justify-center" tabIndex={0} aria-label={`${d.label} : ${euro.format(d.invoicedHt)} HT`}>
                <div className="w-full max-w-10 rounded-t bg-accent-strong transition-opacity group-hover:opacity-80" style={{ height: `${h}%` }} />
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-xs text-paper shadow group-hover:block group-focus:block">
                  <strong className="capitalize">{d.label}</strong> · {euro.format(d.invoicedHt)} HT
                  <br />
                  encaissé {euro.format(d.collectedTtc)} TTC
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="mt-1 flex gap-0.5" aria-hidden>
        {data.map((d) => (
          <li key={d.month} className="flex-1 text-center text-[0.65rem] capitalize text-ink/60">
            {d.label}
          </li>
        ))}
      </ul>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-ink/60">Voir le tableau</summary>
        <table className="mt-2 w-full text-left text-xs tabular-nums">
          <thead className="text-ink/60">
            <tr>
              <th className="py-1 font-semibold">Mois</th>
              <th className="py-1 text-right font-semibold">Facturé HT</th>
              <th className="py-1 text-right font-semibold">Encaissé TTC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {data.map((d) => (
              <tr key={d.month}>
                <td className="py-1 capitalize">
                  {d.label} {d.month.slice(0, 4)}
                </td>
                <td className="py-1 text-right">{euro.format(d.invoicedHt)}</td>
                <td className="py-1 text-right">{euro.format(d.collectedTtc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="flex justify-between text-sm">
            <span>{s.label}</span>
            <span className="font-semibold tabular-nums">
              {s.value}
              {i > 0 && steps[i - 1].value > 0 && <span className="ml-2 text-xs font-normal text-ink/60">{pct.format(s.value / steps[i - 1].value)}</span>}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-ink/5">
            <div className="h-2 rounded-full bg-accent-strong" style={{ width: `${(s.value / top) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function HBars({ items }: { items: { label: string; value: number }[] }) {
  if (!items.length) return <p className="mt-4 text-sm text-ink/60">Aucun devis signé cette année.</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="mt-4 space-y-2">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex justify-between text-sm">
            <span>{it.label}</span>
            <span className="font-semibold tabular-nums">{euro0.format(it.value)}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-ink/5">
            <div className="h-2 rounded-full bg-accent-strong" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
