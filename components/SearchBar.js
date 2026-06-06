'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KATEGORIEN, REGION_NAMES, KATEGORIE_EMOJI } from '@/lib/constants'

const KATEGORIE_DESC = {
  fahrgeschaefte:   'Karussells, Achterbahnen & mehr',
  gastro:           'Catering, Foodtrucks & Bars',
  unterhaltung:     'Musik, DJs & Shows',
  ausstattung:      'Technik, Licht & Zelte',
  sanitaer_service: 'Toiletten & Sicherheit',
}

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const DAYS   = ['Mo','Di','Mi','Do','Fr','Sa','So']

function buildDays(year, month) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const total  = new Date(year, month + 1, 0).getDate()
  const days   = []
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= total; d++) days.push(new Date(year, month, d))
  return days
}

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatShort(iso) {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

// ── CalendarPanel — Range Picker ──────────────────────────────────────────────
function CalendarPanel({ dateFrom, dateTo, onDayClick }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [hoverDate, setHoverDate] = useState(null)

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

  // Preview end: dateTo if set, otherwise hoverDate (only when dateFrom set & no dateTo)
  const previewEnd = dateTo ?? (dateFrom && !dateTo ? hoverDate : null)

  function isStart(iso)   { return iso === dateFrom }
  function isEnd(iso)     { return iso === dateTo }
  function isInRange(iso) {
    if (!dateFrom || !previewEnd) return false
    const [a, b] = dateFrom < previewEnd ? [dateFrom, previewEnd] : [previewEnd, dateFrom]
    return iso > a && iso < b
  }

  function renderMonth(year, month, showPrev, showNext) {
    const days = buildDays(year, month)
    return (
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center justify-between mb-3">
          {showPrev
            ? <button type="button" onClick={goPrev} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">←</button>
            : <div className="w-8" />}
          <span className="text-sm font-semibold text-gray-900">{MONTHS[month]} {year}</span>
          {showNext
            ? <button type="button" onClick={goNext} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">→</button>
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
            const isPast = day < today
            const iso    = toISO(day)
            const start  = isStart(iso)
            const end    = isEnd(iso)
            const range  = isInRange(iso)

            let cls = 'aspect-square flex items-center justify-center text-sm transition-colors '
            let style = {}

            if (isPast) {
              cls += 'text-gray-200 cursor-not-allowed rounded-full'
            } else if (start || end) {
              cls += 'rounded-full text-white font-semibold cursor-pointer'
              style = { background: 'linear-gradient(135deg, #C026A0, #7C3AED)' }
            } else if (range) {
              cls += 'bg-purple-100 text-purple-900 rounded-full cursor-pointer hover:bg-purple-200'
            } else {
              cls += 'rounded-full text-gray-800 cursor-pointer hover:bg-gray-100'
            }

            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => onDayClick(iso)}
                onMouseEnter={() => !isPast && setHoverDate(iso)}
                onMouseLeave={() => setHoverDate(null)}
                className={cls}
                style={style}
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

// ── SearchBar ─────────────────────────────────────────────────────────────────
// Props:
//   initialCategory   — vorausgefüllte Kategorie aus URL
//   initialDateFrom   — Von-Datum (ISO) aus URL (?von=)
//   initialDateTo     — Bis-Datum (ISO) aus URL (?bis=)
//   initialRegion     — Region aus URL
//   basePath          — Ziel-Route für Suche (default '/')
export default function SearchBar({
  initialCategory  = '',
  initialDateFrom  = null,
  initialDateTo    = null,
  initialRegion    = '',
  basePath         = '/',
}) {
  const router = useRouter()
  const [activeField,      setActiveField]      = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [dateFrom,         setDateFrom]         = useState(initialDateFrom)
  const [dateTo,           setDateTo]           = useState(initialDateTo)
  const [selectedRegion,   setSelectedRegion]   = useState(initialRegion)
  const searchRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setActiveField(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleDayClick(iso) {
    if (!dateFrom || (dateFrom && dateTo)) {
      // Fresh start
      setDateFrom(iso)
      setDateTo(null)
    } else {
      // dateFrom gesetzt, dateTo fehlt
      if (iso === dateFrom) {
        setDateFrom(null)
        setDateTo(null)
      } else if (iso < dateFrom) {
        setDateFrom(iso)
        setDateTo(null)
      } else {
        setDateTo(iso)
        setActiveField(null) // Range komplett → Panel schließen
      }
    }
  }

  function handleSearch() {
    const p = new URLSearchParams()
    if (selectedCategory) p.set('kategorie', selectedCategory)
    if (dateFrom)         p.set('von',       dateFrom)
    if (dateTo)           p.set('bis',       dateTo)
    if (selectedRegion)   p.set('region',    selectedRegion)
    router.push(basePath + (p.toString() ? '?' + p.toString() : ''))
    setActiveField(null)
  }

  const regions          = Object.values(REGION_NAMES).sort((a, b) => a.localeCompare(b, 'de'))
  const selectedCatLabel = KATEGORIEN.find(k => k.id === selectedCategory)?.label ?? null

  // Wann-Label
  const wann = dateFrom && dateTo
    ? `${formatShort(dateFrom)} – ${formatShort(dateTo)}`
    : dateFrom
    ? `Ab ${formatShort(dateFrom)}`
    : 'Datum wählen'

  const fieldCls = (name) =>
    `flex-1 flex flex-col justify-center px-5 py-3 cursor-pointer min-w-0 transition-colors ${
      activeField === name ? 'bg-white shadow-md rounded-2xl z-10' : 'hover:bg-white/70'
    }`

  return (
    <div ref={searchRef} className="relative">
      <div className={`bg-white rounded-2xl shadow-lg border-2 transition-all ${
        activeField ? 'border-gray-900' : 'border-gray-200'
      }`}>
        <div className="flex items-stretch">

          {/* Was */}
          <div className={fieldCls('what') + ' rounded-l-2xl'}
            onClick={() => setActiveField(activeField === 'what' ? null : 'what')}>
            <p className="text-xs font-bold text-gray-800 mb-0.5 uppercase tracking-wide">Was</p>
            <p className="text-sm text-gray-500 truncate">
              {selectedCatLabel ?? 'Kategorie wählen'}
            </p>
          </div>

          <div className="w-px bg-gray-200 self-stretch my-3" />

          {/* Wann */}
          <div className={fieldCls('when')}
            onClick={() => setActiveField(activeField === 'when' ? null : 'when')}>
            <p className="text-xs font-bold text-gray-800 mb-0.5 uppercase tracking-wide">Wann</p>
            <p className={`text-sm truncate ${dateFrom ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {wann}
            </p>
          </div>

          <div className="w-px bg-gray-200 self-stretch my-3" />

          {/* Wo */}
          <div className={fieldCls('where')}
            onClick={() => setActiveField(activeField === 'where' ? null : 'where')}>
            <p className="text-xs font-bold text-gray-800 mb-0.5 uppercase tracking-wide">Wo</p>
            <p className="text-sm text-gray-500 truncate">
              {selectedRegion || 'Bundesland wählen'}
            </p>
          </div>

          {/* Suchen-Button */}
          <div className="flex items-center px-3">
            <button type="button" onClick={handleSearch}
              className="btn-primary w-12 h-12 flex items-center justify-center text-xl shrink-0"
              aria-label="Suchen">🔍</button>
          </div>
        </div>
      </div>

      {/* Panel: Was */}
      {activeField === 'what' && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-72 overflow-y-auto">
          <div className="p-2">
            <button type="button"
              onClick={() => { setSelectedCategory(''); setActiveField(null) }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${!selectedCategory ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
              <span className="text-2xl">🎪</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Alle Kategorien</p>
                <p className="text-xs text-gray-400">Alle Angebote anzeigen</p>
              </div>
              {!selectedCategory && <span className="ml-auto text-gray-900">✓</span>}
            </button>
            {KATEGORIEN.map(k => (
              <button key={k.id} type="button"
                onClick={() => { setSelectedCategory(k.id); setActiveField(null) }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${selectedCategory === k.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <span className="text-2xl">{KATEGORIE_EMOJI[k.id]}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{k.label}</p>
                  <p className="text-xs text-gray-400">{KATEGORIE_DESC[k.id]}</p>
                </div>
                {selectedCategory === k.id && <span className="ml-auto text-gray-900">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panel: Wann — Range Picker */}
      {activeField === 'when' && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5">
          <CalendarPanel
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDayClick={handleDayClick}
          />
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {!dateFrom
                ? 'Startdatum wählen'
                : !dateTo
                ? 'Enddatum wählen'
                : `${formatShort(dateFrom)} – ${formatShort(dateTo)}`}
            </p>
            {dateFrom && (
              <button type="button"
                onClick={() => { setDateFrom(null); setDateTo(null) }}
                className="text-xs text-gray-400 hover:text-gray-700 underline transition-colors">
                Datum löschen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel: Wo */}
      {activeField === 'where' && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-72 overflow-y-auto">
          <div className="p-2">
            <button type="button"
              onClick={() => { setSelectedRegion(''); setActiveField(null) }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors text-left ${!selectedRegion ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <span>🇩🇪</span>
                <span className="text-sm font-semibold text-gray-900">Ganz Deutschland</span>
              </div>
              {!selectedRegion && <span className="text-gray-900">✓</span>}
            </button>
            {regions.map(r => (
              <button key={r} type="button"
                onClick={() => { setSelectedRegion(r); setActiveField(null) }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors text-left ${selectedRegion === r ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <span className="text-sm text-gray-900">{r}</span>
                {selectedRegion === r && <span className="text-gray-900">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
