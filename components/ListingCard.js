'use client'
import Link from 'next/link'
import { KATEGORIE_EMOJI, formatRegion } from '@/lib/constants'

export default function ListingCard({ listing }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const photoFile   = listing.photos?.[0] ?? null
  const photo       = photoFile
    ? `${supabaseUrl}/storage/v1/object/public/listing-photos/${photoFile}`
    : null
  const emoji = KATEGORIE_EMOJI[listing.category] ?? '🎪'
  const preis = (!listing.price_cents || listing.price_model === 'on_request')
    ? 'Auf Anfrage'
    : `${(listing.price_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / Tag`
  const region = formatRegion(listing.region) ?? 'Deutschland'

  return (
    <Link href={`/angebote/${listing.id}`} className="group hover:scale-[1.01] transition-all duration-200">
      <div className="h-[200px] rounded-2xl overflow-hidden bg-gray-100 relative mb-3">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl"
            style={{ background: 'linear-gradient(135deg, #fdf4ff, #f0f9ff)' }}>
            {emoji}
          </div>
        )}
        <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation() }}
          className="absolute top-3 right-3 text-white text-xl drop-shadow hover:text-red-400 transition-colors"
          aria-label="Merken">♡</button>
      </div>
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 truncate">{listing.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{region}</p>
        <p className="text-sm mt-1 font-semibold text-gray-900">{preis}</p>
      </div>
    </Link>
  )
}
