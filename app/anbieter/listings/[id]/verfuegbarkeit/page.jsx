'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// ── Datums-Hilfsfunktionen ────────────────────────────────────────────────────

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(dateOrStr, n) {
  const d = typeof dateOrStr === 'string' ? parseDate(dateOrStr) : new Date(dateOrStr)
  d.setDate(d.getDate() + n)
  return d
}

function getDaysInMonth(year, month) {
  const days = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

// Erster Wochentag (Mo=0, So=6)
function getFirstDow(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7
}

// Ranges aus DB → Set<string>
function expandRanges(ranges, rangeStart, rangeEnd) {
  const days = new Set()
  for (const r of ranges) {
    const from = r.blocked_from
    const until = r.blocked_until
    const d = parseDate(from < rangeStart ? rangeStart : from)
    const end = parseDate(until > rangeEnd ? rangeEnd : until)
    while (d <= end) {
      days.add(formatDate(d))
      d.setDate(d.getDate() + 1)
    }
  }
  return days
}

// Set<string> → [{blocked_from, blocked_until}] (zusammenhängende Bereiche)
function groupConsecutive(dayStrs) {
  const sorted = [...dayStrs].sort()
  if (!sorted.length) return []
  const ranges = []
  let start = sorted[0], prev = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i]
    const diff = (parseDate(curr) - parseDate(prev)) / 86400000
    if (diff === 1) { prev = curr }
    else { ranges.push({ blocked_from: start, blocked_until: prev }); start = curr; prev = curr }
  }
  ranges.push({ blocked_from: start, blocked_until: prev })
  return ranges
}

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

// ── Haupt-Komponente ──────────────────────────────────────────────────────────

