'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ADMIN_USER_ID } from '@/lib/admin'
import { KATEGORIE_LABEL } from '@/lib/constants'
import Nav from '@/components/Nav'

const STATUS_CONFIG = {
  pending:   { label: 'Ausstehend',     cls: 'bg-amber-100 text-amber-700' },
  accepted:  { label: 'Angenommen',    cls: 'bg-green-100 text-green-700' },
  paid:      { label: 'Bezahlt',       cls: 'bg-blue-100 text-blue-700'  },
  completed: { label: 'Abgeschlossen', cls: 'bg-gray-100 text-gray-600'  },
  cancelled: { label: 'Storniert',     cls: 'bg-gray-100 text-gray-500'  },
  rejected:  { label: 'Abgelehnt',     cls: 'bg-red-100 text-red-600'   },
}

export default function MeinBereichPage() {
  const router = useRouter()

  const [profile, setProfile]   = useState(null)
  const [email, setEmail]       = useState(null)
  const [userId, setUserId]     = useState(null)
  const [memberSince, setMemberSince] = useState(null)
  const [loading, setLoading]   = useState(true)

  const [customerBookings, setCustomerBookings] = useState([])
  const [listings, setListings] = useState([])

  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError]     = useState(null)

  // Persönliche-Daten-Formular
  const [draftName, setDraftName]       = useState('')
  const [draftAddress, setDraftAddress] = useState('')
  const [formSaving, setFormSaving]     = useState(false)
  const [formSaved, setFormSaved]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setEmail(user.email)
      setUserId(user.id)
      setMemberSince(
        new Date(user.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      )

      const [profileRes, bookingsRes, listingsRes] = await Promise.all([
        supabase.from('profiles')
          .select('display_name, role, stripe_account_id, stripe_onboarding_complete, location_address')
          .eq('id', user.id).single(),
        supabase.from('bookings')
          .select('id, status, event_date, amount_cents, listings(title)')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('listings')
          .select('id, title, category, is_active')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      const p = profileRes.data
      setProfile(p)
      setDraftName(p?.display_name ?? '')
      setDraftAddress(p?.location_address ?? '')
      setCustomerBookings(bookingsRes.data ?? [])
      setListings(listingsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSaveProfile() {
    setFormSaving(true)
    setFormSaved(false)
    await supabase.from('profiles')
      .update({ display_name: draftName, location_address: draftAddress })
      .eq('id', userId)
    setProfile((p) => ({ ...p, display_name: draftName, location_address: draftAddress }))
    setFormSaving(false)
    setFormSaved(true)
    setTimeout(() => setFormSaved(false), 2500)
  }

  async function toggleListing(id, current) {
    await supabase.from('listings').update({ is_active: !current }).eq('id', id)
    setListings((ls) => ls.map((l) => l.id === id ? { ...l, is_active: !current } : l))
  }

  async function handleStripeOnboard() {
    setStripeLoading(true)
    setStripeError(null)
    try {
      const res  = await fetch('/api/stripe/connect/onboard', { method: 'POST' })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else { setStripeError(data.error ?? 'Fehler.'); setStripeLoading(false) }
    } catch {
      setStripeError('Netzwerkfehler.')
      setStripeLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Nav />
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const initial    = profile?.display_name?.[0]?.toUpperCase() ?? '?'
  const isAdmin    = userId === ADMIN_USER_ID
  const isProvider = profile?.role === 'provider' || listings.length > 0
  const pending    = customerBookings.filter((b) => ['pending', 'accepted'].includes(b.status)).length

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50'

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* ══ SEKTION 1: Profil-Header ══════════════════════════════ */}
        <section className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full btn-primary flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {initial}
          </div>

          {/* Info */}
          <div className="pt-1 flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">
              {profile?.display_name}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5 truncate">{email}</p>
            {memberSince && (
              <p className="text-xs text-gray-400 mt-1">Mitglied seit {memberSince}</p>
            )}

            {/* Stripe-Status */}
            {isProvider && (
              <div className="mt-3">
                {profile?.stripe_onboarding_complete ? (
                  <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-medium">
                    ✓ Zahlungen aktiv
                  </span>
                ) : (
                  <div>
                    {stripeError && (
                      <p className="text-xs text-red-600 mb-2">{stripeError}</p>
                    )}
                    <button
                      onClick={handleStripeOnboard}
                      disabled={stripeLoading}
                      className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {stripeLoading ? 'Weiterleitung …' : '⚡ Stripe einrichten'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {isAdmin && (
              <Link href="/admin" className="inline-block mt-2 text-xs text-purple-600 hover:underline">
                Admin-Bereich →
              </Link>
            )}
          </div>
        </section>

        {/* ══ SEKTION 2: Persönliche Daten ════════════════════════ */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Persönliche Daten</h2>
          <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100">
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Anzeigename
              </label>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className={inputCls}
                placeholder="Wie soll dein Name angezeigt werden?"
              />
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                E-Mail
              </label>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Standort
              </label>
              <input
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                className={inputCls}
                placeholder="z.B. Hannover, Niedersachsen"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Wird für die Entfernungsberechnung bei Buchungen verwendet.
              </p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              {formSaved && (
                <span className="text-sm text-green-600 font-medium">✓ Gespeichert</span>
              )}
              {!formSaved && <span />}
              <button
                onClick={handleSaveProfile}
                disabled={formSaving}
                className="text-sm px-5 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {formSaving ? 'Wird gespeichert …' : 'Speichern'}
              </button>
            </div>
          </div>
        </section>

        {/* ══ SEKTION 3: Buchungen ═════════════════════════════════ */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Buchungen
              {customerBookings.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({customerBookings.length}{pending > 0 ? `, ${pending} ausstehend` : ''})
                </span>
              )}
            </h2>
            {customerBookings.length > 0 && (
              <Link href="/mein-bereich/anfragen" className="text-sm text-purple-700 hover:underline">
                Alle anzeigen
              </Link>
            )}
          </div>

          {customerBookings.length === 0 ? (
            <div className="border border-gray-200 rounded-2xl p-10 text-center">
              <p className="text-gray-400 text-sm mb-4">Noch nichts gebucht.</p>
              <Link
                href="/marktplatz"
                className="text-sm px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                Marktplatz entdecken
              </Link>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100">
              {customerBookings.map((b) => {
                const s = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending
                const datum = new Date(b.event_date).toLocaleDateString('de-DE', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                const preis = b.amount_cents
                  ? (b.amount_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  : null

                return (
                  <div key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {b.listings?.title ?? 'Gelöschtes Angebot'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {datum}{preis ? ` · ${preis}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium shrink-0 ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
              <div className="px-5 py-3">
                <Link
                  href="/mein-bereich/anfragen"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Alle Anfragen & Buchungen anzeigen →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ══ SEKTION 4: Angebote ══════════════════════════════════ */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Angebote
              {listings.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({listings.length})</span>
              )}
            </h2>
            {listings.length > 0 && (
              <div className="flex items-center gap-4">
                <Link href="/anbieter/listings" className="text-sm text-purple-700 hover:underline">
                  Alle verwalten
                </Link>
                <Link
                  href="/anbieter/listings/neu"
                  className="text-sm px-4 py-1.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  + Neues Angebot
                </Link>
              </div>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="border border-gray-200 rounded-2xl p-10 text-center">
              <p className="text-gray-400 text-sm mb-1">Noch kein Angebot erstellt.</p>
              <p className="text-xs text-gray-400 mb-4">
                Biete deine Leistung an — Fahrgeschäfte, Gastro, Musik und mehr.
              </p>
              <Link
                href="/anbieter/listings/neu"
                className="text-sm px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                + Erstes Angebot erstellen
              </Link>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-2xl divide-y divide-gray-100">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {KATEGORIE_LABEL[l.category] ?? l.category}
                    </p>
                  </div>
                  {/* Aktiv-Toggle */}
                  <button
                    onClick={() => toggleListing(l.id, l.is_active)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-1 ${
                      l.is_active ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                    title={l.is_active ? 'Aktiv — klicken zum Deaktivieren' : 'Inaktiv — klicken zum Aktivieren'}
                    aria-checked={l.is_active}
                    role="switch"
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        l.is_active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <Link
                    href={`/anbieter/listings/${l.id}/bearbeiten`}
                    className="text-sm text-gray-400 hover:text-gray-700 shrink-0 transition-colors"
                  >
                    Bearbeiten
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
