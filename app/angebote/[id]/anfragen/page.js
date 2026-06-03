'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { submitBooking } from '@/app/actions/booking'
import Nav from '@/components/Nav'
import { trackEvent } from '@/lib/analytics'
import { VEHICLE_TYPES } from '@/lib/constants'

const eur = (cents) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

// Basispreis ohne Fahrtkosten
function calcBaseCents(listing, quantity) {
  const qty = Math.max(1, parseInt(quantity) || 1)
  switch (listing.price_model) {
    case 'flat':       return listing.price_cents
    case 'per_person': return qty * listing.price_cents
    case 'flat_plus':  return listing.price_cents
    case 'hourly':     return qty * listing.price_cents
    case 'on_request': return 0
    default:           return listing.price_cents
  }
}

// PLZ oder ersten Ortsnamen aus region extrahieren
function extractPlz(region) {
  if (!region) return null
  const match = region.match(/\b(\d{5})\b/)
  if (match) return match[1]
  return region.trim().split(/[\s,]+/)[0]
}

// Koordinaten via Nominatim (kein API-Key)
async function geocode(query) {
  const q = encodeURIComponent(`${query}, Deutschland`)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=de`,
    { headers: { 'Accept-Language': 'de' } }
  )
  const data = await res.json()
  if (!data?.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

// Fahrtstrecke via OSRM (kein API-Key, open source)
async function getRouteKm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok') return null
  return data.routes[0].distance / 1000
}

export default function AnfragenPage() {
  const { id: listingId } = useParams()
  const router = useRouter()
  const [listing, setListing]               = useState(null)
  const [providerRegion, setProviderRegion] = useState(null)
  const [eventDate, setEventDate]           = useState('')
  const [quantity, setQuantity]             = useState('1')
  const [eventTitle, setEventTitle]         = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [customerPlz, setCustomerPlz]       = useState('')
  const [transportKm, setTransportKm]       = useState(null)
  const [transportCents, setTransportCents] = useState(0)
  const [transportLoading, setTransportLoading] = useState(false)
  const [transportError, setTransportError] = useState(null)
  const [error, setError]                   = useState(null)
  const [loading, setLoading]               = useState(false)
  const [user, setUser]                     = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: listing } = await supabase
        .from('listings')
        .select('id, title, price_cents, price_model, price_unit_label, provider_id, vehicle_type')
        .eq('id', listingId)
        .eq('is_active', true)
        .single()

      if (!listing) { router.replace('/marktplatz'); return }

      // Anbieter-Region für PLZ-Schätzung laden
      const { data: providerProfile } = await supabase
        .from('profiles').select('region').eq('id', listing.provider_id).single()

      setUser(user)
      setListing(listing)
      setProviderRegion(providerProfile?.region ?? null)
      trackEvent('booking_started', { listing_id: listing.id, provider_id: listing.provider_id })
    }
    check()
  }, [listingId, router])

  // Fahrtkosten berechnen sobald Kunden-PLZ eingegeben
  async function calcTransport(plz) {
    if (!plz || plz.length < 4) return
    setTransportLoading(true)
    setTransportError(null)
    setTransportKm(null)
    setTransportCents(0)

    try {
      const providerPlz = extractPlz(providerRegion)
      if (!providerPlz) {
        setTransportError('Anbieter-Standort nicht verfügbar — Fahrtkosten bitte direkt abstimmen.')
        setTransportLoading(false)
        return
      }

      const [fromCoord, toCoord] = await Promise.all([
        geocode(providerPlz),
        geocode(plz),
      ])

      if (!fromCoord || !toCoord) {
        setTransportError('PLZ nicht gefunden — Fahrtkosten bitte mit dem Anbieter abstimmen.')
        setTransportLoading(false)
        return
      }

      const km = await getRouteKm(fromCoord, toCoord)
      if (km == null) {
        setTransportError('Route konnte nicht berechnet werden — Fahrtkosten bitte abstimmen.')
        setTransportLoading(false)
        return
      }

      const vehicleType = VEHICLE_TYPES.find((v) => v.id === listing.vehicle_type)
        ?? VEHICLE_TYPES[0]
      const cents = Math.round(km * 2 * vehicleType.rate_per_km_cents)

      setTransportKm(Math.round(km))
      setTransportCents(cents)
    } catch {
      setTransportError('Fahrtkosten konnten nicht berechnet werden — bitte mit dem Anbieter abstimmen.')
      setTransportCents(0)
    }
    setTransportLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await submitBooking({
      listingId,
      eventDate,
      quantity,
      eventTitle,
      eventDescription,
      transportCents,
    })

    if (result.error) { setError(result.error); setLoading(false); return }

    const baseCents = listing ? calcBaseCents(listing, quantity) : 0
    trackEvent('booking_submitted', {
      listing_id:   listingId,
      amount_cents: baseCents + transportCents,
      price_model:  listing?.price_model,
    })
    router.push('/mein-bereich/anfragen')
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const today         = new Date().toISOString().split('T')[0]
  const needsQuantity = ['per_person', 'flat_plus', 'hourly'].includes(listing.price_model)
  const qty           = Math.max(1, parseInt(quantity) || 1)
  const baseCents     = calcBaseCents(listing, qty)
  const totalCents    = baseCents + transportCents
  const payoutCents   = Math.round(totalCents * 0.85)

  const vehicleType   = VEHICLE_TYPES.find((v) => v.id === listing.vehicle_type) ?? VEHICLE_TYPES[0]
  const rateEur       = (vehicleType.rate_per_km_cents / 100).toFixed(2)

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  // Zeilen für Preisaufschlüsselung
  const rows = []

  if (listing.price_model === 'on_request') {
    rows.push({ label: 'Preis auf Anfrage', value: null, sub: null })
  } else if (listing.price_model === 'flat') {
    rows.push({ label: 'Pauschale', value: eur(listing.price_cents), sub: null })
  } else if (listing.price_model === 'per_person') {
    rows.push({
      label: `${qty} ${listing.price_unit_label ?? 'Personen'}`,
      value: eur(qty * listing.price_cents),
      sub: `${eur(listing.price_cents)} / ${listing.price_unit_label ?? 'Person'}`,
    })
  } else if (listing.price_model === 'flat_plus') {
    rows.push({ label: 'Grundpreis', value: eur(listing.price_cents), sub: null })
    rows.push({ label: `+ Aufpreis je ${listing.price_unit_label ?? 'Einheit'}`, value: 'auf Anfrage', sub: null })
  } else if (listing.price_model === 'hourly') {
    rows.push({
      label: `${qty} ${listing.price_unit_label ?? 'Stunden'}`,
      value: eur(qty * listing.price_cents),
      sub: `${eur(listing.price_cents)} / ${listing.price_unit_label ?? 'Stunde'}`,
    })
  }

  if (transportCents > 0) {
    rows.push({
      label: '+ Fahrtkosten',
      value: `+${eur(transportCents)}`,
      sub: transportKm ? `ca. ${transportKm * 2} km × ${rateEur} €` : null,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-md mx-auto px-4 py-8">
        <Link href={`/angebote/${listingId}`} className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zum Angebot
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buchungsanfrage</h1>
        <p className="text-gray-500 mb-8">{listing.title}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

          {/* Mengenfeld */}
          {needsQuantity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {listing.price_model === 'per_person'
                  ? `Anzahl ${listing.price_unit_label ?? 'Personen'} *`
                  : listing.price_model === 'hourly'
                  ? `Anzahl ${listing.price_unit_label ?? 'Stunden'} *`
                  : `Anzahl ${listing.price_unit_label ?? 'Einheiten'} *`}
              </label>
              <input
                type="number" required min="1" step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={inputCls}
              />
            </div>
          )}

          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Wunschdatum *</label>
            <input
              type="date" required min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* PLZ Veranstaltungsort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PLZ des Veranstaltungsorts *
            </label>
            <input
              type="text" required
              value={customerPlz}
              onChange={(e) => setCustomerPlz(e.target.value)}
              onBlur={(e) => calcTransport(e.target.value.trim())}
              placeholder="z.B. 80331"
              maxLength={10}
              className={inputCls}
            />
            {transportLoading && (
              <p className="text-xs text-gray-400 mt-1.5">Fahrtkosten werden berechnet …</p>
            )}
            {transportError && !transportLoading && (
              <p className="text-xs text-amber-600 mt-1.5">{transportError}</p>
            )}
            {transportKm != null && !transportLoading && (
              <p className="text-xs text-gray-400 mt-1.5">
                Anfahrt ca. {transportKm} km (einfach) — Hin- und Rückfahrt berücksichtigt
              </p>
            )}
          </div>

          {/* Preisaufschlüsselung */}
          {listing.price_model !== 'on_request' ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
              {rows.map((row, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    {row.value != null && (
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{row.value}</span>
                    )}
                  </div>
                  {row.sub && (
                    <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>
                  )}
                </div>
              ))}

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-gray-900">Gesamtbetrag</span>
                  <span className="text-xl font-bold text-gray-900">{eur(totalCents)}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs text-gray-400">Davon Auszahlung an Anbieter (85 %)</span>
                  <span className="text-xs text-gray-500 font-medium">{eur(payoutCents)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-1">
                Zahlung erst nach Annahme durch den Anbieter.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Preis auf Anfrage — der Anbieter nennt dir den Betrag nach der Anfrage.
              </p>
              {transportCents > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  + geschätzte Fahrtkosten: {eur(transportCents)}
                </p>
              )}
            </div>
          )}

          {/* Event-Titel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Wie heißt dein Event? *
            </label>
            <input
              type="text" required maxLength={100}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="z.B. Hochzeit, Geburtstag, Firmenfest, Stadtfest …"
              className={inputCls}
            />
          </div>

          {/* Event-Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Beschreibe dein Event
            </label>
            <textarea
              rows={3} maxLength={1000}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Wie viele Gäste erwartest du? Was ist der Anlass? Besondere Wünsche?"
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gesendet …' : 'Anfrage absenden'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Du wirst noch nicht belastet — der Anbieter muss zuerst annehmen.
          </p>
        </form>
      </main>
    </div>
  )
}
