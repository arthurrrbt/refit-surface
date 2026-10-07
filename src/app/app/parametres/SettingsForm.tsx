"use client";

import { useActionState } from "react";
import type { PricingSettings } from "@/lib/quotes/pricing";
import { PendingButton } from "../agents/ui";
import { saveSettings, type SettingsState } from "./actions";

const field = "mt-1 block w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";

export function SettingsForm({ settings }: { settings: PricingSettings }) {
  const [state, action] = useActionState<SettingsState, FormData>(saveSettings, {});
  const pct = (v: number) => Math.round(v * 1000) / 10;

  const fields = [
    { name: "day_rate", label: "Taux journalier de pose (€ HT / jour)", value: settings.day_rate, step: "1" },
    { name: "material_margin", label: "Marge sur la matière (%)", value: pct(settings.material_margin), step: "0.5" },
    { name: "default_waste_rate", label: "Pertes matière par défaut (%)", value: pct(settings.default_waste_rate), step: "0.5" },
    { name: "travel_fee", label: "Déplacement par défaut (€ HT)", value: settings.travel_fee, step: "1" },
    { name: "vat_rate", label: "TVA (%)", value: settings.vat_rate, step: "0.1" },
    { name: "deposit_rate", label: "Acompte à la signature (%)", value: pct(settings.deposit_rate), step: "1" },
    { name: "quote_validity_days", label: "Validité des devis (jours)", value: settings.quote_validity_days, step: "1" },
  ];

  return (
    <form action={action} className="grid gap-4 rounded-sm bg-paper p-5 shadow-sm sm:grid-cols-2">
      {fields.map((f) => (
        <label key={f.name} className="text-sm font-semibold">
          {f.label}
          <input type="number" name={f.name} defaultValue={f.value} step={f.step} min={0} required inputMode="decimal" className={field} />
        </label>
      ))}
      <div className="flex items-center gap-3 sm:col-span-2">
        <PendingButton variant="primary" pendingLabel="Enregistrement…">
          Enregistrer
        </PendingButton>
        {state.ok && <p className="text-sm text-emerald-700">Paramètres enregistrés.</p>}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
