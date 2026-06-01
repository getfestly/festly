const eur = (cents) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

export const PRICING_MODELS = [
  { value: 'flat',       label: 'Pauschale (pro Tag)' },
  { value: 'per_person', label: 'Pro Person' },
  { value: 'flat_plus',  label: 'Pauschale + je Einheit' },
  { value: 'hourly',     label: 'Stundensatz' },
  { value: 'on_request', label: 'Auf Anfrage' },
]

// Kurze Preisanzeige für Karten und Überschriften
export function formatPreis(listing) {
  const { price_model, price_cents, price_unit_label } = listing ?? {}

  switch (price_model) {
    case 'flat':
      return `${eur(price_cents)}/Tag`
    case 'per_person':
      return `${eur(price_cents)}/${price_unit_label ?? 'Person'}`
    case 'flat_plus':
      return `ab ${eur(price_cents)} + je ${price_unit_label ?? 'Einheit'}`
    case 'hourly':
      return `${eur(price_cents)}/${price_unit_label ?? 'Stunde'}`
    case 'on_request':
      return 'Preis auf Anfrage'
    default:
      // Fallback für alte Listings ohne price_model
      return price_cents ? eur(price_cents) : '–'
  }
}

// Ausführlichere Beschreibung für die Detailseite
export function formatPreisDetail(listing) {
  const { price_model, price_cents, price_unit_label } = listing ?? {}

  switch (price_model) {
    case 'flat':
      return `${eur(price_cents)} pro Tag`
    case 'per_person':
      return `${eur(price_cents)} pro ${price_unit_label ?? 'Person'}`
    case 'flat_plus':
      return `${eur(price_cents)} Grundpreis · zzgl. je ${price_unit_label ?? 'Einheit'} (auf Anfrage)`
    case 'hourly':
      return `${eur(price_cents)} pro ${price_unit_label ?? 'Stunde'}`
    case 'on_request':
      return 'Preis wird individuell nach Anfrage vereinbart.'
    default:
      return price_cents ? eur(price_cents) : '–'
  }
}