export default function VerfuegbarkeitPage() {
  const { id } = useParams()
  const router = useRouter()

  const [listing, setListing]                 = useState(null)
  const [pendingBlocked, setPendingBlocked]   = useState(new Set())
  const [savedBlocked, setSavedBlocked]       = useState(new Set())
  const [bookedDays, setBookedDays]           = useState(new Set())
  const [setupCount, setSetupCount]           = useState(0)
  const [pendingSetupCount, setPendingSetupCount] = useState(0)
  const [loading, setLoading]                 = useState(true)
  const [saving, setSaving]                   = useState(false)
  const [error, setError]                     = useState(null)
  const [success, setSuccess]                 = useState(false)

  // Drag-State
  const [isDragging, setIsDragging]   = useState(false)
  const dragIntentRef                 = useRef(null)

  // 3 Monate ab heute (fest, kein Blättern für Anbieter-Ansicht)
  const todayLocal = useMemo(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return t
  }, [])

  const months = useMemo(() =>
    [0, 1, 2].map(n => {
      const d = new Date(todayLocal.getFullYear(), todayLocal.getMonth() + n, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    }), [todayLocal])

  const rangeStart = useMemo(() => formatDate(new Date(months[0].year, months[0].month, 1)), [months])
  const rangeEnd   = useMemo(() => formatDate(new Date(months[2].year, months[2].month + 1, 0)), [months])

  // Daten laden
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [listingRes, availRes, bookingRes] = await Promise.all([
        supabase.from('listings').select('id, title, setup_days')
          .eq('id', id).eq('provider_id', user.id).single(),
        supabase.from('listing_availability').select('blocked_from, blocked_until, reason')
          .eq('listing_id', id)
          .lte('blocked_from', rangeEnd).gte('blocked_until', rangeStart),
        supabase.from('bookings').select('event_date')
          .eq('listing_id', id).in('status', ['accepted', 'paid'])
          .gte('event_date', rangeStart).lte('event_date', rangeEnd),
      ])

      if (!listingRes.data) { router.replace('/anbieter/listings'); return }

      const sc = listingRes.data.setup_days ?? 0
      setListing(listingRes.data)
      setSetupCount(sc)
      setPendingSetupCount(sc)

      const blocked = expandRanges(availRes.data ?? [], rangeStart, rangeEnd)
      setPendingBlocked(blocked)
      setSavedBlocked(new Set(blocked))

      const booked = new Set((bookingRes.data ?? []).map(b => b.event_date))
      setBookedDays(booked)

      setLoading(false)
    }
    load()
  }, [id, router, rangeStart, rangeEnd])

  // Aufbautage berechnen (X Tage VOR jedem Buchungstag)
  const setupDays = useMemo(() => {
    const s = new Set()
    for (const bd of bookedDays) {
      for (let i = 1; i <= pendingSetupCount; i++) {
        const ds = formatDate(addDays(bd, -i))
        if (ds >= rangeStart && ds <= rangeEnd) s.add(ds)
      }
    }
    return s
  }, [bookedDays, pendingSetupCount, rangeStart, rangeEnd])

  // Status eines Tages ermitteln
  const getDayStatus = useCallback((dateStr) => {
    if (bookedDays.has(dateStr)) return 'booked'
    if (setupDays.has(dateStr)) return 'setup'
    if (pendingBlocked.has(dateStr)) return 'blocked'
    return 'free'
  }, [bookedDays, setupDays, pendingBlocked])

  // Tag togglen (nur wenn nicht booked/setup/vergangen)
  const applyDay = useCallback((dateStr, intent) => {
    if (parseDate(dateStr) < todayLocal) return
    const status = getDayStatus(dateStr)
    if (status === 'booked' || status === 'setup') return
    setPendingBlocked(prev => {
      const next = new Set(prev)
      intent === 'add' ? next.add(dateStr) : next.delete(dateStr)
      return next
    })
  }, [getDayStatus, todayLocal])

  const handleDayMouseDown = useCallback((dateStr) => {
    if (parseDate(dateStr) < todayLocal) return
    const status = getDayStatus(dateStr)
    if (status === 'booked' || status === 'setup') return
    const intent = status === 'blocked' ? 'remove' : 'add'
    dragIntentRef.current = intent
    setIsDragging(true)
    applyDay(dateStr, intent)
  }, [getDayStatus, applyDay, todayLocal])

  const handleDayMouseEnter = useCallback((dateStr) => {
    if (!isDragging || !dragIntentRef.current) return
    applyDay(dateStr, dragIntentRef.current)
  }, [isDragging, applyDay])

  // Globaler mouseup-Handler für Drag-Ende
  useEffect(() => {
    const stop = () => setIsDragging(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  function blockMonth(year, month) {
    const days = getDaysInMonth(year, month)
    setPendingBlocked(prev => {
      const next = new Set(prev)
      for (const d of days) {
        const ds = formatDate(d)
        if (d >= todayLocal && !bookedDays.has(ds) && !setupDays.has(ds)) next.add(ds)
      }
      return next
    })
  }

  function releaseMonth(year, month) {
    const days = getDaysInMonth(year, month)
    setPendingBlocked(prev => {
      const next = new Set(prev)
      for (const d of days) next.delete(formatDate(d))
      return next
    })
  }

  const isModified = useMemo(() => {
    if (pendingSetupCount !== setupCount) return true
    if (pendingBlocked.size !== savedBlocked.size) return true
    for (const d of pendingBlocked) if (!savedBlocked.has(d)) return true
    return false
  }, [pendingBlocked, savedBlocked, pendingSetupCount, setupCount])

  // Speichern
  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      // Setup-Tage speichern
      if (pendingSetupCount !== setupCount) {
        const { error: e } = await supabase.from('listings')
          .update({ setup_days: pendingSetupCount }).eq('id', id)
        if (e) throw e
        setSetupCount(pendingSetupCount)
      }

      // Bestehende überlappende Einträge laden
      const { data: existing } = await supabase.from('listing_availability')
        .select('id, blocked_from, blocked_until, reason')
        .eq('listing_id', id)
        .lte('blocked_from', rangeEnd).gte('blocked_until', rangeStart)

      // Alle überlappenden löschen
      if (existing?.length) {
        await supabase.from('listing_availability')
          .delete().in('id', existing.map(e => e.id))
      }

      // Teile ausserhalb des Fensters wieder einfügen (trimmen)
      const trimmed = []
      for (const entry of existing ?? []) {
        if (entry.blocked_from < rangeStart) {
          const until = formatDate(addDays(rangeStart, -1))
          if (entry.blocked_from <= until)
            trimmed.push({ listing_id: id, blocked_from: entry.blocked_from, blocked_until: until, reason: entry.reason })
        }
        if (entry.blocked_until > rangeEnd) {
          const from = formatDate(addDays(rangeEnd, 1))
          if (from <= entry.blocked_until)
            trimmed.push({ listing_id: id, blocked_from: from, blocked_until: entry.blocked_until, reason: entry.reason })
        }
      }
      if (trimmed.length) await supabase.from('listing_availability').insert(trimmed)

      // Neue Einträge für pendingBlocked einfügen
      const daysInRange = [...pendingBlocked].filter(d => d >= rangeStart && d <= rangeEnd)
      const ranges = groupConsecutive(daysInRange)
      if (ranges.length) {
        await supabase.from('listing_availability').insert(
          ranges.map(r => ({ listing_id: id, blocked_from: r.blocked_from, blocked_until: r.blocked_until, reason: 'manuell' }))
        )
      }

      setSavedBlocked(new Set(pendingBlocked))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message ?? 'Speichern fehlgeschlagen.')
    }
    setSaving(false)
  }

  function handleDiscard() {
    setPendingBlocked(new Set(savedBlocked))
    setPendingSetupCount(setupCount)
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  function renderMonth({ year, month }) {
    const days = getDaysInMonth(year, month)
    const firstDow = getFirstDow(year, month)

    return (
      <div key={`${year}-${month}`} className="min-w-0">
        {/* Monatskopf */}
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 text-sm">
            {MONTH_NAMES[month]} {year}
          </h3>
          <div className="flex gap-1">
            <button
              type="button" onClick={() => blockMonth(year, month)}
              className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Alle blockieren
            </button>
            <button
              type="button" onClick={() => releaseMonth(year, month)}
              className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Alle freigeben
            </button>
          </div>
        </div>

        {/* Wochentage */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-xs text-gray-400 text-center py-1 font-medium">{wd}</div>
          ))}
        </div>

        {/* Tage */}
        <div className="grid grid-cols-7 gap-0.5 select-none">
          {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {days.map(d => {
            const ds = formatDate(d)
            const isPast = d < todayLocal
            const status = getDayStatus(ds)

            let cls = 'aspect-square rounded text-xs flex items-center justify-center font-medium transition-colors '
            if (isPast) {
              cls += 'text-gray-200 cursor-default'
            } else if (status === 'booked') {
              cls += 'bg-red-500 text-white cursor-not-allowed'
            } else if (status === 'setup') {
              cls += 'bg-orange-300 text-white cursor-not-allowed'
            } else if (status === 'blocked') {
              cls += 'bg-gray-700 text-white cursor-pointer hover:bg-gray-600'
            } else {
              cls += 'bg-green-50 text-gray-700 cursor-pointer hover:bg-green-100 border border-green-100'
            }

            return (
              <div
                key={ds} className={cls}
                onMouseDown={() => handleDayMouseDown(ds)}
                onMouseEnter={() => handleDayMouseEnter(ds)}
              >
                {d.getDate()}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50">      <main className="flex items-center justify-center h-48"><p className="text-gray-400">Laden …</p></main>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
            <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/anbieter/listings" className="hover:text-gray-600">Meine Angebote</Link>
          <span>›</span>
          <Link href={`/anbieter/listings/${id}/bearbeiten`} className="hover:text-gray-600 truncate max-w-[180px]">
            {listing?.title ?? '…'}
          </Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">Verfügbarkeit</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verfügbarkeit verwalten</h1>
        <p className="text-gray-500 text-sm mb-8">
          Klicken oder Ziehen zum Markieren. Rote Tage (Buchungen) sind nicht änderbar.
        </p>

        {/* Aufbauzeit-Einstellung */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Aufbauzeit vor Event:
          </label>
          <select
            value={pendingSetupCount}
            onChange={e => setPendingSetupCount(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[0,1,2,3,4,5,6,7].map(n => (
              <option key={n} value={n}>{n === 0 ? 'Keine' : `${n} Tag${n > 1 ? 'e' : ''}`}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400">
            Diese Tage werden vor jeder bestätigten Buchung automatisch geblockt (orange).
          </p>
        </div>

        {/* Legende */}
        <div className="flex flex-wrap gap-4 mb-6 text-xs">
          {[
            { color: 'bg-green-50 border border-green-100', label: 'Frei (buchbar)' },
            { color: 'bg-gray-700',    label: 'Blockiert (manuell)' },
            { color: 'bg-red-500',     label: 'Gebucht (nicht änderbar)' },
            { color: 'bg-orange-300',  label: 'Aufbauzeit (automatisch)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-gray-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Kalender — 3 Monate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {months.map(m => renderMonth(m))}
        </div>

        {/* Fehlermeldung */}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {/* Erfolg */}
        {success && (
          <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
            Verfügbarkeit gespeichert ✓
          </p>
        )}

        {/* Aktions-Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            type="button" onClick={handleSave}
            disabled={saving || !isModified}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Wird gespeichert …' : 'Speichern'}
          </button>
          <button
            type="button" onClick={handleDiscard}
            disabled={!isModified}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Verwerfen
          </button>
        </div>
      </main>
    </div>
  )
}
