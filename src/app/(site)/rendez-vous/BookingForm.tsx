"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";
import { CalendarCheck, CalendarPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { univers as universList } from "@/content/univers";
import type { Slot, SlotDay } from "@/lib/booking/config";
import { buildIcs } from "@/lib/booking/ics";
import { bookAppointment, type BookingResult } from "./actions";

const input =
  "mt-1.5 block w-full rounded-sm border border-line bg-ink px-3 py-2.5 text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none";

const dateTimeFr = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function BookingForm({ days }: { days: SlotDay[] }) {
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<Extract<BookingResult, { ok: true }>["event"] | null>(null);

  if (!days.length) {
    return (
      <p className="rounded-sm border border-dashed border-line bg-ink-2 p-8 text-paper/60">
        Aucun créneau disponible pour le moment. Appelez-nous ou faites une demande de devis : nous vous recontactons.
      </p>
    );
  }

  if (booked) {
    return (
      <div className="rounded-sm border border-accent/40 bg-ink-2 p-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-ink">
          <Check className="size-6" />
        </span>
        <h2 className="mt-6 font-display text-2xl font-semibold">Rendez-vous confirmé</h2>
        <p className="mt-3 text-paper/80">{capitalize(dateTimeFr.format(new Date(booked.start)))}</p>
        <p className="mt-1 text-sm text-paper/60">{booked.location}</p>
        <p className="mt-4 text-sm text-paper/60">
          Nous vous appellerons la veille pour confirmer. Pensez à préparer l&apos;accès aux surfaces à rénover.
        </p>
        <button
          type="button"
          onClick={() => downloadIcs(booked)}
          className="mt-8 inline-flex items-center gap-2 rounded-sm border border-paper/30 px-5 py-3 font-display text-xs font-semibold uppercase tracking-[0.18em] hover:border-accent hover:text-accent"
        >
          <CalendarPlus className="size-4" /> Ajouter à mon agenda
        </button>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    if (!slot) return setError("Choisissez un créneau.");
    setSending(true);
    setError(null);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const universValue = text("univers");
    const result = await bookAppointment({
      start: slot.start,
      univers: universValue ? (universValue as "home") : undefined,
      kind: text("kind") === "professionnel" ? "professionnel" : "particulier",
      company: text("company"),
      firstName: text("firstName"),
      lastName: text("lastName"),
      email: text("email"),
      phone: text("phone"),
      address: text("address"),
      postalCode: text("postalCode"),
      city: text("city"),
      message: text("message"),
      privacyConsent: (formData.get("privacyConsent") === "on") as true,
      marketingConsent: formData.get("marketingConsent") === "on",
      website: text("website"),
    });
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBooked(result.event);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const day = days[dayIndex];

  return (
    <form action={handleSubmit} className="space-y-10">
      <fieldset className="min-w-0">
        <legend className="font-display text-lg font-semibold">1. Choisissez un jour</legend>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {days.map((d, i) => (
            <button
              key={d.date}
              type="button"
              aria-pressed={i === dayIndex}
              onClick={() => {
                setDayIndex(i);
                setSlot(null);
              }}
              className={`shrink-0 rounded-sm border px-4 py-3 text-left text-sm transition-colors first-letter:uppercase ${
                i === dayIndex ? "border-accent bg-accent/10" : "border-line hover:border-paper/40"
              }`}
            >
              {d.label}
              <span className="block text-xs text-paper/50">{d.slots.length} créneau{d.slots.length > 1 ? "x" : ""}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="font-display text-lg font-semibold">2. Choisissez une heure</legend>
        <p className="mt-1 text-sm text-paper/50">Visite et métrage d&apos;environ une heure, chez vous ou sur site.</p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {day.slots.map((s) => (
            <button
              key={s.start}
              type="button"
              aria-pressed={slot?.start === s.start}
              onClick={() => setSlot(s)}
              className={`rounded-sm border py-3 text-sm font-semibold transition-colors ${
                slot?.start === s.start ? "border-accent bg-accent text-ink" : "border-line hover:border-paper/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset hidden={!slot} className="min-w-0 space-y-4">
        <legend className="font-display text-lg font-semibold">3. Vos coordonnées</legend>
        {slot && (
          <p className="flex items-center gap-2 rounded-sm bg-ink-2 p-3 text-sm">
            <CalendarCheck className="size-4 text-accent" /> {capitalize(dateTimeFr.format(new Date(slot.start)))}
          </p>
        )}
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" value="particulier" defaultChecked className="accent-accent" /> Particulier
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="kind" value="professionnel" className="accent-accent" /> Professionnel
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" name="firstName" required autoComplete="given-name" />
          <Field label="Nom" name="lastName" required autoComplete="family-name" />
          <Field label="Société / établissement (pros)" name="company" autoComplete="organization" className="sm:col-span-2" />
          <Field label="E-mail" name="email" type="email" required autoComplete="email" />
          <Field label="Téléphone" name="phone" type="tel" required autoComplete="tel" />
          <Field label="Adresse du rendez-vous" name="address" required autoComplete="street-address" className="sm:col-span-2" />
          <Field label="Code postal" name="postalCode" autoComplete="postal-code" inputMode="numeric" />
          <Field label="Ville" name="city" required autoComplete="address-level2" />
          <label className="block text-sm text-paper/80 sm:col-span-2">
            Votre projet concerne
            <select name="univers" defaultValue="" className={input}>
              <option value="">Je ne sais pas encore</option>
              {universList.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.name} — {u.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-paper/80 sm:col-span-2">
            Précisions (facultatif)
            <textarea name="message" rows={3} maxLength={2000} className={input} placeholder="Surfaces à voir, accès, code portail…" />
          </label>
        </div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <label className="flex items-start gap-3 text-sm text-paper/80">
          <input type="checkbox" name="privacyConsent" required className="mt-1 accent-accent" />
          <span>
            J&apos;accepte que mes informations soient utilisées pour organiser ce rendez-vous.{" "}
            <Link href="/mentions-legales" className="underline hover:text-accent">
              En savoir plus
            </Link>
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-paper/60">
          <input type="checkbox" name="marketingConsent" className="mt-1 accent-accent" />
          <span>Je souhaite recevoir occasionnellement des conseils et réalisations REFIT Surface.</span>
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="rounded-sm border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {slot && (
        <Button type="submit" disabled={sending}>
          {sending && <Loader2 className="size-4 animate-spin" />}
          {sending ? "Réservation…" : "Confirmer le rendez-vous"}
        </Button>
      )}
    </form>
  );
}

function Field({ label, className = "", ...props }: { label: string; className?: string } & ComponentProps<"input">) {
  return (
    <label className={`block text-sm text-paper/80 ${className}`}>
      {label}
      {props.required && <span className="text-accent"> *</span>}
      <input {...props} className={input} />
    </label>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function downloadIcs(event: { id: string; start: string; end: string; location: string }) {
  const ics = buildIcs(
    [
      {
        uid: `${event.id}@refitsurface.fr`,
        start: event.start,
        end: event.end,
        summary: "Visite & métrage REFIT Surface",
        location: event.location,
        description: "Rendez-vous avec REFIT Surface pour la visite et le métrage de vos surfaces.",
      },
    ],
    "REFIT Surface",
  );
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "rendez-vous-refit-surface.ics";
  a.click();
  URL.revokeObjectURL(url);
}
