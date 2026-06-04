'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BookingChat from '@/components/BookingChat'
import { trackEvent } from '@/lib/analytics'

const STATUS_LABEL = {
  pending:   { label: 'Ausstehend',     bg: 'bg-amber-100',  text: 'text-amber-700' },
  accepted:  { label: 'Angenommen',    bg: 'bg-green-100',  text: 'text-green-700' },
  rejected:  { label: 'Abgelehnt',     bg: 'bg-red-100',    text: 'text-red-600'   },
  paid:      { label: 'Bezahlt',       bg: 'bg-blue-100',   text: 'text-blue-700'  },
  completed: { label: 'Abgeschlossen', bg: 'bg-gray-100',   text: 'text-gray-600'  },
  cancelled: { label: 'Storniert',     bg: 'bg-gray-100',   text: 'text-gray-500'  },
}

const BOOKING_SELECT = `
  id, status, event_date, amount_cents, commission_cents, provider_payout_cents,
  quantity, price_model, price_snapshot_cents, updated_at, cancellation_fee_cents,
  created_at, event_title, event_description,
  listings(title, category, price_unit_label),
  customer:profiles!bookings_customer_id_fkey(display_name),
  provider:profiles!bookings_provider_id_fkey(display_name)
`

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
  const [activeTab, setActiveTab] = useState('customer')
  const [customerBookings, setCustomerBookings] = useState([])
  const [providerBookings, setProviderBookings] = useState([])
  const [listingsCount, setListingsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirmCancel, setConfirmCancel] = useState(null)
  const [userId, setUserId] = useState(null)
  const [openChatId, setOpenChatId] = useState(null)

  const [reviewModal, setReviewModal] = useState(null)
  const [reviewedIds, setReviewedIds] = useState(new Set())
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHovered, setReviewHovered] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const [customerRes, providerRes, listingsRes] = await Promise.all([
        supabase.from('bookings').select(BOOKING_SELECT)
          .eq('customer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select(BOOKING_SELECT)
          .eq('provider_id', user.id).order('created_at', { ascending: false }),
        supabase.from('listings').select('id').eq('provider_id', user.id),
      ])

      const cBookings = customerRes.data ?? []
      setCustomerBookings(cBookings)
      setProviderBookings(providerRes.data ?? [])
      setListingsCount(listingsRes.data?.length ?? 0)

      const completedIds = cBookings.filter(b => b.status === 'completed').map(b => b.id)
      if (completedIds.length > 0) {
        const { data: existing } = await supabase
          .from('reviews').select('booking_id').in('booking_id', completedIds)
        setReviewedIds(new Set(existing?.map(r => r.booking_id) ?? []))
      }

      setLoading(false)
    }
    load()
  }, [router])

  function openReview(booking) {
    setReviewModal({ bookingId: booking.id, listingTitle: booking.listings?.title ?? '' })
    setReviewRating(0)
    setReviewHovered(0)
    setReviewComment('')
    setReviewError(null)
  }

  async function submitReview() {
    if (reviewRating === 0) { setReviewError('Bitte wähle eine Sternebewertung.'); return }
    setReviewLoading(true)
    setReviewError(null)

    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: reviewModal.bookingId,
        rating: reviewRating,
        comment: reviewComment,
      }),
    })

    setReviewLoading(false)
    if (!res.ok) {
      const body = await res.json()
      setReviewError(body.error ?? 'Unbekannter Fehler')
      return
    }

    setReviewedIds(prev => new Set([...prev, reviewModal.bookingId]))
    setReviewModal(null)
  }

  async function handleStatus(bookingId, newStatus) {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (!data.error) {
      setProviderBookings((b) => b.map((x) => x.id === bookingId ? { ...x, status: newStatus } : x))
      const booking = providerBookings.find(b => b.id === bookingId)
      if (newStatus === 'accepted') {
        trackEvent('booking_accepted', { booking_id: bookingId, amount_cents: booking?.amount_cents })
      } else if (newStatus === 'rejected') {
        trackEvent('booking_rejected', { booking_id: bookingId })
      }
    }
  }

  async function handleCancel(bookingId) {
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: 'POST' })
    const data = await res.json()
    if (!data.error) {
      setCustomerBookings((b) => b.map((x) => x.id === bookingId
        ? { ...x, status: 'cancelled', cancellation_fee_cents: data.feeCents }
        : x
      ))
    }
    setConfirmCancel(null)
  }

  async function handleComplete(bookingId) {
    const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' })
    const data = await res.json()
    if (!data.error) {
      setCustomerBookings((b) => b.map((x) => x.id === bookingId
        ? { ...x, status: 'completed', updated_at: new Date().toISOString() }
        : x
      ))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const isProviderView = activeTab === 'provider'
  const bookings = isProviderView ? providerBookings : customerBookings

  const tabCls = (tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-gray-900 text-white'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
            <main className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Anfragen & Buchungen</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
          <button className={tabCls('customer')} onClick={() => setActiveTab('customer')}>
            Als Kunde
          </button>
          <button className={tabCls('provider')} onClick={() => setActiveTab('provider')}>
            Als Anbieter
          </button>
        </div>

        {/* Provider-Tab: keine Listings */}
        {isProviderView && listingsCount === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🏷️
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Angebote erstellt</h3>
            <p className="text-gray-500 text-sm mb-6">
              Erstelle dein erstes Angebot, damit Kunden dich buchen können.
            </p>
            <Link
              href="/anbieter/listings/neu"
              className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Erstes Angebot erstellen
            </Link>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              📋
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {isProviderView ? 'Noch keine Anfragen' : 'Keine Buchungsanfragen'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {isProviderView
                ? 'Wenn Kunden deine Angebote anfragen, erscheinen sie hier.'
                : 'Entdecke Angebote auf dem Marktplatz und stelle deine erste Anfrage.'}
            </p>
            {!isProviderView && (
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
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        {isProviderView && booking.event_title && (
                          <p className="font-bold text-gray-900 mb-0.5">{booking.event_title}</p>
                        )}
                        <p className="font-semibold text-gray-900">
                          {booking.listings?.title ?? 'Gelöschtes Angebot'}
                        </p>
                        {isProviderView && booking.event_description && (
                          <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{booking.event_description}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-0.5">
                          {isProviderView
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
                      ) : isProviderView ? (
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

                    {/* Anbieter-Aktionen */}
                    {isProviderView && booking.status === 'pending' && (
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

                    {/* Kunde: Zahlung freigeben */}
                    {!isProviderView && booking.status === 'paid' && booking.event_date < new Date().toISOString().split('T')[0] && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        className="w-full bg-gray-900 text-white rounded-xl py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        Event war super – Zahlung freigeben
                      </button>
                    )}

                    {/* Kunde: Jetzt bezahlen */}
                    {!isProviderView && booking.status === 'accepted' && booking.price_model !== 'on_request' && (
                      <Link
                        href={`/buchungen/${booking.id}/bezahlen`}
                        className="w-full block text-center bg-gray-900 text-white rounded-xl py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        Jetzt bezahlen
                      </Link>
                    )}

                    {/* Kunde: Bezahlt-Badge + Stornieren */}
                    {!isProviderView && booking.status === 'paid' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm font-medium">
                            ✓ Bezahlt
                          </span>
                        </div>
                        {confirmCancel?.bookingId === booking.id ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-medium text-gray-900">Buchung wirklich stornieren?</p>
                            <p className="text-sm text-gray-500">
                              {confirmCancel.refundCents > 0
                                ? `Du erhältst ${(confirmCancel.refundCents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} zurück (${Math.round(confirmCancel.refundCents / booking.amount_cents * 100)} %).`
                                : 'Keine Rückerstattung (Event in weniger als 3 Tagen).'}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-700 transition-colors"
                              >
                                Stornieren bestätigen
                              </button>
                              <button
                                onClick={() => setConfirmCancel(null)}
                                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const daysUntil = Math.floor(
                                (new Date(booking.event_date) - new Date()) / (1000 * 60 * 60 * 24)
                              )
                              let refundCents = 0
                              if (daysUntil >= 30) refundCents = booking.amount_cents
                              else if (daysUntil >= 14) refundCents = Math.round(booking.amount_cents * 0.5)
                              else if (daysUntil >= 3)  refundCents = Math.round(booking.amount_cents * 0.25)
                              setConfirmCancel({ bookingId: booking.id, refundCents })
                            }}
                            className="w-full border border-gray-200 text-gray-500 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                          >
                            Buchung stornieren
                          </button>
                        )}
                      </div>
                    )}

                    {/* Kunde: Storno-Info */}
                    {!isProviderView && booking.status === 'cancelled' && booking.cancellation_fee_cents != null && (
                      <p className="text-xs text-gray-400">
                        {booking.cancellation_fee_cents < booking.amount_cents && booking.amount_cents > 0
                          ? `Rückerstattet: ${((booking.amount_cents - booking.cancellation_fee_cents) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
                          : 'Keine Rückerstattung'}
                      </p>
                    )}

                    {/* Kunde: Anfrage zurückziehen */}
                    {!isProviderView && booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="w-full border border-gray-200 text-gray-500 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Anfrage zurückziehen
                      </button>
                    )}

                    {/* Kunde: Bewertung */}
                    {!isProviderView && booking.status === 'completed' && (
                      reviewedIds.has(booking.id) ? (
                        <p className="text-xs text-gray-400 text-center py-1">Bewertung abgegeben ✓</p>
                      ) : (
                        <button
                          onClick={() => openReview(booking)}
                          className="w-full border border-gray-200 text-gray-700 rounded-xl py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                          Bewertung hinterlassen
                        </button>
                      )
                    )}

                    {!['cancelled', 'rejected'].includes(booking.status) && (
                      <button
                        type="button"
                        onClick={() => setOpenChatId(openChatId === booking.id ? null : booking.id)}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 border border-gray-100 text-gray-400 rounded-xl py-2 text-sm hover:bg-gray-50 hover:text-gray-600 transition-colors"
                      >
                        💬 {openChatId === booking.id ? 'Chat schließen' : 'Nachricht schreiben'}
                      </button>
                    )}
                  </div>

                  {openChatId === booking.id && (
                    <BookingChat bookingId={booking.id} currentUserId={userId} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Bewertungs-Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Bewertung abgeben</h2>
            <p className="text-sm text-gray-500 mb-5">{reviewModal.listingTitle}</p>

            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star} type="button"
                  onMouseEnter={() => setReviewHovered(star)}
                  onMouseLeave={() => setReviewHovered(0)}
                  onClick={() => setReviewRating(star)}
                  className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} Stern${star > 1 ? 'e' : ''}`}
                >
                  <span className={(reviewHovered || reviewRating) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {reviewRating > 0 && (
              <p className="text-xs text-gray-400 mb-4">
                {['', 'Sehr schlecht', 'Schlecht', 'Ok', 'Gut', 'Sehr gut'][reviewRating]}
              </p>
            )}

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Kommentar (optional)"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
            />

            {reviewError && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                {reviewError}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={submitReview}
                disabled={reviewLoading || reviewRating === 0}
                className="flex-1 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {reviewLoading ? 'Wird gespeichert …' : 'Abgeben'}
              </button>
              <button
                onClick={() => setReviewModal(null)}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
