import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { ADMIN_USER_ID } from '@/lib/admin'
import Nav from '@/components/Nav'
import Link from 'next/link'
import { KATEGORIE_LABEL } from '@/lib/constants'
import { formatPreis } from '@/lib/pricing'
import FilterSection from './FilterSection'

const FIELDS = 'id, title, description, category, price_cents, price_model, price_unit_label, region, photos'

async function fetchHighlights() {
  const supabase = await createSupabaseServer()
  const admin = createAdminClient()

  // Eingeloggter Nutzer + Rolle
  const { data: { user } } = await supabase.auth.getUser()
  let userRole = null
  let userId = null
  if (user) {
    userId = user.id
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? null
  }

  // Sektion 1: Neu auf Festly
  const { data: neueListings } = await supabase
    .from('listings')
    .select(FIELDS)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  // Sektion 2: Oft gebucht — admin client nötig (bookings RLS nur für Beteiligte)
  const { data: allBookings } = await admin
    .from('bookings')
    .select('listing_id')
    .neq('status', 'cancelled')
    .not('listing_id', 'is', null)

  const countMap = {}
  for (const { listing_id } of allBookings ?? []) {
    countMap[listing_id] = (countMap[listing_id] ?? 0) + 1
  }
  const topBookedIds = Object.entries(countMap)
    .filter(([, n]) => n > 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([id]) => id)

  let oftGebucht = []
  if (topBookedIds.length > 0) {
    const { data } = await supabase
      .from('listings').select(FIELDS).in('id', topBookedIds).eq('is_active', true)
    oftGebucht = (data ?? []).sort((a, b) => (countMap[b.id] ?? 0) - (countMap[a.id] ?? 0))
  }

  // Sektion 3: Top bewertet — reviews sind public (RLS: true)
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('listing_id, rating')
    .not('listing_id', 'is', null)

  const ratingMap = {}
  for (const { listing_id, rating } of allReviews ?? []) {
    if (!ratingMap[listing_id]) ratingMap[listing_id] = { sum: 0, count: 0 }
    ratingMap[listing_id].sum += rating
    ratingMap[listing_id].count++
  }
  const topRatedIds = Object.entries(ratingMap)
    .filter(([, { count }]) => count >= 3)
    .sort(([, a], [, b]) => b.sum / b.count - a.sum / a.count)
    .slice(0, 4)
    .map(([id]) => id)

  let topBewertet = []
  if (topRatedIds.length > 0) {
    const { data } = await supabase
      .from('listings').select(FIELDS).in('id', topRatedIds).eq('is_active', true)
    topBewertet = (data ?? []).sort((a, b) => {
      const avgA = ratingMap[a.id] ? ratingMap[a.id].sum / ratingMap[a.id].count : 0
      const avgB = ratingMap[b.id] ? ratingMap[b.id].sum / ratingMap[b.id].count : 0
      return avgB - avgA
    })
  }

  return {
    neueListings: neueListings ?? [],
    oftGebucht,
    topBewertet,
    userRole,
    userId,
  }
}

function QuickActions({ role, isAdmin }) {
  if (!role) return null

  const btn = 'flex items-center gap-2 bg-purple-600 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-purple-700 active:bg-purple-800 transition-colors whitespace-nowrap'

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {isAdmin ? (
        <>
          <Link href="/admin"                   className={btn}>⚙️ Admin-Bereich</Link>
          <Link href="/mein-bereich/anfragen"   className={btn}>📋 Anfragen</Link>
        </>
      ) : role === 'provider' ? (
        <>
          <Link href="/anbieter/listings/neu"   className={btn}>➕ Angebot erstellen</Link>
          <Link href="/mein-bereich/anfragen"   className={btn}>📋 Meine Anfragen</Link>
        </>
      ) : (
        <Link href="/mein-bereich/anfragen"     className={btn}>📋 Meine Anfragen</Link>
      )}
    </div>
  )
}

function HighlightCard({ listing, border }) {
  return (
    <Link
      href={`/angebote/${listing.id}`}
      className={`flex-shrink-0 w-52 bg-white rounded-2xl border-2 overflow-hidden hover:shadow-md transition-all group ${border}`}
    >
      <div className="h-28 bg-gray-100 overflow-hidden">
        {listing.photos?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
            🎪
          </div>
        )}
      </div>
      <div className="p-3">
        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
          {KATEGORIE_LABEL[listing.category] ?? listing.category}
        </span>
        <p className="font-semibold text-gray-900 text-sm leading-snug mt-1.5 line-clamp-2">
          {listing.title}
        </p>
        <p className="font-bold text-gray-900 text-sm mt-1.5">{formatPreis(listing)}</p>
      </div>
    </Link>
  )
}

function HighlightSection({ title, listings, border }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {listings.map((listing) => (
          <HighlightCard key={listing.id} listing={listing} border={border} />
        ))}
      </div>
    </div>
  )
}

export default async function MarktplatzPage() {
  const { neueListings, oftGebucht, topBewertet, userRole, userId } = await fetchHighlights()

  const hasHighlights = neueListings.length > 0 || oftGebucht.length > 0 || topBewertet.length > 0
  const isAdmin = userId === ADMIN_USER_ID

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marktplatz</h1>

        <QuickActions role={userRole} isAdmin={isAdmin} />

        {neueListings.length > 0 && (
          <HighlightSection title="✨ Neu auf Festly"  listings={neueListings} border="border-blue-300" />
        )}
        {oftGebucht.length > 0 && (
          <HighlightSection title="🔥 Oft gebucht"    listings={oftGebucht}   border="border-orange-300" />
        )}
        {topBewertet.length > 0 && (
          <HighlightSection title="⭐ Top bewertet"   listings={topBewertet}  border="border-yellow-400" />
        )}

        {hasHighlights && (
          <div className="border-t border-gray-200 mb-6 pt-6">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Alle Angebote</p>
          </div>
        )}

        <FilterSection />
      </main>
    </div>
  )
}
