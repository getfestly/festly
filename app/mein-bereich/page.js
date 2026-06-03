'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'
import Nav from '@/components/Nav'

export default function MeinBereichPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [listingsCount, setListingsCount] = useState(0)
  const [pendingBookings, setPendingBookings] = useState(0)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email)
      setUserId(user.id)

      const [profileRes, listingsRes, pendingRes] = await Promise.all([
        supabase.from('profiles')
          .select('display_name, stripe_account_id, stripe_onboarding_complete')
          .eq('id', user.id).single(),
        supabase.from('listings').select('id').eq('provider_id', user.id),
        supabase.from('bookings').select('id')
          .eq('customer_id', user.id).in('status', ['pending', 'accepted']),
      ])

      setProfile(profileRes.data)
      setListingsCount(listingsRes.data?.length ?? 0)
      setPendingBookings(pendingRes.data?.length ?? 0)
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
  const isAdmin = userId === ADMIN_USER_ID

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Begrüßung */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hallo, {profile?.display_name ?? 'du'}!
            </h1>
            <p className="text-gray-500 text-sm">{email}</p>
          </div>
        </div>

        {/* Zwei Karten */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* Meine Buchungen */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-1">Meine Buchungen</h2>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              {pendingBookings > 0
                ? `${pendingBookings} offene ${pendingBookings === 1 ? 'Anfrage' : 'Anfragen'}`
                : 'Keine offenen Anfragen'}
            </p>
            <Link
              href="/mein-bereich/anfragen"
              className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors text-center"
            >
              Meine Anfragen
            </Link>
          </div>

          {/* Meine Angebote */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
            <h2 className="font-semibold text-gray-900 mb-1">Meine Angebote</h2>
            <p className="text-sm text-gray-500 mb-4 flex-1">
              {listingsCount === 0
                ? 'Noch keine Angebote erstellt'
                : `${listingsCount} ${listingsCount === 1 ? 'Angebot' : 'Angebote'}`}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/anbieter/listings"
                className="text-sm px-3 py-2 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-colors"
              >
                Verwalten
              </Link>
              <Link
                href="/anbieter/listings/neu"
                className="text-sm px-3 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                + Neues Angebot
              </Link>
            </div>
          </div>
        </div>

        {/* Stripe Connect — nur wenn Listings vorhanden */}
        {listingsCount > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Auszahlungskonto</h2>
            {profile?.stripe_onboarding_complete ? (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
                  ✓ Verifiziert
                </span>
                <span className="text-xs text-gray-400">Bankkonto über Stripe verbunden</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Um Zahlungen zu empfangen, verbinde dein Konto mit Stripe.
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

        {/* Admin-Bereich */}
        {isAdmin && (
          <Link
            href="/admin"
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all block"
          >
            <p className="font-semibold text-gray-900 mb-1">Admin-Bereich</p>
            <p className="text-sm text-gray-500">Plattform verwalten</p>
          </Link>
        )}

      </main>
    </div>
  )
}
