'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIE_LABEL } from '@/lib/constants'
import { formatPreis } from '@/lib/pricing'

const SORTIER_OPTIONEN = [
  { value: 'newest',           label: 'Neueste zuerst' },
  { value: 'neu_14',           label: 'Neu auf Festly' },
  { value: 'schnellste_antwort', label: 'Schnellste Antwort' },
  { value: 'price_asc',        label: 'Preis aufsteigend' },
  { value: 'price_desc',       label: 'Preis absteigend' },
]

const NEU_MS = 14 * 24 * 60 * 60 * 1000

function isNeu(listing) {
  return listing.created_at &&
    Date.now() - new Date(listing.created_at).getTime() < NEU_MS
}

function getBorderClass(listing, borderByListing) {
  const b = borderByListing[listing.id]
  if (b === 'gold')   return 'border-2 border-yellow-400 hover:border-yellow-500'
  if (b === 'orange') return 'border-2 border-orange-300 hover:border-orange-400'
  if (isNeu(listing)) return 'border-2 border-blue-300  hover:border-blue-400'
  return 'border border-gray-200 hover:border-gray-300'
}

export default function FilterSection({ borderByListing = {}, responseByProvider = {} }) {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [kategorie, setKategorie] = useState(searchParams.get('kategorie') ?? '')
  const [region, setRegion] = useState('')
  const [sortierung, setSortierung] = useState('newest')

  const fetchListings = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('id, title, description, category, price_cents, price_model, price_unit_label, region, photos, created_at, provider_id')
      .eq('is_active', true)

    if (kategorie) query = query.eq('category', kategorie)
    if (region)    query = query.ilike('region', `%${region}%`)

    if (sortierung === 'price_asc')          query = query.order('price_cents', { ascending: true })
    if (sortierung === 'price_desc')         query = query.order('price_cents', { ascending: false })
    if (sortierung === 'newest')             query = query.order('created_at',  { ascending: false })
    if (sortierung === 'schnellste_antwort') query = query.order('created_at',  { ascending: false })
    if (sortierung === 'neu_14') {
      const cutoff = new Date(Date.now() - NEU_MS).toISOString()
      query = query.gte('created_at', cutoff).order('created_at', { ascending: false })
    }

    const { data } = await query
    let result = data ?? []

    if (sortierung === 'schnellste_antwort') {
      result = [...result].sort((a, b) => {
        const aH = responseByProvider[a.provider_id]?.avgHours ?? Infinity
        const bH = responseByProvider[b.provider_id]?.avgHours ?? Infinity
        return aH - bH
      })
    }

    setListings(result)
    setLoading(false)
  }, [kategorie, region, sortierung, responseByProvider])

  useEffect(() => { fetchListings() }, [fetchListings])

  return (
    <>
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

        <div className="ml-auto flex items-center gap-3">
          {!loading && (
            <span className="text-sm text-gray-400">
              {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'}
            </span>
          )}
          <select
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-1"
          >
            {SORTIER_OPTIONEN.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
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
            {(kategorie || region || sortierung === 'neu_14')
              ? 'Probiere andere Filter oder setze sie zurück.'
              : 'Aktuell gibt es noch keine Angebote auf dem Marktplatz.'}
          </p>
          {(kategorie || region || sortierung === 'neu_14') && (
            <button
              onClick={() => { setKategorie(''); setRegion(''); setSortierung('newest') }}
              className="text-sm bg-gray-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-gray-700 transition-colors"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => {
            const responseInfo = listing.provider_id ? responseByProvider[listing.provider_id] : null
            return (
              <Link
                key={listing.id}
                href={`/angebote/${listing.id}`}
                className={`bg-white rounded-2xl overflow-hidden hover:shadow-md transition-all group ${getBorderClass(listing, borderByListing)}`}
              >
                <div className="relative h-40 bg-gray-100 overflow-hidden">
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
                  {isNeu(listing) && (
                    <span
                      className="absolute top-2 left-2 text-white text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'linear-gradient(to right, #C026A0, #7C3AED)' }}
                    >
                      Neu
                    </span>
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
                  {responseInfo && (
                    <p className="text-xs text-gray-400 mt-1.5">{responseInfo.label}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-gray-900">{formatPreis(listing)}</p>
                    {listing.region && (
                      <span className="text-xs text-gray-400">{listing.region}</span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
