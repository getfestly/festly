export const metadata = {
  title: 'Festly – Schausteller, Imbisswagen & Eventausrüstung mieten',
  description: 'Festly ist der Marktplatz für Eventdienstleistungen in Deutschland. Imbisswagen, Hüpfburgen, Fahrgeschäfte, Toilettenwagen und mehr – einfach finden, sicher buchen.',
}

import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'

// searchParams macht die Route automatisch dynamic (kein Static Prerendering)
function param(v) {
  return Array.isArray(v) ? v[0] : v
}

export default async function HomePage({ searchParams }) {
  const params         = await searchParams
  const activeCategory = param(params?.kategorie) ?? ''
  const activeRegion   = param(params?.region)    ?? ''
  const activeDate     = param(params?.datum)      ?? null

  const supabase = await createSupabaseServer()

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
      // RLS verhindert Lesezugriff für anon — Datum-Filter übersprungen
    }
  }

  const { data, error } = await query.limit(24)
  if (error) console.error('[Startseite] Fehler:', error)
  const listings = data ?? []

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* key erzwingt SearchBar-Remount wenn URL-Params wechseln,
            damit useState(initialX) die neuen Werte übernimmt */}
        <div className="py-6">
          <SearchBar
            key={`${activeCategory}-${activeDate}-${activeRegion}`}
            initialCategory={activeCategory}
            initialDate={activeDate}
            initialRegion={activeRegion}
          />
        </div>

        {/* Ergebniszähler — nur bei aktiven Filtern */}
        {(activeCategory || activeRegion || activeDate) && (
          <p className="text-xs text-gray-300 mb-4">
            {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'} gefunden
          </p>
        )}

        {/* Listings */}
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-2">Keine Angebote gefunden.</p>
            <Link href="/"
              className="text-sm gradient-text font-medium hover:opacity-80 transition-opacity">
              Filter zurücksetzen
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
            {!activeCategory && !activeRegion && !activeDate && (
              <div className="text-center py-10">
                <Link
                  href="/marktplatz"
                  className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Alle Angebote ansehen →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
