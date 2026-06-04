'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIE_EMOJI } from '@/lib/constants'
import ListingCard from '@/components/ListingCard'

// ── Kategorie-Reihe ───────────────────────────────────────────────────────────

function CategoryRow({ category }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {KATEGORIE_EMOJI[category.id]} Beliebte {category.label}
        </h2>
        <Link href={`/marktplatz?kategorie=${category.id}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap">
          Alle anzeigen →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {category.listings.map(l => <ListingCard key={l.id} listing={l} />)}
      </div>
    </section>
  )
}

// ── HomeContent (nutzt useSearchParams — muss in <Suspense> sein) ─────────────

function HomeContent() {
  const searchParams  = useSearchParams()
  const activeCategory = searchParams.get('kategorie') ?? ''

  const [listings,        setListings]        = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data, error, status, statusText } = await supabase
          .from('listings')
          .select('id, title, category, region, price_cents, price_model, photos')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('[Startseite] Listings-Fehler:', {
            message: error.message,
            code: error.code,
            hint: error.hint,
            details: error.details,
            status,
            statusText,
          })
        }
        console.log(`[Startseite] Listings geladen: ${data?.length ?? 0} Einträge`, { error })
        setListings(data ?? [])
      } catch (err) {
        console.error('[Startseite] Unerwarteter Fehler:', err)
        setListings([])
      } finally {
        setListingsLoading(false)
      }
    }
    load()
  }, [])

  // Kategorien ohne aktive Listings werden immer ausgeblendet
  const grouped = KATEGORIEN
    .filter(k => !activeCategory || k.id === activeCategory)
    .map(k => ({ ...k, listings: listings.filter(l => l.category === k.id) }))
    .filter(k => k.listings.length > 0)

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {listingsLoading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Angebote werden geladen …</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-2">Keine Angebote gefunden.</p>
            <Link href="/marktplatz"
              className="text-sm gradient-text font-medium hover:opacity-80 transition-opacity">
              Alle Kategorien anzeigen
            </Link>
          </div>
        ) : (
          grouped.map(cat => <CategoryRow key={cat.id} category={cat} />)
        )}
      </div>
    </main>
  )
}

// ── Export: Suspense-Wrapper (nötig für useSearchParams) ──────────────────────

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  )
}
