'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { submitBooking } from '@/app/actions/booking'
import Nav from '@/components/Nav'
import { trackEvent } from '@/lib/analytics'

const eur = (cents) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

// Menge-Label je Preismodell
function quantityLabel(listing) {
  const unit = listing.price_unit_label
  switch (listing.price_model) {
    case 'per_person': return `Anzahl ${unit ?? 'Personen'} *`
    case 'flat_plus':  return `Anzahl ${unit ?? 'Einheiten'} *`
    case 'hourly':     return `Anzahl ${unit ?? 'Stunden'} *`
    default:           return null
  }
}

// Gesamtbetrag berechnen
function calcAmountCents(listing, quantity) {
  const qty = Math.max(1, parseInt(quantity) || 1)
  switch (listing.price_model) {
    case 'flat':       return listing.price_cents
    case 'per_person': return qty * listing.price_cents
    case 'flat_plus':  return listing.price_cents       // Grundpreis; Aufpreis vom Anbieter
    case 'hourly':     return qty * listing.price_cents
    case 'on_request': return 0
    default:           return listing.price_cents
  }
}

export default function AnfragenPage() {
  const { id: listingId } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [eventDate, setEventDate] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'customer') { router.replace(`/angebote/${listingId}`); return }

      const { data: listing } = await supabase
        .from('listings')
        .select('id, title, price_cents, price_model, price_unit_label, provider_id')
        .eq('id', listingId)
        .eq('is_active', true)
        .single()

      if (!listing) { router.replace('/marktplatz'); return }

      setUser(user)
      setListing(listing)
      trackEvent('booking_started', {
        listing_id:  listing.id,
        provider_id: listing.provider_id,
      })
    }
    check()
  }, [listingId, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Serverseitige Berechnung und Insert — Client übergibt nur listingId, Datum, Menge
    const result = await submitBooking({
      listingId,
      eventDate,
      quantity,
      eventTitle,
      eventDescription,
    })

    if (result.error) { setError(result.error); setLoading(false); return }
    trackEvent('booking_submitted', {
      listing_id:   listingId,
      amount_cents: amountCents,
      price_model:  listing.price_model,
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

  const today = new Date().toISOString().split('T')[0]
  const needsQuantity = ['per_person', 'flat_plus', 'hourly'].includes(listing.price_model)
  const qtyLabel = quantityLabel(listing)
  const amountCents = calcAmountCents(listing, quantity)
  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

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

          {/* Preisvorschau */}
          {listing.price_model === 'on_request' ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500">
                Preis auf Anfrage — der Anbieter nennt dir den Betrag nach der Anfrage.
              </p>
            </div>
          ) : listing.price_model === 'flat_plus' ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Grundpreis</p>
              <p className="text-2xl font-bold text-gray-900">{eur(listing.price_cents)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Aufpreis für {listing.price_unit_label ?? 'zusätzliche Einheiten'} teilt dir der Anbieter mit.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Gesamtpreis</p>
              <p className="text-2xl font-bold text-gray-900">{eur(amountCents)}</p>
              {needsQuantity && parseInt(quantity) > 1 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {quantity}{' '}×{' '}{eur(listing.price_cents)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Zahlung erst nach Annahme durch den Anbieter — abzgl. Plattformgebühr
              </p>
            </div>
          )}

          {/* Mengenfeld — nur für per_person, flat_plus, hourly */}
          {needsQuantity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{qtyLabel}</label>
              <input
                type="number"
                required
                min="1"
                step="1"
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
              type="date"
              required
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Event-Titel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Wie heißt dein Event? *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="z.B. Hochzeit, Geburtstag, Firmenfest, Stadtfest..."
              className={inputCls}
            />
          </div>

          {/* Event-Beschreibung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Beschreibe dein Event
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Erzähl dem Anbieter mehr: Wie viele Gäste erwartest du? Was ist der Anlass? Gibt es besondere Wünsche oder wichtige Details?"
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
