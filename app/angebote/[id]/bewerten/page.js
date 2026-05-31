'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function BewertungPage() {
  const { id: listingId } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [bookingId, setBookingId] = useState(null)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'customer') { router.replace(`/angebote/${listingId}`); return }

      const { data: listing } = await supabase
        .from('listings').select('id, title').eq('id', listingId).single()
      if (!listing) { router.replace('/marktplatz'); return }

      setUser(user)
      setListing(listing)

      // Versuche, eine abgeschlossene Buchung zu finden
      const { data: booking } = await supabase
        .from('bookings')
        .select('id')
        .eq('listing_id', listingId)
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle()

      setBookingId(booking?.id ?? null)
    }
    check()
  }, [listingId, router])

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) { setError('Bitte wähle eine Sternebewertung.'); return }
    if (!bookingId) {
      setError('Es wurde keine abgeschlossene Buchung für dieses Angebot gefunden.')
      return
    }
    setError(null)
    setLoading(true)

    const { error: reviewError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: user.id,
      rating,
      comment: comment.trim() || null,
    })

    if (reviewError) {
      // Unique-Constraint: Bewertung schon abgegeben
      if (reviewError.code === '23505') {
        setError('Du hast dieses Angebot bereits bewertet.')
      } else {
        setError(reviewError.message)
      }
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </main>
    )
  }

  if (done) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">⭐</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bewertung gespeichert!</h1>
          <p className="text-gray-500 mb-6">Danke für dein Feedback.</p>
          <Link
            href={`/angebote/${listingId}`}
            className="text-gray-900 font-medium underline"
          >
            Zurück zum Angebot
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Link href={`/angebote/${listingId}`} className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zum Angebot
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bewertung abgeben</h1>
        <p className="text-gray-500 mb-8">{listing.title}</p>

        {!bookingId && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
            <p className="text-amber-700 text-sm">
              Kein abgeschlossener Auftrag gefunden. Du kannst jetzt trotzdem eine Bewertung schreiben —
              sie wird gespeichert, sobald eine passende Buchung (Status: abgeschlossen) existiert.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          {/* Sternebewertung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Bewertung *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} Stern${star > 1 ? 'e' : ''}`}
                >
                  <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-200'}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {['', 'Sehr schlecht', 'Schlecht', 'Ok', 'Gut', 'Sehr gut'][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kommentar <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Wie war deine Erfahrung mit diesem Anbieter?"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading || rating === 0}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert …' : 'Bewertung abgeben'}
          </button>
        </form>
      </div>
    </main>
  )
}
