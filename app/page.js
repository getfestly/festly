'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, REGION_NAMES } from '@/lib/constants'

// ── Konstanten ────────────────────────────────────────────────────────────────

const EMOJI = {
  fahrgeschaefte:  '🎡',
  gastro:          '🍽️',
  unterhaltung:    '🎵',
  ausstattung:     '💡',
  sanitaer_service:'🚿',
}

const KATEGORIE_DESC = {
  fahrgeschaefte:  'Karussells, Achterbahnen & mehr',
  gastro:          'Catering, Foodtrucks & Bars',
  unterhaltung:    'Musik, DJs & Shows',
  ausstattung:     'Technik, Licht & Zelte',
  sanitaer_service:'Toiletten & Sicherheit',
}

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const DAYS   = ['Mo','Di','Mi','Do','Fr','Sa','So']

// ── Kalender-Helfer ───────────────────────────────────────────────────────────

function buildDays(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const total  = new Date(year, month + 1, 0).getDate()
  const days   = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= total; d++) days.push(new Date(year, month, d))
  return days
}

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDE(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// ── Kalender-Panel ────────────────────────────────────────────────────────────

function CalendarPanel({ value, onChange }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const m1 = { year: viewYear, month: viewMonth }
  const m2 = viewMonth === 11
    ? { year: viewYear + 1, month: 0 }
    : { year: viewYear, month: viewMonth + 1 }

  function goPrev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function goNext() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function renderMonth(year, month, showPrev, showNext) {
    const days = buildDays(year, month)
    return (
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between mb-3">
          {showPrev
            ? <button onClick={goPrev} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">←</button>
            : <div className="w-8" />}
          <span className="text-sm font-semibold text-gray-900">{MONTHS[month]} {year}</span>
          {showNext
            ? <button onClick={goNext} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">→</button>
            : <div className="w-8" />}
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-xs text-center text-gray-400 py-1 font-medium">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const isPast     = day < today
            const iso        = toISO(day)
            const isSelected = value === iso
            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => onChange(iso)}
                className={[
                  'aspect-square flex items-center justify-center rounded-full text-sm transition-colors',
                  isPast       ? 'text-gray-200 cursor-not-allowed'       : 'hover:bg-gray-100 text-gray-800',
                  isSelected   ? '!bg-gray-900 !text-white hover:!bg-gray-800' : '',
                ].join(' ')}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 overflow-x-auto">
      {renderMonth(m1.year, m1.month, true, false)}
      <div className="w-px bg-gray-100 shrink-0" />
      {renderMonth(m2.year, m2.month, false, true)}
    </div>
  )
}

// ── Listing-Karte ─────────────────────────────────────────────────────────────

function ListingCard({ listing }) {
  const photo = listing.photos?.[0]
  const emoji = EMOJI[listing.category] ?? '🎪'

  let preis
  if (listing.price_model === 'on_request' || !listing.price_cents) {
    preis = 'Auf Anfrage'
  } else {
    const eur = (listing.price_cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    preis = `${eur} / Tag`
  }

  return (
    <Link href={`/angebote/${listing.id}`} className="group w-60 flex-shrink-0">
      {/* Foto */}
      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 relative mb-2.5">
        {photo
          ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-5xl"
              style={{ background: 'linear-gradient(135deg, #fdf4ff, #f0f9ff)' }}>
              {emoji}
            </div>
          )
        }
        {/* Herz */}
        <button
          type="button"
          onClick={e => { e.preventDefault(); e.stopPropagation() }}
          className="absolute top-3 right-3 text-white text-xl drop-shadow hover:text-red-400 transition-colors"
          aria-label="Merken"
        >
          ♡
        </button>
      </div>

      {/* Info */}
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
          {EMOJI[category.id]} {category.label}
        </h2>
        <Link
          href={`/marktplatz?kategorie=${category.id}`}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
        >
          Alle anzeigen →
        </Link>
      </div>

      {category.listings.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">Noch keine Angebote in dieser Kategorie</p>
          <Link
            href="/anbieter/listings/neu"
            className="inline-block mt-3 text-sm font-medium gradient-text hover:opacity-80 transition-opacity"
          >
            Jetzt Angebot erstellen →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-2">
            {category.listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}
    </section>
  )
}

// ── Hauptseite ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  // Listings
  const [listings, setListings]           = useState([])
  const [listingsLoading, setListingsLoading] = useState(true)

  // Suche
  const [activeField,       setActiveField]       = useState(null) // 'what'|'when'|'where'
  const [selectedCategory,  setSelectedCategory]  = useState('')
  const [selectedDate,      setSelectedDate]      = useState(null)
  const [selectedRegion,    setSelectedRegion]    = useState('')
  const searchRef = useRef(null)

  // Listings laden
  useEffect(() => {
    supabase
      .from('listings')
      .select('id, title, category, region, price_cents, price_model, photos')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings(data ?? [])
        setListingsLoading(false)
      })
  }, [])

  // Klick außerhalb → Panels schließen
  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setActiveField(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSearch() {
    const p = new URLSearchParams()
    if (selectedCategory) p.set('kategorie', selectedCategory)
    if (selectedDate)     p.set('datum', selectedDate)
    if (selectedRegion)   p.set('region', selectedRegion)
    router.push('/marktplatz' + (p.toString() ? '?' + p.toString() : ''))
  }

  // Listings nach Kategorie gruppieren
  const grouped = KATEGORIEN.map(k => ({
    ...k,
    listings: listings.filter(l => l.category === k.id),
  }))

  const regions          = Object.values(REGION_NAMES).sort((a, b) => a.localeCompare(b, 'de'))
  const selectedCatLabel = KATEGORIEN.find(k => k.id === selectedCategory)?.label ?? null

  // CSS-Klassen für Such-Felder
  const fieldCls = (name) =>
    `flex-1 flex flex-col justify-center px-5 py-3 cursor-pointer min-w-0 transition-colors ${
      activeField === name ? 'bg-white shadow-md rounded-2xl z-10' : 'hover:bg-white/70'
    }`

  return (
    <main className="flex-1 min-h-screen bg-white">

      {/* ── Hero + Suchleiste ──────────────────────────────────────────── */}
      <div
        className="py-14 px-4"
        style={{ background: 'radial-gradient(ellipse at center, #fdf4ff 0%, #fce7f3 40%, #ffffff 70%)' }}
      >
        <div className="max-w-5xl mx-auto">

          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-3">
              Dein Event.{' '}
              <span className="gradient-text">Perfekt organisiert.</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Schausteller, Caterer, Musik und mehr — sicher gebucht über Festly.
            </p>
          </div>

          {/* Suchleiste */}
          <div ref={searchRef} className="relative max-w-3xl mx-auto">
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-2 transition-all ${
              activeField ? 'border-gray-900 bg-white' : 'border-transparent'
            }`}>
              <div className="flex items-stretch">

                {/* Feld 1: Was */}
                <div
                  className={fieldCls('what') + ' rounded-l-2xl'}
                  onClick={() => setActiveField(activeField === 'what' ? null : 'what')}
                >
                  <p className="text-xs font-bold text-gray-800 mb-0.5 uppercase tracking-wide">Was</p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedCatLabel ?? 'Kategorie wählen'}
                  </p>
                </div>

                <div className="w-px bg-gray-200 self-stretch my-3" />

                {/* Feld 2: Wann */}
                <div
                  className={fieldCls('when')}
                  onClick={() => setActiveField(activeField === 'when' ? null : 'when')}
                >
                  <p className="text-xs font-bold text-gray-800 mb-0.5 uppercase tracking-wide">Wann</p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedDate ? formatDE(selectedDate) : 'Datum wählen'}
                  </p>
                </div>

                <div className="w-px bg-gray-200 self-stretch my-3" />

                {/* Feld 3: Wo */}
                <div
                  className={fieldCls('where')}
                  onClick={() => setActiveField(activeField === 'where' ? null : 'where')}
                >
                  <p className="text-xs font-bold text-gray-800 mb-0.5 uppercase tracking-wide">Wo</p>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedRegion || 'Bundesland wählen'}
                  </p>
                </div>

                {/* Suchen-Button */}
                <div className="flex items-center px-3">
                  <button
                    onClick={handleSearch}
                    className="btn-primary w-12 h-12 flex items-center justify-center text-xl shrink-0"
                    aria-label="Suchen"
                  >
                    🔍
                  </button>
                </div>
              </div>
            </div>

            {/* Panel: Kategorie */}
            {activeField === 'what' && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-72 overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => { setSelectedCategory(''); setActiveField(null) }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                      !selectedCategory ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">🎪</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Alle Kategorien</p>
                      <p className="text-xs text-gray-400">Alle Angebote anzeigen</p>
                    </div>
                  </button>
                  {KATEGORIEN.map(k => (
                    <button
                      key={k.id}
                      onClick={() => { setSelectedCategory(k.id); setActiveField(null) }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        selectedCategory === k.id ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{EMOJI[k.id]}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{k.label}</p>
                        <p className="text-xs text-gray-400">{KATEGORIE_DESC[k.id]}</p>
                      </div>
                      {selectedCategory === k.id && (
                        <span className="ml-auto text-gray-900">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Panel: Kalender */}
            {activeField === 'when' && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5">
                <CalendarPanel
                  value={selectedDate}
                  onChange={d => { setSelectedDate(d); setActiveField(null) }}
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="mt-3 text-xs text-gray-400 hover:text-gray-700 underline transition-colors"
                  >
                    Datum löschen
                  </button>
                )}
              </div>
            )}

            {/* Panel: Region */}
            {activeField === 'where' && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-72 overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => { setSelectedRegion(''); setActiveField(null) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors text-left ${
                      !selectedRegion ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span>🇩🇪</span>
                    <span className="text-sm font-semibold text-gray-900">Ganz Deutschland</span>
                    {!selectedRegion && <span className="ml-auto text-gray-900">✓</span>}
                  </button>
                  {regions.map(r => (
                    <button
                      key={r}
                      onClick={() => { setSelectedRegion(r); setActiveField(null) }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors text-left ${
                        selectedRegion === r ? 'bg-gray-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm text-gray-900">{r}</span>
                      {selectedRegion === r && <span className="text-gray-900">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Listings nach Kategorie ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {listingsLoading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Angebote werden geladen …</p>
          </div>
        ) : (
          grouped.map(cat => <CategoryRow key={cat.id} category={cat} />)
        )}
      </div>

    </main>
  )
}
