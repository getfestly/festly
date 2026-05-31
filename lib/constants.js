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
