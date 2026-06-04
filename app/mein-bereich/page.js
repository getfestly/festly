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

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${s.cls}`}>
      {s.label}
    </span>
  )
}

function EditableField({ label, value, onSave, placeholder = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(draft)
    setSaving(false)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(value ?? '')
    setEditing(false)
  }

  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      {editing ? (
        <div className="flex gap-2 items-center">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder={placeholder}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '…' : 'Speichern'}
          </button>
          <button
            onClick={handleCancel}
            className="text-xs px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <p className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">{placeholder || 'Nicht angegeben'}</span>}</p>
          <button
            onClick={() => { setDraft(value ?? ''); setEditing(true) }}
            className="text-xs text-gray-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Bearbeiten
          </button>
        </div>
      )}
    </div>
  )
}

export default function MeinBereichPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customerBookings, setCustomerBookings] = useState([])
  const [listings, setListings] = useState([])
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setEmail(user.email)
      setUserId(user.id)

      const [profileRes, bookingsRes, listingsRes] = await Promise.all([
        supabase.from('profiles')
          .select('display_name, role, stripe_account_id, stripe_onboarding_complete, location_address')
          .eq('id', user.id).single(),
        supabase.from('bookings')
          .select('id, status, event_date, amount_cents, listings(title, category)')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('listings')
          .select('id, title, category, is_active')
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      setProfile(profileRes.data)
      setCustomerBookings(bookingsRes.data ?? [])
      setListings(listingsRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function saveField(field, value) {
    await supabase.from('profiles').update({ [field]: value }).eq('id', userId)
    setProfile((p) => ({ ...p, [field]: value }))
  }

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
  const isProvider = profile?.role === 'provider' || listings.length > 0
  const pendingCount = customerBookings.filter((b) => ['pending', 'accepted'].includes(b.status)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── SEKTION 1: Profil ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full btn-primary flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile?.display_name}</h1>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-gray-50">
            <div className="pt-0">
              <EditableField
                label="Anzeigename"
                value={profile?.display_name}
                placeholder="Wie soll dein Name angezeigt werden?"
                onSave={(v) => saveField('display_name', v)}
              />
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-400 mb-0.5">E-Mail</p>
              <p className="text-sm text-gray-500">{email}</p>
            </div>

            <div className="pt-4">
              <EditableField
                label="Standort"
                value={profile?.location_address}
                placeholder="z.B. Hannover, Niedersachsen"
                onSave={(v) => saveField('location_address', v)}
              />
            </div>

            {/* Stripe Connect — nur für Anbieter */}
            {isProvider && (
              <div className="pt-4">
                <p className="text-xs text-gray-400 mb-2">Auszahlungskonto</p>
                {profile?.stripe_onboarding_complete ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
                      ✓ Zahlungen aktiviert
                    </span>
                    <span className="text-xs text-gray-400">Stripe verbunden</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      Verbinde dein Konto mit Stripe, um Zahlungen zu empfangen.
                    </p>
                    {stripeError && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">
                        {stripeError}
                      </p>
                    )}
                    <button
                      onClick={handleStripeOnboard}
                      disabled={stripeLoading}
                      className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {stripeLoading ? 'Weiterleitung …' : 'Jetzt einrichten'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin-Link */}
            {isAdmin && (
              <div className="pt-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 text-sm text-purple-700 hover:text-purple-900 font-medium"
                >
                  ⚙️ Admin-Bereich öffnen
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── SEKTION 2: Meine Buchungen (als Kunde) ───────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900">Meine Buchungen</h2>
              {pendingCount > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">{pendingCount} ausstehend</p>
              )}
            </div>
            <Link
              href="/mein-bereich/anfragen"
              className="text-sm text-purple-700 hover:text-purple-900 font-medium"
            >
              Alle anzeigen →
            </Link>
          </div>

          {customerBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                📋
              </div>
              <p className="text-sm text-gray-500 mb-4">Noch keine Buchungen getätigt.</p>
              <Link
                href="/marktplatz"
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                Marktplatz entdecken
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {customerBookings.map((b) => {
                const datum = new Date(b.event_date).toLocaleDateString('de-DE', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })
                const preis = b.amount_cents
                  ? (b.amount_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                  : null

                return (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {b.listings?.title ?? 'Gelöschtes Angebot'}
                      </p>
                      <p className="text-xs text-gray-400">{datum}{preis ? ` · ${preis}` : ''}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                )
              })}
              <Link
                href="/mein-bereich/anfragen"
                className="block text-center text-sm text-gray-500 hover:text-gray-900 pt-1 transition-colors"
              >
                Alle Anfragen anzeigen →
              </Link>
            </div>
          )}
        </div>

        {/* ── SEKTION 3: Meine Angebote (als Anbieter) ─────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Meine Angebote</h2>
            <div className="flex gap-2">
              {listings.length > 0 && (
                <Link
                  href="/anbieter/listings"
                  className="text-sm text-purple-700 hover:text-purple-900 font-medium"
                >
                  Alle verwalten →
                </Link>
              )}
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                🏷️
              </div>
              <p className="text-sm text-gray-500 mb-2">Du hast noch kein Angebot erstellt.</p>
              <p className="text-xs text-gray-400 mb-4">
                Biete deine Leistung an — Fahrgeschäfte, Gastro, Musik und mehr.
              </p>
              <Link
                href="/anbieter/listings/neu"
                className="text-sm px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                Erstes Angebot erstellen
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400">{KATEGORIE_LABEL[l.category] ?? l.category}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {l.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                    <Link
                      href={`/anbieter/listings/${l.id}/bearbeiten`}
                      className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Bearbeiten
                    </Link>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Link
                  href="/anbieter/listings"
                  className="flex-1 text-center text-sm px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:border-gray-300 transition-colors"
                >
                  Alle verwalten
                </Link>
                <Link
                  href="/anbieter/listings/neu"
                  className="flex-1 text-center text-sm px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                >
                  + Neues Angebot
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
