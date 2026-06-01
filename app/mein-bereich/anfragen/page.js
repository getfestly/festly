'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const STATUS_LABEL = {
  pending:   { label: 'Ausstehend',     bg: 'bg-amber-100',  text: 'text-amber-700' },
  accepted:  { label: 'Angenommen',    bg: 'bg-green-100',  text: 'text-green-700' },
  rejected:  { label: 'Abgelehnt',     bg: 'bg-red-100',    text: 'text-red-600'   },
  paid:      { label: 'Bezahlt',       bg: 'bg-blue-100',   text: 'text-blue-700'  },
  completed: { label: 'Abgeschlossen', bg: 'bg-gray-100',   text: 'text-gray-600'  },
  cancelled: { label: 'Storniert',     bg: 'bg-gray-100',   text: 'text-gray-500'  },
}

// Menge leserlich darstellen, z.B. "3 Personen", "2 Stunden"
function formatQuantity(booking) {
  const qty = booking.quantity ?? 1
  const unit = booking.listings?.price_unit_label
  switch (booking.price_model) {
    case 'per_person': return `${qty} ${unit ?? 'Person(en)'}`
    case 'flat_plus':  return `${qty} ${unit ?? 'Einheit(en)'}`
    case 'hourly':     return `${qty} ${unit ?? 'Stunde(n)'}`
    default:           return null
  }
}

export default function AnfragenPage() {
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      setRole(profile?.role)

      const column = profile?.role === 'provider' ? 'provider_id' : 'customer_id'
      const { data } = await supabase
        .from('bookings')
        .select(`
          id, status, event_date, amount_cents, commission_cents, provider_payout_cents,
          quantity, price_model, price_snapshot_cents, updated_at,
          created_at,
          listings(title, category, price_unit_label),
          customer:profiles!bookings_customer_id_fkey(display_name),
          provider:profiles!bookings_provider_id_fkey(display_name)
        `)
        .eq(column, user.id)
        .order('created_at', { ascending: false })

      setBookings(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleStatus(bookingId, newStatus) {
    const { error } = await supabase
      .from('bookings').update({ status: newStatus }).eq('id', bookingId)
    if (!error) {
      setBookings((b) => b.map((x) => x.id === bookingId ? { ...x, status: newStatus } : x))
    }
  }

  async function handleComplete(bookingId) {
    const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' })
    const data = await res.json()
    if (!data.error) {
      setBookings((b) => b.map((x) => x.id === bookingId
        ? { ...x, status: 'completed', updated_at: new Date().toISOString() }
        : x
      ))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {role === 'provider' ? 'Eingegangene Anfragen' : 'Meine Buchungsanfragen'}
        </h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              📋
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {role === 'provider' ? 'Noch keine Anfragen' : 'Keine Buchungsanfragen'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {role === 'provider'
                ? 'Wenn Kunden deine Angebote anfragen, erscheinen sie hier.'
                : 'Entdecke Angebote auf dem Marktplatz und stelle deine erste Anfrage.'}
            </p>
            {role === 'customer' && (
              <Link
                href="/marktplatz"
                className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Zum Marktplatz
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const s = STATUS_LABEL[booking.status] ?? STATUS_LABEL.pending
              const gesamtpreis = (booking.amount_cents / 100).toLocaleString('de-DE', {
                style: 'currency', currency: 'EUR',
              })
              const auszahlungCents = booking.provider_payout_cents > 0
                ? booking.provider_payout_cents
                : Math.round(booking.amount_cents * 0.85)
              const auszahlung = (auszahlungCents / 100).toLocaleString('de-DE', {
                style: 'currency', currency: 'EUR',
              })
              const datum = new Date(booking.event_date).toLocaleDateString('de-DE', {
                day: '2-digit', month: 'long', year: 'numeric',
              })
              const mengeText = formatQuantity(booking)

              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {booking.listings?.title ?? 'Gelöschtes Angebot'}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {role === 'provider'
                          ? `Kunde: ${booking.customer?.display_name}`
                          : `Anbieter: ${booking.provider?.display_name}`}
                      </p>
                      {mengeText && (
                        <p className="text-sm text-gray-400 mt-0.5">{mengeText}</p>
                      )}
                    </div>
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium shrink-0 ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Event: <span className="text-gray-900 font-medium">{datum}</span>
                    </p>

                    {booking.price_model === 'on_request' ? (
                      <p className="text-sm text-gray-400 italic">Preis auf Anfrage</p>
                    ) : role === 'provider' ? (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                          {booking.status === 'completed' ? 'Ausgezahlt' : 'Deine Auszahlung'}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{auszahlung}</p>
                        {booking.status === 'completed' ? (
                          <p className="text-xs text-gray-400 mt-1">
                            Ausgezahlt am {new Date(booking.updated_at).toLocaleDateString('de-DE', {
                              day: '2-digit', month: 'long', year: 'numeric',
                            })}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">
                            Buchungswert {gesamtpreis}{' '}abzgl. 15&nbsp;% Festly-Gebühr
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Gesamtpreis</p>
                        <p className="text-xl font-bold text-gray-900">{gesamtpreis}</p>
                        {booking.price_model === 'flat_plus' && (
                          <p className="text-xs text-gray-400 mt-1">
                            Grundpreis · Aufpreis für {mengeText ?? 'Einheiten'} folgt vom Anbieter
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {role === 'provider' && booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatus(booking.id, 'accepted')}
                        className="flex-1 bg-gray-900 text-white rounded-xl py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        Annehmen
                      </button>
                      <button
                        onClick={() => handleStatus(booking.id, 'rejected')}
                        className="flex-1 border border-red-200 text-red-600 rounded-xl py-2 text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Ablehnen
                      </button>
                    </div>
                  )}

                  {/* Kunde: Zahlung freigeben (Event vorbei, Status bezahlt) */}
                  {role === 'customer' && booking.status === 'paid' && booking.event_date < new Date().toISOString().split('T')[0] && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      className="w-full bg-gray-900 text-white rounded-xl py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Event war super – Zahlung freigeben
                    </button>
                  )}

                  {/* Kunde: Jetzt bezahlen (wenn Anbieter angenommen hat) */}
                  {role === 'customer' && booking.status === 'accepted' && booking.price_model !== 'on_request' && (
                    <Link
                      href={`/buchungen/${booking.id}/bezahlen`}
                      className="w-full block text-center bg-gray-900 text-white rounded-xl py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Jetzt bezahlen
                    </Link>
                  )}

                  {/* Kunde: Bezahlt-Badge */}
                  {role === 'customer' && booking.status === 'paid' && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
                        ✓ Bezahlt
                      </span>
                    </div>
                  )}

                  {/* Kunde: Anfrage zurückziehen (nur solange pending) */}
                  {role === 'customer' && booking.status === 'pending' && (
                    <button
                      onClick={() => handleStatus(booking.id, 'cancelled')}
                      className="w-full border border-gray-200 text-gray-500 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Anfrage zurückziehen
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
