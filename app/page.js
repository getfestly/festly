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
  const params       = await searchParams
  const activeRegion = param(params?.region) ?? ''
  const activeDate   = param(params?.datum)  ?? null
  // Kategorie-Filter läuft client-seitig in HomeListings

  const supabase = await createSupabaseServer()

  let query = supabase
    .from('listings')
    .select('id, title, category, region, price_cents, price_model, photos')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (activeRegion) query = query.ilike('region', `%${activeRegion}%`)

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
        <HomeListings
          initialListings={listings}
          initialRegion={activeRegion}
          initialDate={activeDate}
        />
      </div>
    </main>
  )
}
