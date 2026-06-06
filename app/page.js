export const metadata = {
  title: 'Festly – Schausteller, Imbisswagen & Eventausrüstung mieten',
  description: 'Festly ist der Marktplatz für Eventdienstleistungen in Deutschland. Imbisswagen, Hüpfburgen, Fahrgeschäfte, Toilettenwagen und mehr – einfach finden, sicher buchen.',
}

import { createSupabaseServer } from '@/lib/supabase-server'
import HomeListings from '@/components/HomeListings'

function param(v) {
  return Array.isArray(v) ? v[0] : v
}

export default async function HomePage({ searchParams }) {
  const params          = await searchParams
  const activeCategory  = param(params?.kategorie) ?? ''
  const activeRegion    = param(params?.region)    ?? ''
  const activeVon       = param(params?.von)       ?? null
  const activeBis       = param(params?.bis)       ?? null
  // Kategorie-Filter läuft client-seitig in HomeListings (initialCategory für SSR)

  const supabase = await createSupabaseServer()

  let query = supabase
    .from('listings')
    .select('id, title, category, region, price_cents, price_model, photos')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (activeRegion) query = query.ilike('region', `%${activeRegion}%`)

  if (activeVon) {
    try {
      let bookingQ = supabase
        .from('bookings')
        .select('listing_id')
        .in('status', ['accepted', 'paid', 'completed'])
        .not('listing_id', 'is', null)
        .gte('event_date', activeVon)
      if (activeBis) bookingQ = bookingQ.lte('event_date', activeBis)
      else           bookingQ = bookingQ.eq('event_date', activeVon)
      const { data: booked } = await bookingQ
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
        <HomeListings
          initialListings={listings}
          initialCategory={activeCategory}
          initialRegion={activeRegion}
          initialDateFrom={activeVon}
        initialDateTo={activeBis}
        />
      </div>
    </main>
  )
}
