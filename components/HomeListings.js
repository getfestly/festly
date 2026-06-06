'use client'
import { useState, useEffect, useCallback, Suspense } from 'react'
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

// Unsichtbarer Helfer: liest useSearchParams() isoliert in eigener Suspense-Grenze.
// Nur diese winzige Komponente braucht Suspense — der Rest rendert sofort ohne Blocking.
function KategorieSync({ onChange }) {
  const sp  = useSearchParams()
  const kat = sp.get('kategorie') ?? ''
  useEffect(() => { onChange(kat) }, [kat, onChange])
  return null
}

export default function HomeListings({
  initialListings,
  initialRegion,
  initialDateFrom = null,
  initialDateTo   = null,
  initialCategory = '',
}) {
  const [activeKat, setActiveKat] = useState(initialCategory)
  const [sort, setSort]           = useState('neu')
  const [data, setData]           = useState({
    neu:     initialListings,
    beliebt: initialListings, // snaps to sorted order after fetch
    top:     initialListings,
  })

  // useCallback stabilisiert die Referenz für KategorieSync
  const handleKatChange = useCallback((kat) => setActiveKat(kat), [])

  // Sync neu-Datensatz wenn Server mit neuem Datum-/Regions-Filter re-rendert
  useEffect(() => {
    setData(d => ({ ...d, neu: initialListings }))
  }, [initialListings])

  // Booking-Counts + Review-Ratings für Beliebt/Top-Tabs nachladen
  useEffect(() => {
    let cancelled = false
    async function load() {
      const ids = initialListings.map(l => l.id)
      if (!ids.length) return
      try {
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

        const bookingCounts = {}
        for (const { listing_id } of bookingRes.data ?? []) {
          bookingCounts[listing_id] = (bookingCounts[listing_id] ?? 0) + 1
        }
        const ratingMap = {}
        for (const { listing_id, rating } of reviewRes.data ?? []) {
          if (!ratingMap[listing_id]) ratingMap[listing_id] = []
          ratingMap[listing_id].push(rating)
        }

        const base    = [...initialListings]
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
      } catch (err) {
        console.error('[HomeListings] sort fetch:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [initialListings])

  const currentRaw = data[sort] ?? data.neu
  const listings   = activeKat
    ? currentRaw.filter(l => l.category === activeKat)
    : currentRaw
  const isFiltered = !!(activeKat || initialRegion || initialDateFrom)

  return (
    <>
      {/* KategorieSync: useSearchParams() in eigener Mini-Suspense — blockiert den Rest nicht */}
      <Suspense>
        <KategorieSync onChange={handleKatChange} />
      </Suspense>

      {/* SearchBar */}
      <div className="py-6">
        <SearchBar
          key={`${activeKat}-${initialDateFrom}-${initialDateTo}-${initialRegion}`}
          initialCategory={activeKat}
          initialDateFrom={initialDateFrom}
          initialDateTo={initialDateTo}
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
