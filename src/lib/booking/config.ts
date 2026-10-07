// Disponibilités proposées sur le site — à ajuster selon votre organisation.
// Jours : 0 = dimanche, 1 = lundi … 6 = samedi. Heures de Paris.

export const booking = {
  slotMinutes: 60, // durée d'une visite / métrage
  minNoticeHours: 24, // délai minimum avant un rendez-vous
  horizonDays: 21, // jusqu'à combien de jours à l'avance
  weekly: {
    1: [["09:00", "12:00"], ["14:00", "18:00"]],
    2: [["09:00", "12:00"], ["14:00", "18:00"]],
    3: [["09:00", "12:00"], ["14:00", "18:00"]],
    4: [["09:00", "12:00"], ["14:00", "18:00"]],
    5: [["09:00", "12:00"], ["14:00", "17:00"]],
    6: [["09:00", "12:00"]],
  } as Record<number, [string, string][]>,
};

export const EVENT_KINDS = ["visite", "metrage", "pose", "autre"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const eventKindLabels: Record<EventKind, string> = {
  visite: "Visite",
  metrage: "Visite & métrage",
  pose: "Pose",
  autre: "Indisponible / autre",
};

export type Slot = { start: string; end: string; label: string };
export type SlotDay = { date: string; label: string; slots: Slot[] };
