'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIEN_FLAT, KATEGORIE_LABEL, SUBKATEGORIE_LABEL, formatRegion } from '@/lib/constants'
import { trackEvent } from '@/lib/analytics'

const PAGE_SIZE = 12

const SORTIER_OPTIONEN = [
  { value: 'newest',             label: 'Neueste zuerst' },
  { value: 'neu_14',             label: 'Neu auf Festly' },
  { value: 'schnellste_antwort', label: 'Schnellste Antwort' },
  { value: 'price_asc',          label: 'Preis aufsteigend' },
  { value: 'price_desc',         label: 'Preis absteigend' },
]

const KATEGORIE_EMOJIS = {
  // legacy
  food: '🍽️', ride: '🎡', music: '🎵', sanitation: '🚿', tech: '💡', rental: '📦', other: '✨',
  // neu
  fahrgeschaefte: '🎡', gastro: '🍽️', unterhaltung: '🎵', ausstattung: '💡', sanitaer_service: '🚿',
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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export default function FilterSection({ responseByProvider = {} }) {
  const searchParams = useSearchParams()
  const [listings, setListings]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)
  const [page, setPage]               = useState(0)
  const [kategorie, setKategorie]     = useState(searchParams.get('kategorie') ?? '')
  const [subkategorie, setSubkategorie] = useState('')
  const [region, setRegion]           = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [sortierung, setSortierung]   = useState('newest')
  const [userId, setUserId]           = useState(null)

  // Welche Kategorien/Subkategorien haben mind. 1 aktives Listing
  const [availableCats, setAvailableCats]         = useState(new Set())
  const [availableSubcats, setAvailableSubcats]   = useState({})

  // Einmalig beim Mount: user + verfügbare Kategorien laden
  useEffect(() => {
    async function init() {
      const [userRes, catRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('listings').select('category, subcategory').eq('is_active', true),
      ])

      setUserId(userRes.data?.user?.id ?? null)

      const cats = new Set()
      const subcats = {}
      for (const { category, subcategory } of catRes.data ?? []) {
        if (category) cats.add(category)
        if (category && subcategory) {
          if (!subcats[category]) subcats[category] = new Set()
          subcats[category].add(subcategory)
        }
      }
      setAvailableCats(cats)
      setAvailableSubcats(subcats)
    }
    init()
  }, [])

  const fetchListings = useCallback(async ({ pageNum = 0, append = false } = {}) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    try {
      // Datum-Normalisierung: bei nur "Von" → Einzeltag
      const effectiveFrom = dateFrom || null
      const effectiveTo   = dateFrom ? (dateTo || dateFrom) : null

      // Gebuchte Listing-IDs für den Zeitraum ermitteln (fire & silent on error)
      let bookedIds = []
      if (effectiveFrom) {
        try {
          const { data: booked } = await supabase
            .from('bookings')
            .select('listing_id')
            .in('status', ['accepted', 'paid', 'completed'])
            .not('listing_id', 'is', null)
            .gte('event_date', effectiveFrom)
            .lte('event_date', effectiveTo)

          bookedIds = [...new Set((booked ?? []).map((b) => b.listing_id).filter(Boolean))]
        } catch {
          // RLS verhindert ggf. Lesezugriff — Datum-Filter ohne Ausschluss
        }
      }

      let query = supabase
        .from('listings')
        .select('id, title, description, category, subcategory, price_cents, price_model, price_unit_label, region, photos, created_at, provider_id')
        .eq('is_active', true)

      // Filter: Subkategorie hat Vorrang vor Oberkategorie
      if (subkategorie)      query = query.eq('subcategory', subkategorie)
      else if (kategorie)    query = query.eq('category', kategorie)

      if (region)            query = query.ilike('region', `%${region}%`)
      if (bookedIds.length)  query = query.not('id', 'in', `(${bookedIds.join(',')})`)

      if (sortierung === 'price_asc')          query = query.order('price_cents', { ascending: true })
      if (sortierung === 'price_desc')         query = query.order('price_cents', { ascending: false })
      if (sortierung === 'newest')             query = query.order('created_at',  { ascending: false })
      if (sortierung === 'schnellste_antwort') query = query.order('created_at',  { ascending: false })
      if (sortierung === 'neu_14') {
        const cutoff = new Date(Date.now() - NEU_MS).toISOString()
        query = query.gte('created_at', cutoff).order('created_at', { ascending: false })
      }

      const from = pageNum * PAGE_SIZE
      query = query.range(from, from + PAGE_SIZE - 1)

      const { data } = await query
      let result = data ?? []

      if (sortierung === 'schnellste_antwort') {
        result = [...result].sort((a, b) => {
          const aH = responseByProvider[a.provider_id]?.avgHours ?? Infinity
          const bH = responseByProvider[b.provider_id]?.avgHours ?? Infinity
          return aH - bH
        })
      }

      if (append) {
        setListings(prev => [...prev, ...result])
      } else {
        setListings(result)
      }
      setHasMore(result.length === PAGE_SIZE)

      // Tracking nur beim ersten Laden einer neuen Suche
      if (!append) {
        if (kategorie || region) {
          trackEvent('search_performed', {
            category:      kategorie || null,
            region:        region    || null,
            results_count: result.length,
          })
        }

        supabase.from('search_events').insert({
          user_id:         userId ?? null,
          category:        kategorie    || null,
          subcategory:     subkategorie || null,
          region:          region       || null,
          event_date_from: effectiveFrom,
          event_date_to:   effectiveTo,
          results_count:   result.length,
        }).then(() => {}).catch(() => {})
      }
    } catch (err) {
      console.error('[FilterSection] fetchListings Fehler:', err)
    } finally {
      if (!append) setLoading(false)
      else setLoadingMore(false)
    }

  }, [kategorie, subkategorie, region, dateFrom, dateTo, sortierung, responseByProvider, userId])

  // Filter-Änderung → Seite zurücksetzen und neu laden
  useEffect(() => {
    setPage(0)
    fetchListings({ pageNum: 0, append: false })
  }, [fetchListings])

  function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    fetchListings({ pageNum: nextPage, append: true })
  }

  // Oberkategorie-Klick: Toggle + Subkat-Reset
  function handleKategorieClick(id) {
    if (kategorie === id) {
      setKategorie('')
      setSubkategorie('')
    } else {
      setKategorie(id)
      setSubkategorie('')
    }
  }

  function resetAll() {
    setKategorie('')
    setSubkategorie('')
    setRegion('')
    setDateFrom('')
    setDateTo('')
    setSortierung('newest')
  }

  const selectedKat = KATEGORIEN.find((k) => k.id === kategorie)
  const hasSubcats  = selectedKat && (availableSubcats[kategorie]?.size ?? 0) > 0
  const hasFilter   = kategorie || subkategorie || region || dateFrom || sortierung === 'neu_14'

  const pillBase     = 'flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm whitespace-nowrap font-medium transition-all'
  const pillActive   = 'border-transparent text-white shadow-sm'
  const pillInactive = 'border-gray-300 text-gray-700 bg-white hover:border-gray-400'
  const gradientStyle = { background: 'linear-gradient(to right, #C026A0, #7C3AED)' }

  // Nur Oberkategorien die mind. 1 Listing haben
  const visibleCats = KATEGORIEN_FLAT.filter((k) => availableCats.has(k.id))

  return (
    <>
      {/* ── Oberkategorie-Pills ──────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-2">
        <button
          onClick={() => { setKategorie(''); setSubkategorie('') }}
          className={`${pillBase} ${kategorie === '' ? pillActive : pillInactive}`}
          style={kategorie === '' ? gradientStyle : {}}
        >
          Alle
        </button>
        {visibleCats.map((k) => (
          <button
            key={k.id}
            onClick={() => handleKategorieClick(k.id)}
            className={`${pillBase} ${kategorie === k.id ? pillActive : pillInactive}`}
            style={kategorie === k.id ? gradientStyle : {}}
          >
            {KATEGORIE_EMOJIS[k.id]} {k.label}
          </button>
        ))}
      </div>

      {/* ── Unterkategorie-Pills (nur wenn Oberkategorie gewählt + Subkats vorhanden) ── */}
      {hasSubcats && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-1 pl-2">
          <button
            onClick={() => setSubkategorie('')}
            className={`${pillBase} text-xs py-1.5 ${subkategorie === '' ? 'border-gray-700 bg-gray-900 text-white' : pillInactive}`}
          >
            Alle {selectedKat.label}
          </button>
          {selectedKat.subcategories
            .filter((s) => availableSubcats[kategorie]?.has(s.id))
            .map((s) => (
              <button
                key={s.id}
                onClick={() => setSubkategorie(subkategorie === s.id ? '' : s.id)}
                className={`${pillBase} text-xs py-1.5 ${subkategorie === s.id ? 'border-gray-700 bg-gray-900 text-white' : pillInactive}`}
              >
                {s.label}
              </button>
            ))}
        </div>
      )}

      {/* ── Region + Datum + Sortierung ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8 mt-3">
        {/* Region */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Region …"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            autoComplete="off"
            className="pl-9 pr-4 py-2 rounded-full border border-gray-300 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent min-w-[150px]"
          />
        </div>

        {/* Datum Von */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-400 whitespace-nowrap">📅 Von</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); if (!e.target.value) setDateTo('') }}
            className="border border-gray-300 rounded-full px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          />
        </div>

        {/* Datum Bis (nur wenn Von gesetzt) */}
        {dateFrom && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-400">Bis</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-full px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            />
          </div>
        )}

        {/* Reset (wenn Filter aktiv) */}
        {hasFilter && (
          <button
            onClick={resetAll}
            className="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
          >
            ✕ Reset
          </button>
        )}

        {/* Rechts: Anzahl + Sortierung */}
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

      {/* ── Ergebnisse ──────────────────────────────────────────────── */}
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
            {hasFilter
              ? 'Probiere andere Filter oder setze sie zurück.'
              : 'Aktuell gibt es noch keine Angebote auf dem Marktplatz.'}
          </p>
          {hasFilter && (
            <button
              onClick={resetAll}
              className="text-sm bg-gray-900 text-white rounded-xl px-5 py-2.5 font-medium hover:bg-gray-700 transition-colors"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      ) : (
        <>
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5 font-medium">
                      {listing.subcategory
                        ? (SUBKATEGORIE_LABEL[listing.subcategory] ?? listing.subcategory)
                        : (KATEGORIE_LABEL[listing.category] ?? listing.category)}
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

                  <p className="text-base font-semibold text-gray-900 leading-snug line-clamp-1">
                    {listing.title}
                  </p>

                  <p className="text-sm text-gray-400 mt-0.5 truncate min-h-[1.25rem]">
                    {listing.description ?? ''}
                  </p>

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

          {/* ── Mehr laden ──────────────────────────────────────────── */}
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loadingMore ? <Spinner /> : null}
                {loadingMore ? 'Lade …' : 'Weitere Angebote laden'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
