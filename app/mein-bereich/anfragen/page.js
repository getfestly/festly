'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const STATUS_LABEL = {
  pending:   { label: 'Ausstehend',  bg: 'bg-amber-100',  text: 'text-amber-700' },
  accepted:  { label: 'Angenommen', bg: 'bg-green-100',  text: 'text-green-700' },
  rejected:  { label: 'Abgelehnt',  bg: 'bg-red-100',    text: 'text-red-600'   },
  paid:      { label: 'Bezahlt',    bg: 'bg-blue-100',   text: 'text-blue-700'  },
  completed: { label: 'Abgeschlossen', bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { label: 'Storniert',  bg: 'bg-gray-100',   text: 'text-gray-500'  },
}

export default function AnfragenPage() {
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      setRole(profile?.role)
      setUserId(user.id)

      const column = profile?.role === 'provider' ? 'provider_id' : 'customer_id'
      const { data } = await supabase
        .from('bookings')
        .select(`
          id, status, event_date, amount_cents, commission_cents, provider_payout_cents,
          created_at,
          listings(title, category),
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
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', bookingId)

    if (!error) {
      setBookings((b) => b.map((x) => x.id === bookingId ? { ...x, status: newStatus } : x))
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/mein-bereich" className="text-sm text-gray-400 hover:text-gray-600 block mb-1">
            ← Mein Bereich
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'provider' ? 'Eingegangene Anfragen' : 'Meine Buchungsanfragen'}
          </h1>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400">
              {role === 'provider'
                ? 'Noch keine Anfragen eingegangen.'
                : 'Du hast noch keine Buchungsanfragen gestellt.'}
            </p>
            {role === 'customer' && (
              <Link href="/marktplatz" className="text-gray-900 font-medium underline mt-3 inline-block">
                Zum Marktplatz
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const s = STATUS_LABEL[booking.status] ?? STATUS_LABEL.pending
              const preis = (booking.amount_cents / 100).toLocaleString('de-DE', {
                style: 'currency', currency: 'EUR',
              })
              const datum = new Date(booking.event_date).toLocaleDateString('de-DE', {
                day: '2-digit', month: 'long', year: 'numeric',
              })

              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-5">
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
                    </div>
                    <span className={`text-xs rounded-full px-2.5 py-1 font-medium shrink-0 ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span>Event: <span className="text-gray-900 font-medium">{datum}</span></span>
                    <span>Gesamt: <span className="text-gray-900 font-medium">{preis}</span></span>
                    {role === 'provider' && booking.provider_payout_cents > 0 && (
                      <span>Auszahlung (85 %): <span className="text-gray-900 font-medium">
                        {(booking.provider_payout_cents / 100).toLocaleString('de-DE', {
                          style: 'currency', currency: 'EUR',
                        })}
                      </span></span>
                    )}
                  </div>

                  {/* Anbieter-Aktionen */}
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

                  {/* Kunden-Aktion: Stornieren wenn pending */}
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
      </div>
    </main>
  )
}
