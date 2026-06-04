'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { eur } from '@/lib/pricing'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

// ---------------------------------------------------------------------------
// Inneres Formular — braucht Elements-Kontext
// ---------------------------------------------------------------------------
function CheckoutForm({ bookingId, amount_cents }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    try {
      const { error: stripeErr } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/buchungen/${bookingId}/bezahlen/danke`,
        },
      })

      // Bei Fehler: Stripe leitet NICHT weiter, wir zeigen die Meldung
      if (stripeErr) {
        setError(stripeErr.message)
      }
      // Bei Erfolg: Stripe leitet automatisch zur return_url weiter
    } catch (err) {
      console.error('[Bezahlen] Fehler:', err)
      setError('Zahlung konnte nicht verarbeitet werden.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <p className="text-sm text-gray-500 mb-1">Zu zahlender Betrag</p>
        <p className="text-2xl font-bold text-gray-900">{eur(amount_cents)}</p>
        <p className="text-xs text-gray-400 mt-1">Sicher bezahlt via Stripe — Treuhand bis zur Event-Freigabe</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <PaymentElement />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Zahlung wird verarbeitet …' : `${eur(amount_cents)} jetzt bezahlen`}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Testkarte: 4242 4242 4242 4242 · beliebiges Datum und CVC
      </p>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Haupt-Seitenkomponente
// ---------------------------------------------------------------------------
export default function BezahlenPage() {
  const { id: bookingId } = useParams()
  const [clientSecret, setClientSecret] = useState(null)
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!bookingId) return
    async function init() {
      const res = await fetch('/api/stripe/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setClientSecret(data.clientSecret)
      setBooking(data.booking)
    }
    init()
  }, [bookingId])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto px-4 py-8">
        <Link href="/mein-bereich/anfragen" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zu meinen Anfragen
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Zahlung abschließen</h1>
        {booking?.title && (
          <p className="text-gray-500 mb-8">{booking.title}</p>
        )}

        {error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-red-600 text-sm">{error}</p>
            <Link href="/mein-bereich/anfragen" className="text-sm text-gray-500 underline mt-3 inline-block">
              Zurück
            </Link>
          </div>
        ) : !clientSecret ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-gray-400">Zahlung wird vorbereitet …</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, locale: 'de' }}
            >
              <CheckoutForm bookingId={bookingId} amount_cents={booking?.amount_cents ?? 0} />
            </Elements>
          </div>
        )}
      </main>
    </div>
  )
}
