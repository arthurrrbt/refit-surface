// Génération de fichiers calendrier iCalendar (.ics), lisibles par Outlook, Google, Apple…

export type IcsEvent = {
  uid: string;
  start: string | Date;
  end: string | Date;
  summary: string;
  location?: string | null;
  description?: string | null;
};

function stamp(value: string | Date) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Échappement RFC 5545. Tout saut de ligne (\r\n, \r seul ou \n) devient « \n » littéral :
 * un \r laissé brut permettrait d'injecter des propriétés (alarme, pièce jointe…) dans le calendrier.
 */
export function escapeText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "");
}

/** Replie les lignes longues (75 caractères max, norme RFC 5545). */
function fold(line: string) {
  const chunks: string[] = [];
  for (let i = 0; i < line.length; i += 73) chunks.push((i ? " " : "") + line.slice(i, i + 73));
  return chunks.join("\r\n");
}

export function buildIcs(events: IcsEvent[], calendarName = "REFIT Surface") {
  const now = stamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//REFIT Surface//Planning//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${escapeText(e.description)}`] : []),
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
