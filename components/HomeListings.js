'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'

const SORT_TABS = [
  { id: 'neu',     label: 'Neu'          },
  { id: 'beliebt', label: 'Beliebt'      },
  { id: 'top',     label: 'Top bewertet' },
]

function HomeListingsInner({ initialListings, initialRegion, initialDate }) {
  const sp        = useSearchParams()
  const activeKat = sp.get('kategorie') ?? ''

  const [sort, setSort] = useState('neu')
  const [data, setData] = useState({
    neu:     initialListings,
    beliebt: initialListings, // snaps into sorted order after fetch
    top:     initialListings,
  })

  // Sync neu when server re-renders with new date/region filter
  useEffect(() => {
    setData(d => ({ ...d, neu: initialListings }))
  }, [initialListings])

  // On mount: fetch booking counts + review ratings for current listings
  useEffect(() => {
    let cancelled = false
    async function load() {
      const ids = initialListings.map(l => l.id)
      if (!ids.length) return

      const [bookingRes, reviewRes] = await Promise.all([
        supabase
          .from('bookings')
          .select('listing_id')
          .in('listing_id', ids)
          .in('status', ['accepted', 'paid', 'completed']),
        supabase
          .from('reviews')
          .select('listing_id, rating')
          .in('listing_id', ids),
      ])
      if (cancelled) return

      // Booking count map
      const bookingCounts = {}
      for (const { listing_id } of bookingRes.data ?? []) {
        bookingCounts[listing_id] = (bookingCounts[listing_id] ?? 0) + 1
      }

      // Rating map
      const ratingMap = {}
      for (const { listing_id, rating } of reviewRes.data ?? []) {
        if (!ratingMap[listing_id]) ratingMap[listing_id] = []
        ratingMap[listing_id].push(rating)
      }

      const base = [...initialListings]

      const beliebt = [...base].sort(
        (a, b) => (bookingCounts[b.id] ?? 0) - (bookingCounts[a.id] ?? 0)
      )

      const top = [...base]
        .map(l => ({
          ...l,
          _avg: ratingMap[l.id]?.length
            ? ratingMap[l.id].reduce((s, r) => s + r, 0) / ratingMap[l.id].length
            : 0,
        }))
        .sort((a, b) => b._avg - a._avg)

      setData(d => ({ ...d, beliebt, top }))
    }
    load()
    return () => { cancelled = true }
  }, [initialListings])

  const currentRaw = data[sort] ?? data.neu

  // Client-side category filter
  const listings = activeKat
    ? currentRaw.filter(l => l.category === activeKat)
    : currentRaw

  const isFiltered = !!(activeKat || initialRegion || initialDate)

  return (
    <>
      {/* SearchBar */}
      <div className="py-6">
        <SearchBar
          key={`${activeKat}-${initialDate}-${initialRegion}`}
          initialCategory={activeKat}
          initialDate={initialDate}
          initialRegion={initialRegion}
        />
      </div>

      {/* Ergebniszähler — nur bei aktiven Filtern */}
      {isFiltered && (
        <p className="text-xs text-gray-300 mb-4">
          {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'} gefunden
        </p>
      )}

      {/* Sortier-Tabs — nur ohne aktive Filterung */}
      {!isFiltered && (
        <div className="flex gap-6 border-b border-gray-100 mb-6">
          {SORT_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setSort(t.id)}
              className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                sort === t.id
                  ? 'border-pink-600 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-2">Keine Angebote gefunden.</p>
          <Link
            href="/"
            className="text-sm gradient-text font-medium hover:opacity-80 transition-opacity"
          >
            Filter zurücksetzen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
          {listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </>
  )
}

// Suspense wrapper nötig weil useSearchParams() in Next.js 16 eine Suspense-Grenze braucht
export default function HomeListings(props) {
  return (
    <Suspense>
      <HomeListingsInner {...props} />
    </Suspense>
  )
}
