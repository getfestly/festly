// ── Verschachtelte Kategorie-Struktur ────────────────────────────────────────

export const KATEGORIEN = [
  {
    id: 'fahrgeschaefte',
    label: 'Fahrgeschäfte',
    subcategories: [
      { id: 'achterbahn',          label: 'Achterbahn',              suggested_price_cents: 80000 },
      { id: 'rundfahrgeschaeft',   label: 'Rundfahrgeschäft',        suggested_price_cents: 60000 },
      { id: 'hochfahrgeschaeft',   label: 'Hochfahrgeschäft',        suggested_price_cents: 70000 },
      { id: 'riesenrad',           label: 'Riesenrad',               suggested_price_cents: 90000 },
      { id: 'kettenflieger',       label: 'Kettenflieger',           suggested_price_cents: 55000 },
      { id: 'autoscooter',         label: 'Autoscooter / Skooter',   suggested_price_cents: 65000 },
      { id: 'wasserfahrgeschaeft', label: 'Wasserfahrgeschäft',      suggested_price_cents: 70000 },
      { id: 'kinderkarussell',     label: 'Kinderkarussell',         suggested_price_cents: 35000 },
      { id: 'simulator',           label: 'Simulator / 4D-Kino',     suggested_price_cents: 45000 },
    ],
  },
  {
    id: 'gastro',
    label: 'Gastro',
    subcategories: [
      { id: 'crepes_waffeln',       label: 'Crêpes & Waffeln',          suggested_price_cents: 15000 },
      { id: 'imbiss_bratwurst',     label: 'Imbiss / Bratwurst',         suggested_price_cents: 12000 },
      { id: 'fisch_meeresfruechte', label: 'Fisch & Meeresfrüchte',      suggested_price_cents: 18000 },
      { id: 'getraenke_bar',        label: 'Getränkeausschank / Bar',     suggested_price_cents: 20000 },
      { id: 'cocktailbar',          label: 'Cocktailbar',                suggested_price_cents: 25000 },
      { id: 'kaffeemobil',          label: 'Kaffeemobil',                suggested_price_cents: 14000 },
      { id: 'suesswaren',           label: 'Süßwaren / Zuckerwatte',      suggested_price_cents: 10000 },
      { id: 'grill',                label: 'Grillstation',               suggested_price_cents: 15000 },
      { id: 'pizza_pasta',          label: 'Pizza & Pasta',              suggested_price_cents: 16000 },
    ],
  },
  {
    id: 'unterhaltung',
    label: 'Unterhaltung',
    subcategories: [
      { id: 'musikband', label: 'Musikband',          suggested_price_cents: 80000 },
      { id: 'dj',        label: 'DJ',                 suggested_price_cents: 50000 },
      { id: 'comedian',  label: 'Comedian',           suggested_price_cents: 60000 },
      { id: 'zauberer',  label: 'Zauberer',           suggested_price_cents: 35000 },
      { id: 'moderator', label: 'Moderator',          suggested_price_cents: 45000 },
      { id: 'fotobox',   label: 'Fotobox / Fotograf', suggested_price_cents: 30000 },
      { id: 'huepfburg', label: 'Hüpfburg',           suggested_price_cents: 15000 },
    ],
  },
  {
    id: 'ausstattung',
    label: 'Ausstattung & Technik',
    subcategories: [
      { id: 'buehne_pa',  label: 'Bühne & PA',       suggested_price_cents: 50000 },
      { id: 'licht',      label: 'Licht & Laser',    suggested_price_cents: 35000 },
      { id: 'zelt',       label: 'Zelt / Festzelt',  suggested_price_cents: 60000 },
      { id: 'moeblierung',label: 'Möbel & Deko',     suggested_price_cents: 20000 },
      { id: 'aggregate',  label: 'Strom & Aggregate',suggested_price_cents: 25000 },
    ],
  },
  {
    id: 'sanitaer_service',
    label: 'Sanitär & Service',
    subcategories: [
      { id: 'toilettenwagen', label: 'Toilettenwagen',    suggested_price_cents: 30000 },
      { id: 'container',      label: 'Sanitärcontainer',  suggested_price_cents: 45000 },
      { id: 'security',       label: 'Sicherheitsdienst', suggested_price_cents: 40000 },
      { id: 'aufbauhelfer',   label: 'Aufbauhelfer',      suggested_price_cents: 15000 },
    ],
  },
]

// ── Fahrzeugtypen ────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = [
  { id: 'pkw_anhaenger', label: 'PKW mit Anhänger',               rate_per_km_cents: 50  },
  { id: 'lkw_mittel',    label: 'LKW ab 7,5t',          rate_per_km_cents: 100 },
  { id: 'lkw_gross',     label: 'LKW ab 7,5t mit Kran',  rate_per_km_cents: 180 },
]

// ── Promoted Listings ────────────────────────────────────────────────────────

export const PROMOTED_LISTING_PRICE_CENTS = 3000

// ── Abonnement-Pläne ─────────────────────────────────────────────────────────

export const SUBSCRIPTION_PLANS = [
  {
    id: 'pro',
    label: 'Festly Pro',
    price_cents: 3000,
    interval: 'month',
    benefits: [
      '10% Rabatt auf Promoted Listings',
      'Festly Insights Basic',
      'Prioritäts-Support',
    ],
  },
]

// ── Kategorie-Emojis ─────────────────────────────────────────────────────────

export const KATEGORIE_EMOJI = {
  fahrgeschaefte:   '🎡',
  gastro:           '🍽️',
  unterhaltung:     '🎵',
  ausstattung:      '💡',
  sanitaer_service: '🚿',
}

// ── Kompatibilitäts-Exporte ───────────────────────────────────────────────────
// Für Code der ein flaches Array { id, label } erwartet

export const KATEGORIEN_FLAT = KATEGORIEN.map((k) => ({
  id: k.id,
  label: k.label,
}))

// KATEGORIE_LABEL enthält Legacy-Werte (alte DB-Einträge) + neue Werte
export const KATEGORIE_LABEL = {
  // Legacy-Werte (bestehende Listings in der DB)
  food:       'Catering & Food',
  ride:       'Fahrgeschäfte',
  music:      'Musik & DJ',
  sanitation: 'Sanitär / Toilettenwagen',
  tech:       'Eventtechnik',
  rental:     'Verleih',
  other:      'Sonstiges',
  // Neue Werte
  ...Object.fromEntries(KATEGORIEN.map((k) => [k.id, k.label])),
}

export const SUBKATEGORIE_LABEL = Object.fromEntries(
  KATEGORIEN.flatMap((k) => k.subcategories.map((s) => [s.id, s.label]))
)

// ── Regionen ─────────────────────────────────────────────────────────────────

export const REGION_NAMES = {
  nds: 'Niedersachsen',
  by:  'Bayern',
  bw:  'Baden-Württemberg',
  nrw: 'Nordrhein-Westfalen',
  be:  'Berlin',
  hh:  'Hamburg',
  hb:  'Bremen',
  he:  'Hessen',
  bb:  'Brandenburg',
  mv:  'Mecklenburg-Vorpommern',
  sn:  'Sachsen',
  st:  'Sachsen-Anhalt',
  th:  'Thüringen',
  rp:  'Rheinland-Pfalz',
  sl:  'Saarland',
  sh:  'Schleswig-Holstein',
}

export function formatRegion(region) {
  if (!region) return null
  return REGION_NAMES[region.toLowerCase()] ?? region
}
