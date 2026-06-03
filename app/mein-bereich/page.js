'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'
import Nav from '@/components/Nav'

const ROLE_LABEL = { provider: 'Anbieter', customer: 'Kunde' }

export default function MeinBereichPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [providerRating, setProviderRating] = useState(null) // { avg, count }
  const [listingsCount, setListingsCount] = useState(0)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email)
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('display_name, role, stripe_account_id, stripe_onboarding_complete')
        .eq('id', user.id)
        .single()
      setProfile(data)

      const { data: myListings } = await supabase
        .from('listings').select('id').eq('provider_id', user.id)
      const count = myListings?.length ?? 0
      setListingsCount(count)

      if (count > 0) {
        const { data: providerBookings } = await supabase
          .from('bookings').select('id').eq('provider_id', user.id).eq('status', 'completed')
        if (providerBookings?.length) {
          const ids = providerBookings.map(b => b.id)
          const { data: ratingRows } = await supabase
            .from('reviews').select('rating').in('booking_id', ids)
          const rCount = ratingRows?.length ?? 0
          const avg = rCount
            ? (ratingRows.reduce((s, r) => s + r.rating, 0) / rCount).toFixed(1)
            : null
          setProviderRating({ avg, count: rCount })
        }
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handleStripeOnboard() {
    setStripeLoading(true)
    setStripeError(null)
    try {
      const res = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setStripeError(data.error ?? 'Fehler beim Starten des Onboardings.')
        setStripeLoading(false)
      }
    } catch {
      setStripeError('Netzwerkfehler. Bitte versuche es erneut.')
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const initial = profile?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Profil-Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{profile?.display_name ?? '–'}</h1>
              <p className="text-gray-500 text-sm">{ROLE_LABEL[profile?.role] ?? profile?.role}</p>
              {providerRating?.count > 0 && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm text-gray-600">
                    {providerRating.avg} ({providerRating.count} Bewertung{providerRating.count !== 1 ? 'en' : ''})
                  </span>
                </div>
              )}
              <p className="text-gray-400 text-sm truncate">{email}</p>
            </div>
          </div>
        </div>

        {/* Auszahlungskonto — sichtbar sobald Listings vorhanden */}
        {listingsCount > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">Auszahlungskonto</h2>

            {profile.stripe_onboarding_complete ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
                  ✓ Verifiziert
                </span>
                <span className="text-xs text-gray-400">Bankkonto über Stripe verbunden</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Verbinde dein Bankkonto über Stripe, um Auszahlungen für abgeschlossene Buchungen zu erhalten.
                  Stripe führt die Identitätsverifizierung (KYC) durch — Festly speichert keine Bankdaten.
                </p>
                {stripeError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">
                    {stripeError}
                  </p>
                )}
                <button
                  onClick={handleStripeOnboard}
                  disabled={stripeLoading}
                  className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {stripeLoading ? 'Weiterleitung …' : 'Bankkonto verbinden'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Schnellzugriff */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/mein-bereich/anfragen"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900 mb-1">
              {listingsCount > 0 ? 'Buchungen & Anfragen' : 'Meine Buchungen'}
            </p>
            <p className="text-sm text-gray-500">
              {listingsCount > 0 ? 'Anfragen annehmen und verwalten' : 'Buchungsanfragen und Status'}
            </p>
          </Link>

          <Link
            href="/anbieter/listings"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900 mb-1">Meine Angebote</p>
            <p className="text-sm text-gray-500">Angebote erstellen und verwalten</p>
          </Link>

          <Link
            href="/marktplatz"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <p className="font-semibold text-gray-900 mb-1">Marktplatz</p>
            <p className="text-sm text-gray-500">Event-Dienstleistungen entdecken</p>
          </Link>

          {userId === ADMIN_USER_ID && (
            <Link
              href="/admin"
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-gray-900 mb-1">Admin-Bereich</p>
              <p className="text-sm text-gray-500">Plattform verwalten</p>
            </Link>
          )}
        </div>

      </main>
    </div>
  )
}
