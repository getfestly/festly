'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function AnfragenPage() {
  const { id: listingId } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [eventDate, setEventDate] = useState('')
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
        .select('id, title, price_cents, provider_id')
        .eq('id', listingId)
        .eq('is_active', true)
        .single()

      if (!listing) { router.replace('/marktplatz'); return }

      setUser(user)
      setListing(listing)
    }
    check()
  }, [listingId, router])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: bookingError } = await supabase.from('bookings').insert({
      listing_id: listing.id,
      customer_id: user.id,
      provider_id: listing.provider_id,
      event_date: eventDate,
      status: 'pending',
      amount_cents: listing.price_cents,
      commission_cents: 0,
      provider_payout_cents: 0,
    })

    if (bookingError) { setError(bookingError.message); setLoading(false); return }
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
  const preis = (listing.price_cents / 100).toLocaleString('de-DE', {
    style: 'currency', currency: 'EUR',
  })

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
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Gesamtpreis</p>
            <p className="text-2xl font-bold text-gray-900">{preis}</p>
            <p className="text-xs text-gray-400 mt-1">
              Inkl. 15&nbsp;% Festly-Provision — Zahlung erst nach Annahme durch den Anbieter
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Wunschdatum *</label>
            <input
              type="date"
              required
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
