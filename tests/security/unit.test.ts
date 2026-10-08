// Tests de sécurité unitaires (sans réseau) : limitation de débit, échappement ICS, fiches clients.
import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeText } from "@/lib/booking/ics";
import { upsertContact } from "@/lib/contacts";
import { ipBucket } from "@/lib/security/rate-limit";

test("Limitation de débit : une IPv6 est regroupée par bloc /64 (rotation d'adresses inutile)", () => {
  assert.equal(ipBucket("2001:db8:1:2:aaaa::1"), ipBucket("2001:db8:1:2:ffff:1:2:3"));
  assert.equal(ipBucket("2001:0db8:0001:0002::"), "2001:db8:1:2::/64");
  assert.notEqual(ipBucket("2001:db8:1:2::1"), ipBucket("2001:db8:1:3::1"));
  assert.equal(ipBucket("203.0.113.7"), "203.0.113.7");
  assert.equal(ipBucket("::ffff:203.0.113.7"), "::ffff:203.0.113.7");
});

test("ICS : aucun saut de ligne ne peut injecter une propriété dans le calendrier", () => {
  for (const payload of ["A\rBEGIN:VALARM", "A\r\nATTACH:http://x", "A\nURL:http://x", "A\u000bB"]) {
    const out = escapeText(payload);
    assert.ok(!/[\r\n\u000b]/.test(out), JSON.stringify(out));
  }
  assert.equal(escapeText("a,b;c\\d"), "a\\,b\\;c\\\\d");
});

type Row = Record<string, unknown>;
function fakeDb(existing: Row | null) {
  const calls: { update?: Row; insert?: Row } = {};
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => ({ data: existing }),
    update: (v: Row) => {
      calls.update = v;
      return { eq: async () => ({ error: null }) };
    },
    insert: (v: Row) => {
      calls.insert = v;
      return { select: () => ({ single: async () => ({ data: { id: "nouveau" }, error: null }) }) };
    },
  };
  return { db: { from: () => chain } as never, calls };
}

const attacker = {
  kind: "particulier" as const,
  firstName: "Pirate",
  lastName: "Usurpateur",
  email: "Client@Exemple.fr",
  phone: "0699999999",
  city: "Ailleurs",
  address: "1 rue de l'Attaquant",
  marketingConsent: false,
};

test("Formulaire public : une fiche existante n'est jamais écrasée (seuls les champs vides sont complétés)", async () => {
  const existing = {
    id: "client-1",
    marketing_consent: false,
    company: null,
    first_name: "Camille",
    last_name: "Martin",
    phone: "0611111111",
    postal_code: null,
    city: "Saint-Malo",
    address: null,
  };
  const { db, calls } = fakeDb(existing);
  const id = await upsertContact(db, attacker);
  assert.equal(id, "client-1");
  assert.ok(calls.update);
  for (const field of ["first_name", "last_name", "phone", "city", "kind", "email"]) {
    assert.ok(!(field in calls.update!), `le champ ${field} ne doit pas être modifié`);
  }
  assert.equal(calls.update!.address, "1 rue de l'Attaquant", "un champ vide peut être complété");
});

test("Formulaire public : nouveau contact créé avec l'e-mail en minuscules", async () => {
  const { db, calls } = fakeDb(null);
  assert.equal(await upsertContact(db, attacker), "nouveau");
  assert.equal(calls.insert!.email, "client@exemple.fr");
  assert.equal(calls.insert!.phone, "0699999999");
});
