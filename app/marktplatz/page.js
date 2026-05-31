'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIE_LABEL } from '@/lib/constants'

const SORTIER_OPTIONEN = [
  { value: 'price_asc',  label: 'Preis aufsteigend' },
  { value: 'price_desc', label: 'Preis absteigend' },
  { value: 'newest',     label: 'Neueste zuerst' },
]

export default function MarktplatzPage() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [kategorie, setKategorie] = useState('')
  const [region, setRegion] = useState('')
  const [sortierung, setSortierung] = useState('newest')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('id, title, description, category, price_cents, region, photos')
      .eq('is_active', true)

    if (kategorie) query = query.eq('category', kategorie)
    if (region)    query = query.ilike('region', `%${region}%`)

    if (sortierung === 'price_asc')  query = query.order('price_cents', { ascending: true })
    if (sortierung === 'price_desc') query = query.order('price_cents', { ascending: false })
    if (sortierung === 'newest')     query = query.order('created_at',  { ascending: false })

    const { data } = await query
    setListings(data ?? [])
    setLoading(false)
  }, [kategorie, region, sortierung])

  useEffect(() => { fetchListings() }, [fetchListings])

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 block mb-1">← Startseite</Link>
            <h1 className="text-2xl font-bold text-gray-900">Marktplatz</h1>
          </div>
          <Link href="/mein-bereich" className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 rounded-xl px-4 py-2">
            Mein Bereich
          </Link>
        </div>

        {/* Filter-Leiste */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
          <select
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Alle Kategorien</option>
            {KATEGORIEN.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Region suchen …"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 min-w-[160px]"
          />

          <select
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 ml-auto"
          >
            {SORTIER_OPTIONEN.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Ergebnisse */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-gray-400">Lade Angebote …</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 mb-2">Keine Angebote gefunden.</p>
            {(kategorie || region) && (
              <button
                onClick={() => { setKategorie(''); setRegion('') }}
                className="text-sm text-gray-600 underline"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/angebote/${listing.id}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                {/* Bild oder Platzhalter */}
                <div className="h-40 bg-gray-100 overflow-hidden">
                  {listing.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                      🎪
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 shrink-0">
                      {KATEGORIE_LABEL[listing.category] ?? listing.category}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 leading-snug mt-2 line-clamp-2">
                    {listing.title}
                  </p>
                  {listing.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-gray-900">
                      {(listing.price_cents / 100).toLocaleString('de-DE', {
                        style: 'currency', currency: 'EUR',
                      })}
                    </p>
                    {listing.region && (
                      <span className="text-xs text-gray-400">{listing.region}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && listings.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-8">
            {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'} gefunden
          </p>
        )}
      </div>
    </main>
  )
}
