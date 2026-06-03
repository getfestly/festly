'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIE_LABEL, formatRegion } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'

const SORTIER_OPTIONEN = [
  { value: 'newest',             label: 'Neueste zuerst' },
  { value: 'neu_14',             label: 'Neu auf Festly' },
  { value: 'schnellste_antwort', label: 'Schnellste Antwort' },
  { value: 'price_asc',          label: 'Preis aufsteigend' },
  { value: 'price_desc',         label: 'Preis absteigend' },
]

const KATEGORIE_EMOJIS = {
  food:       '🍽️',
  ride:       '🎡',
  music:      '🎵',
  sanitation: '🚿',
  tech:       '💡',
  rental:     '📦',
  other:      '✨',
}

const NEU_MS = 14 * 24 * 60 * 60 * 1000

function isNeu(listing) {
  return listing.created_at &&
    Date.now() - new Date(listing.created_at).getTime() < NEU_MS
}

const eur = (cents) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

function formatPreisCard(listing) {
  const { price_model, price_cents, price_unit_label } = listing ?? {}
  switch (price_model) {
    case 'flat':       return `${eur(price_cents)}/Tag`
    case 'per_person': return `ab ${eur(price_cents)}/${price_unit_label ?? 'Person'}`
    case 'flat_plus':  return `${eur(price_cents)} Grundpreis`
    case 'hourly':     return `ab ${eur(price_cents)}/${price_unit_label ?? 'Std.'}`
    case 'on_request': return 'Auf Anfrage'
    default:           return price_cents ? eur(price_cents) : '–'
  }
}

export default function FilterSection({ responseByProvider = {} }) {
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

    if (kategorie || region) {
      trackEvent('search_performed', {
        category:      kategorie || null,
        region:        region || null,
        results_count: result.length,
      })
    }
  }, [kategorie, region, sortierung, responseByProvider])

  useEffect(() => { fetchListings() }, [fetchListings])

  const pillBase = 'flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm whitespace-nowrap font-medium transition-all'
  const pillActive = 'border-transparent text-white shadow-sm'
  const pillInactive = 'border-gray-300 text-gray-700 bg-white hover:border-gray-400'
  const gradientStyle = { background: 'linear-gradient(to right, #C026A0, #7C3AED)' }

  return (
    <>
      {/* ── Kategorie-Pills ──────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-3">
        <button
          onClick={() => setKategorie('')}
          className={`${pillBase} ${kategorie === '' ? pillActive : pillInactive}`}
          style={kategorie === '' ? gradientStyle : {}}
        >
          Alle
        </button>
        {KATEGORIEN.map((k) => (
          <button
            key={k.value}
            onClick={() => setKategorie(k.value)}
            className={`${pillBase} ${kategorie === k.value ? pillActive : pillInactive}`}
            style={kategorie === k.value ? gradientStyle : {}}
          >
            {KATEGORIE_EMOJIS[k.value]} {k.label}
          </button>
        ))}
      </div>

      {/* ── Region + Sortierung ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Region suchen …"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            autoComplete="off"
            className="pl-9 pr-4 py-2 rounded-full border border-gray-300 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent min-w-[180px]"
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {!loading && (
            <span className="text-sm text-gray-400">
              {listings.length} {listings.length === 1 ? 'Angebot' : 'Angebote'}
            </span>
          )}
          <select
            value={sortierung}
            onChange={(e) => setSortierung(e.target.value)}
            className="border border-gray-300 rounded-full px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          >
            {SORTIER_OPTIONEN.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Ergebnisse ──────────────────────────────────────────────────── */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <Link
              key={listing.id}
              href={`/angebote/${listing.id}`}
              className="group hover:scale-[1.01] transition-all duration-200"
            >
              {/* Foto 4:3 */}
              <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3">
                {listing.photos?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.photos[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-pink-100 to-purple-100">
                    🎪
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="px-0.5">
                {/* Zeile 1: Kategorie + Neu */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 font-medium">
                    {KATEGORIE_LABEL[listing.category] ?? listing.category}
                  </span>
                  {isNeu(listing) && (
                    <span
                      className="text-xs text-white font-semibold px-2 py-0.5 rounded-full"
                      style={gradientStyle}
                    >
                      Neu
                    </span>
                  )}
                </div>

                {/* Zeile 2: Titel */}
                <p className="text-base font-semibold text-gray-900 leading-snug line-clamp-1">
                  {listing.title}
                </p>

                {/* Zeile 3: Kurzbeschreibung */}
                <p className="text-sm text-gray-400 mt-0.5 truncate min-h-[1.25rem]">
                  {listing.description ?? ''}
                </p>

                {/* Zeile 4: Preis + Region */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-semibold text-gray-900">{formatPreisCard(listing)}</p>
                  {listing.region && (
                    <span className="text-sm text-gray-400">{formatRegion(listing.region)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
