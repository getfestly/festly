'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIE_LABEL, formatRegion } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'
import { formatPreis, formatPreisDetail } from '@/lib/pricing'

export default function AngebotDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: listing } = await supabase
        .from('listings')
        .select('*, profiles(display_name)')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (!listing) { router.replace('/marktplatz'); return }
      setListing(listing)
      trackEvent('listing_detail_viewed', {
        listing_id:  listing.id,
        category:    listing.category,
        provider_id: listing.provider_id,
      })

      const { data: bookingIds } = await supabase
        .from('bookings')
        .select('id')
        .eq('listing_id', id)
        .eq('status', 'completed')

      if (bookingIds && bookingIds.length > 0) {
        const ids = bookingIds.map((b) => b.id)
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('rating, comment, created_at, profiles(display_name)')
          .in('booking_id', ids)
          .order('created_at', { ascending: false })
        setReviews(reviewData ?? [])
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: completed } = await supabase
          .from('bookings')
          .select('id')
          .eq('listing_id', id)
          .eq('customer_id', user.id)
          .eq('status', 'completed')
          .maybeSingle()
        setHasCompletedBooking(!!completed)
      } else {
        setCurrentUser(false)
      }

      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
          <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const photos = listing.photos ?? []
  const anbieterName = listing.profiles?.display_name ?? 'Unbekannt'
  const preis = formatPreis(listing)
  const preisDetail = formatPreisDetail(listing)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/marktplatz" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zum Marktplatz
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-5">
          {photos.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[activePhoto]}
                alt={listing.title}
                className="w-full h-56 object-cover"
              />
              {photos.length > 1 && (
                <div className="flex gap-2 px-3 py-2.5 bg-gray-50 overflow-x-auto">
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActivePhoto(i)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === activePhoto
                          ? 'border-pink-500'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-5xl text-gray-300">
              🎪
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 mb-2 inline-block">
                  {KATEGORIE_LABEL[listing.category] ?? listing.category}
                </span>
                <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
                {avgRating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400 text-sm">★</span>
                    <span className="text-sm text-gray-600">
                      {avgRating} ({reviews.length} Bewertung{reviews.length !== 1 ? 'en' : ''})
                    </span>
                  </div>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-gray-900">{preis}</p>
                {preisDetail !== preis && (
                  <p className="text-xs text-gray-400 mt-0.5">{preisDetail}</p>
                )}
              </div>
            </div>

            {listing.description && (
              <p className="text-gray-600 leading-relaxed mb-4">{listing.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 pt-4 border-t border-gray-100">
              <span>Anbieter: <span className="text-gray-900 font-medium">{anbieterName}</span></span>
              {listing.region && (
                <span>Region: <span className="text-gray-900 font-medium">{formatRegion(listing.region)}</span></span>
              )}
            </div>
          </div>
        </div>

        {/* Anfragen-Bereich */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5">
          {currentUser === false && (
            <div className="text-center">
              <p className="text-gray-500 mb-4">Melde dich an, um dieses Angebot anzufragen.</p>
              <Link
                href="/login"
                className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors inline-block"
              >
                Jetzt einloggen
              </Link>
            </div>
          )}
          {currentUser && (
            <div className="text-center">
              <p className="text-gray-700 font-medium mb-1">Interesse an diesem Angebot?</p>
              <p className="text-gray-400 text-sm mb-4">
                Der Anbieter antwortet dir direkt — noch keine Zahlung.
              </p>
              <Link
                href={`/angebote/${id}/anfragen`}
                className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors inline-block"
              >
                Anfragen
              </Link>
            </div>
          )}
        </div>

        {/* Bewertungen */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Bewertungen {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {currentUser && (
              <Link
                href={`/angebote/${id}/bewerten`}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                {hasCompletedBooking ? '+ Bewertung schreiben' : 'Bewertung hinterlassen'}
              </Link>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">Noch keine Bewertungen vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-sm">
                      {'★'.repeat(r.rating)}
                      <span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                    </span>
                    <span className="text-sm text-gray-500">{r.profiles?.display_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(r.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
