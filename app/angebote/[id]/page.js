'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIE_LABEL } from '@/lib/constants'

export default function AngebotDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [currentUser, setCurrentUser] = useState(null) // null = unbekannt, false = nicht eingeloggt
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Listing + Anbieter-Name laden
      const { data: listing } = await supabase
        .from('listings')
        .select('*, profiles(display_name)')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (!listing) { router.replace('/marktplatz'); return }
      setListing(listing)

      // Bewertungen laden
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, comment, created_at, profiles(display_name)')
        .eq('booking_id', id) // wird in Feature 5 korrekt verknüpft
        .order('created_at', { ascending: false })
      // Bewertungen sind an bookings geknüpft, nicht direkt an listings.
      // Wird in Feature 5 korrekt geladen (separate Abfrage über bookings).
      setReviews([]) // Platzhalter — Feature 5 füllt das

      // Eingeloggten Nutzer prüfen
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        setUserRole(profile?.role ?? null)
      } else {
        setCurrentUser(false)
      }

      setLoading(false)
    }
    load()
  }, [id, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </main>
    )
  }

  const anbieterName = listing.profiles?.display_name ?? 'Unbekannt'
  const preis = (listing.price_cents / 100).toLocaleString('de-DE', {
    style: 'currency', currency: 'EUR',
  })

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/marktplatz" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zum Marktplatz
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
          {/* Foto(s) */}
          {listing.photos?.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-56 object-cover"
            />
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
              </div>
              <p className="text-2xl font-bold text-gray-900 shrink-0">{preis}</p>
            </div>

            {listing.description && (
              <p className="text-gray-600 leading-relaxed mb-4">{listing.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 pb-4 border-b border-gray-100">
              <span>Anbieter: <span className="text-gray-900 font-medium">{anbieterName}</span></span>
              {listing.region && (
                <span>Region: <span className="text-gray-900 font-medium">{listing.region}</span></span>
              )}
            </div>
          </div>
        </div>

        {/* Anfragen-Bereich */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          {currentUser === false && (
            <div className="text-center">
              <p className="text-gray-500 mb-4">Melde dich an, um dieses Angebot anzufragen.</p>
              <Link
                href="/login"
                className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors"
              >
                Jetzt einloggen
              </Link>
            </div>
          )}
          {currentUser && userRole === 'customer' && (
            <div className="text-center">
              <p className="text-gray-700 font-medium mb-1">Interesse an diesem Angebot?</p>
              <p className="text-gray-400 text-sm mb-4">Stelle eine Buchungsanfrage — der Anbieter antwortet dir direkt.</p>
              <Link
                href={`/angebote/${id}/anfragen`}
                className="bg-gray-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-gray-700 transition-colors inline-block"
              >
                Anfragen
              </Link>
            </div>
          )}
          {currentUser && userRole === 'provider' && (
            <p className="text-center text-sm text-gray-400">
              Als Anbieter kannst du keine Buchungsanfragen stellen.
            </p>
          )}
        </div>

        {/* Bewertungen — Feature 5 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Bewertungen</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">Noch keine Bewertungen vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className="text-sm text-gray-500">{r.profiles?.display_name}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
