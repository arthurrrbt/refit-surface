"use client";

import { useActionState, type ComponentProps } from "react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { PendingButton } from "../agents/ui";
import { updateContact, type ContactFormState } from "./actions";

const field = "mt-1 block w-full rounded-sm border border-ink/15 bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";

type Contact = {
  id: string;
  kind: string;
  company: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  siret: string | null;
};

export function ContactForm({ contact }: { contact: Contact }) {
  const [state, action] = useActionState<ContactFormState, FormData>(updateContact, {});
  const input = (name: keyof Contact, label: string, extra: ComponentProps<"input"> = {}, span = "") => (
    <label className={`text-xs font-semibold ${span}`}>
      {label}
      <input name={name} defaultValue={(contact[name] as string | null) ?? ""} className={field} {...extra} />
    </label>
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="id" value={contact.id} />
      <label className="text-xs font-semibold sm:col-span-2">
        Type
        <select name="kind" defaultValue={contact.kind} className={field}>
          <option value="particulier">Particulier</option>
          <option value="professionnel">Professionnel</option>
        </select>
      </label>
      {input("company", "Société / établissement", {}, "sm:col-span-4")}
      {input("first_name", "Prénom", { autoComplete: "off" }, "sm:col-span-3")}
      {input("last_name", "Nom", { autoComplete: "off" }, "sm:col-span-3")}
      {input("email", "E-mail", { type: "email" }, "sm:col-span-3")}
      {input("phone", "Téléphone", { type: "tel" }, "sm:col-span-3")}
      <label className="text-xs font-semibold sm:col-span-6">
        Adresse
        <AddressAutocomplete name="address" defaultValue={contact.address ?? ""} fill={{ postcode: "postal_code", city: "city" }} tone="light" className={field} />
      </label>
      {input("postal_code", "Code postal", { inputMode: "numeric" }, "sm:col-span-2")}
      {input("city", "Ville", {}, "sm:col-span-4")}
      {input("siret", "SIRET (professionnels)", { inputMode: "numeric", placeholder: "14 chiffres" }, "sm:col-span-3")}
      <div className="flex items-center gap-3 sm:col-span-6">
        <PendingButton variant="primary" pendingLabel="Enregistrement…">
          Enregistrer les coordonnées
        </PendingButton>
        {state.ok && <p className="text-sm text-emerald-700">Enregistré.</p>}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
