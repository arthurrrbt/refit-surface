"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import type { Place } from "@/lib/live/types";

type Props = Omit<ComponentProps<"input">, "onChange" | "value" | "defaultValue" | "type"> & {
  name: string;
  defaultValue?: string;
  /** « commune » : ne propose que des villes (le champ reçoit le nom de la ville). */
  type?: "adresse" | "commune";
  /** Champs du même formulaire à remplir au choix d'une suggestion (attribut name). */
  fill?: { postcode?: string; city?: string };
  tone?: "dark" | "light";
};

/**
 * Champ d'adresse avec suggestions de la Base Adresse Nationale, via /api/adresses.
 * Reste un champ texte normal : si le service ne répond pas, la saisie libre fonctionne.
 */
export function AddressAutocomplete({ name, defaultValue = "", type = "adresse", fill, tone = "dark", className, ...props }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const typed = useRef(false); // ne chercher que sur une frappe, pas après un choix
  const listId = useId();

  useEffect(() => {
    const q = value.trim();
    if (!typed.current || q.length < 3) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/adresses?type=${type}&q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const json: { results: Place[] } = await res.json();
        setResults(json.results);
        setActive(-1);
        setOpen(json.results.length > 0);
      } catch {
        // service indisponible ou requête annulée : saisie libre
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, type]);

  function choose(place: Place) {
    typed.current = false;
    setValue(type === "commune" ? (place.city ?? place.label) : fill ? (place.street ?? place.label) : place.label);
    setOpen(false);
    const form = inputRef.current?.form;
    const set = (field: string | undefined, v: string | null) => {
      const el = field ? form?.elements.namedItem(field) : null;
      if (el instanceof HTMLInputElement && v) el.value = v;
    };
    set(fill?.postcode, place.postcode);
    set(fill?.city, place.city);
  }

  const panel = tone === "dark" ? "border-line bg-ink-2 text-paper" : "border-ink/15 bg-paper text-ink";
  const hover = tone === "dark" ? "bg-paper/10" : "bg-mist";

  return (
    <div className="relative">
      <input
        {...props}
        ref={inputRef}
        name={name}
        value={value}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          typed.current = true;
          setValue(e.target.value);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <div className={`absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-sm border text-sm shadow-lg ${panel}`}>
          <ul id={listId} role="listbox">
            {results.map((place, i) => (
              <li
                key={`${place.label}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(place);
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3 py-2 ${i === active ? hover : ""}`}
              >
                {place.label}
              </li>
            ))}
          </ul>
          <p className="px-3 py-1 text-[11px] opacity-60">Adresses : Base Adresse Nationale (IGN)</p>
        </div>
      )}
    </div>
  );
}
