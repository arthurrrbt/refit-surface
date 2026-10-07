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

function escapeText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
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
