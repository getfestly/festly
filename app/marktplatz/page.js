'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIE_LABEL } from '@/lib/constants'
import Nav from '@/components/Nav'

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
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Marktplatz</h1>

        {/* Filter-Leiste */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
          <select
            value={kategorie}
            onChange={(e) => setKategorie(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
          />

          <select
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-auto"
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
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Keine Angebote gefunden</h3>
            <p className="text-gray-500 text-sm mb-6">
              {(kategorie || region)
                ? 'Probiere andere Filter oder setze sie zurück.'
                : 'Aktuell gibt es noch keine Angebote auf dem Marktplatz.'}
            </p>
            {(kategorie || region) && (
              <button
                onClick={() => { setKategorie(''); setRegion('') }}
                className="text-sm bg-gray-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-gray-700 transition-colors"
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
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all group"
              >
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
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">
                    {KATEGORIE_LABEL[listing.category] ?? listing.category}
                  </span>
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
      </main>
    </div>
  )
}
