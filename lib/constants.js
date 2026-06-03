export const KATEGORIEN = [
  { value: 'food',       label: 'Catering & Food' },
  { value: 'ride',       label: 'Fahrgeschäfte' },
  { value: 'music',      label: 'Musik & DJ' },
  { value: 'sanitation', label: 'Sanitär / Toilettenwagen' },
  { value: 'tech',       label: 'Eventtechnik' },
  { value: 'rental',     label: 'Verleih' },
  { value: 'other',      label: 'Sonstiges' },
]

export const KATEGORIE_LABEL = Object.fromEntries(
  KATEGORIEN.map((k) => [k.value, k.label])
)

const REGION_NAMES = {
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
