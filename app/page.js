'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'

function MarktplatzContent() {
  const searchParams   = useSearchParams()
  const activeCategory = searchParams.get('kategorie') ?? ''
  const activeRegion   = searchParams.get('region')   ?? ''
  const activeDate     = searchParams.get('datum')    ?? null

  const [listings, setListings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        let query = supabase
          .from('listings')
          .select('id, title, category, region, price_cents, price_model, photos')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (activeCategory) query = query.eq('category', activeCategory)
        if (activeRegion)   query = query.ilike('region', `%${activeRegion}%`)

        // Für gewähltes Datum bereits gebuchte Listings ausblenden
        if (activeDate) {
          try {
            const { data: booked } = await supabase
              .from('bookings')
              .select('listing_id')
              .in('status', ['accepted', 'paid', 'completed'])
              .not('listing_id', 'is', null)
              .eq('event_date', activeDate)
            const ids = (booked ?? []).map(b => b.listing_id).filter(Boolean)
            if (ids.length) query = query.not('id', 'in', `(${ids.join(',')})`)
          } catch {
            // RLS verhindert Lesezugriff — Datum-Filter übersprungen
          }
        }

        const { data, error } = await query
        if (error) console.error('[Marktplatz] Fehler:', error)
        setListings(data ?? [])
      } catch (err) {
        console.error('[Marktplatz] Unerwarteter Fehler:', err)
        setListings([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCategory, activeRegion, activeDate])

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Suchleiste — key erzwingt Remount wenn URL-Params wechseln */}
        <div className="py-6">
          <SearchBar
            key={`${activeCategory}-${activeDate}-${activeRegion}`}
            initialCategory={activeCategory}
            initialDate={activeDate}
            initialRegion={activeRegion}
          />
        </div>

        {/* Ergebniszähler — nur bei aktiven Filtern */}
        {!loading && (activeCategory || activeRegion || activeDate) && (
          <p className="text-xs text-gray-300 mb-4">
            {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'} gefunden
          </p>
        )}

        {/* Listings */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Angebote werden geladen …</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-2">Keine Angebote gefunden.</p>
            <Link href="/"
              className="text-sm gradient-text font-medium hover:opacity-80 transition-opacity">
              Filter zurücksetzen
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense>
      <MarktplatzContent />
    </Suspense>
  )
}
