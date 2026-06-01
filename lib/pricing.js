const eur = (cents) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

export const PRICING_MODELS = [
  { value: 'flat_day',           label: 'Pauschale (pro Tag)' },
  { value: 'per_person',         label: 'Pro Person' },
  { value: 'base_plus_quantity', label: 'Pauschale + Menge' },
  { value: 'hourly',             label: 'Stundensatz' },
  { value: 'on_request',         label: 'Auf Anfrage' },
]

// Kurze Preisanzeige für Karten und Überschriften
export function formatPreis(listing) {
  const {
    pricing_model,
    base_price_cents,
    price_per_unit_cents,
    included_quantity,
    unit_label,
    price_cents,
  } = listing ?? {}

  switch (pricing_model) {
    case 'flat_day':
      return `${eur(base_price_cents ?? price_cents)}/Tag`
    case 'per_person':
      return price_per_unit_cents ? `ab ${eur(price_per_unit_cents)}/Person` : 'Auf Anfrage'
    case 'base_plus_quantity':
      return `${eur(base_price_cents)} inkl. ${included_quantity ?? 0} ${unit_label ?? 'Stück'}`
    case 'hourly':
      if (base_price_cents && included_quantity) {
        return `${eur(base_price_cents)} inkl. ${included_quantity} Std.`
      }
      return price_per_unit_cents ? `${eur(price_per_unit_cents)}/Std.` : '–'
    case 'on_request':
      return 'Preis auf Anfrage'
    default:
      // Fallback für alte Listings ohne pricing_model
      return price_cents ? eur(price_cents) : '–'
  }
}

// Ausführlichere Beschreibung für die Detailseite
export function formatPreisDetail(listing) {
  const {
    pricing_model,
    base_price_cents,
    price_per_unit_cents,
    included_quantity,
    min_quantity,
    unit_label,
    price_cents,
  } = listing ?? {}

  switch (pricing_model) {
    case 'flat_day':
      return `${eur(base_price_cents ?? price_cents)} pro Tag`
    case 'per_person': {
      const min = min_quantity ? ` · mind. ${min_quantity} Personen` : ''
      return `${eur(price_per_unit_cents)} pro Person${min}`
    }
    case 'base_plus_quantity': {
      const label = unit_label ?? 'Stück'
      const extra = price_per_unit_cents
        ? ` · ${eur(price_per_unit_cents)} je weitere ${label}`
        : ''
      return `${eur(base_price_cents)} Grundpreis inkl. ${included_quantity ?? 0} ${label}${extra}`
    }
    case 'hourly': {
      const base = base_price_cents && included_quantity
        ? `${eur(base_price_cents)} Grundpreis inkl. ${included_quantity} Std. · `
        : ''
      return `${base}${eur(price_per_unit_cents)} je weitere Stunde`
    }
    case 'on_request':
      return 'Preis wird individuell nach Anfrage vereinbart.'
    default:
      return price_cents ? eur(price_cents) : '–'
  }
}
