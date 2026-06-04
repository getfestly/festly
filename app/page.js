'use client'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN } from '@/lib/constants'

// ── Konstanten ────────────────────────────────────────────────────────────────

const EMOJI = {
  fahrgeschaefte:  '🎡',
  gastro:          '🍽️',
  unterhaltung:    '🎵',
  ausstattung:     '💡',
  sanitaer_service:'🚿',
}

// ── Listing-Karte ─────────────────────────────────────────────────────────────

function ListingCard({ listing }) {
  const photo = listing.photos?.[0]
  const emoji = EMOJI[listing.category] ?? '🎪'
  const preis = (!listing.price_cents || listing.price_model === 'on_request')
    ? 'Auf Anfrage'
    : `${(listing.price_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / Tag`

  return (
    <Link href={`/angebote/${listing.id}`} className="group w-64 flex-shrink-0">
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 relative mb-2.5">
        {photo
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, #fdf4ff, #f0f9ff)' }}>
              {emoji}
            </div>
          )
        }
        <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation() }}
          className="absolute top-3 right-3 text-white text-xl drop-shadow hover:text-red-400 transition-colors"
          aria-label="Merken">♡</button>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{listing.region ?? 'Deutschland'}</p>
        <p className="text-sm mt-1 font-semibold text-gray-900">{preis}</p>
      </div>
    </Link>
  )
}

// ── Kategorie-Reihe ───────────────────────────────────────────────────────────

function CategoryRow({ category }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {EMOJI[category.id]} Beliebte {category.label}
        </h2>
        <Link href={`/marktplatz?kategorie=${category.id}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap">
          Alle anzeigen →
        </Link>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {category.listings.map(l => <ListingCard key={l.id} listing={l} />)}
        </div>
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
