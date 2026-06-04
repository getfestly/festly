'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { submitBooking } from '@/app/actions/booking'
import { trackEvent } from '@/lib/analytics'
import { VEHICLE_TYPES } from '@/lib/constants'
import { eur } from '@/lib/pricing'

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

function getDaysInMonth(year, month) {
  const days = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
  return days
}

function diffDays(fromStr, toStr) {
  return Math.round((parseDate(toStr) - parseDate(fromStr)) / 86400000) + 1
}

function expandRanges(ranges) {
  const set = new Set()
  for (const { blocked_from, blocked_until } of ranges) {
    const d = parseDate(blocked_from)
    const end = parseDate(blocked_until)
    while (d <= end) { set.add(formatDate(d)); d.setDate(d.getDate() + 1) }
  }
  return set
}

// ── Preis-Berechnung ─────────────────────────────────────────────────────────

function calcBaseCents(listing, quantity, days) {
  const qty = Math.max(1, parseInt(quantity) || 1)
  switch (listing.price_model) {
    case 'flat':       return listing.price_cents * days
    case 'per_person': return qty * listing.price_cents
    case 'flat_plus':  return listing.price_cents
    case 'hourly':     return qty * listing.price_cents
    case 'on_request': return 0
    default:           return listing.price_cents
  }
}

// PLZ-Hilfsfunktionen (Fahrtkosten)
function extractPlz(region) {
  if (!region) return null
  const match = region.match(/\b(\d{5})\b/)
  if (match) return match[1]
  return region.trim().split(/[\s,]+/)[0]
}

async function geocode(query) {
  const q = encodeURIComponent(`${query}, Deutschland`)
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=de`,
    { headers: { 'Accept-Language': 'de' } }
  )
  const data = await res.json()
  if (!data?.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

async function getRouteKm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`
  const res = await fetch(url)
  const data = await res.json()
  if (data.code !== 'Ok') return null
  return data.routes[0].distance / 1000
}

// ── Mini-Kalender-Komponente ──────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

function MiniCalendar({ dateFrom, dateTo, onDateFrom, onDateTo, blockedDays, todayStr, setupDaysCount }) {
  const today = parseDate(todayStr)
  const [calYear, setCalYear]   = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [picking, setPicking]   = useState('from') // 'from' | 'to'

  const days = getDaysInMonth(calYear, calMonth)
  const firstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  function handleDayClick(ds) {
    const d = parseDate(ds)
    if (d < today || blockedDays.has(ds)) return

    if (picking === 'from' || !dateFrom) {
      onDateFrom(ds)
      onDateTo('')
      setPicking('to')
    } else {
      // picking 'to'
      if (ds < dateFrom) { onDateFrom(ds); onDateTo(''); setPicking('to') }
      else { onDateTo(ds); setPicking('from') }
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button type="button" onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {MONTH_NAMES[calMonth]} {calYear}
        </span>
        <button type="button" onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          ›
        </button>
      </div>

      <div className="p-3">
        {/* Wochentage */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="text-xs text-gray-400 text-center py-0.5 font-medium">{wd}</div>
          ))}
        </div>

        {/* Tage */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {days.map(d => {
            const ds = formatDate(d)
            const isPast    = d < today
            const isBlocked = blockedDays.has(ds)
            const isFrom    = ds === dateFrom
            const isTo      = ds === dateTo
            const inRange   = dateFrom && dateTo && ds > dateFrom && ds < dateTo
            const isToday   = ds === todayStr

            let cls = 'aspect-square rounded text-xs flex items-center justify-center transition-colors font-medium '
            if (isPast || isBlocked) {
              cls += 'text-gray-300 cursor-not-allowed' + (isBlocked ? ' bg-red-50' : '')
            } else if (isFrom || isTo) {
              cls += 'bg-gray-900 text-white cursor-pointer'
            } else if (inRange) {
              cls += 'bg-gray-100 text-gray-700 cursor-pointer'
            } else if (isToday) {
              cls += 'border border-gray-400 text-gray-900 cursor-pointer hover:bg-gray-100'
            } else {
              cls += 'text-gray-700 cursor-pointer hover:bg-gray-100'
            }

            return (
              <div key={ds} className={cls} onClick={() => handleDayClick(ds)}>
                {d.getDate()}
              </div>
            )
          })}
        </div>
      </div>

      {/* Hinweis Aufbauzeit */}
      {setupDaysCount > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-orange-50">
          <p className="text-xs text-orange-700">
            ⚠️ Aufbauzeit: {setupDaysCount} Tag{setupDaysCount > 1 ? 'e' : ''} werden zusätzlich vor deinem Event reserviert.
          </p>
        </div>
      )}

      {/* Auswahl-Anzeige */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex gap-4">
        <div>
          <p className="text-xs text-gray-400">Von</p>
          <p className="text-sm font-medium text-gray-900">{dateFrom || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Bis</p>
          <p className="text-sm font-medium text-gray-900">{dateTo || dateFrom || '—'}</p>
        </div>
        {dateFrom && (
          <div className="ml-auto">
            <p className="text-xs text-gray-400">Tage</p>
            <p className="text-sm font-medium text-gray-900">
              {dateTo ? diffDays(dateFrom, dateTo) : 1}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Haupt-Seite ───────────────────────────────────────────────────────────────

export default function AnfragenPage() {
  const { id: listingId } = useParams()
  const router = useRouter()

  const [listing, setListing]               = useState(null)
  const [providerRegion, setProviderRegion] = useState(null)
  const [blockedDays, setBlockedDays]       = useState(new Set())
  const [eventDateFrom, setEventDateFrom]   = useState('')
  const [eventDateTo, setEventDateTo]       = useState('')
  const [quantity, setQuantity]             = useState('1')
  const [eventTitle, setEventTitle]         = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventStreet, setEventStreet]       = useState('')
  const [eventHouseNumber, setEventHouseNumber] = useState('')
  const [eventZip, setEventZip]             = useState('')
  const [eventCity, setEventCity]           = useState('')
  const [transportKm, setTransportKm]       = useState(null)
  const [transportCents, setTransportCents] = useState(0)
  const [transportLoading, setTransportLoading] = useState(false)
  const [transportError, setTransportError] = useState(null)
  const [error, setError]                   = useState(null)
  const [loading, setLoading]               = useState(false)
  const [user, setUser]                     = useState(null)

  const today    = useMemo(() => { const t = new Date(); t.setHours(0,0,0,0); return t }, [])
  const todayStr = useMemo(() => formatDate(today), [today])

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [listingRes] = await Promise.all([
        supabase.from('listings')
          .select('id, title, price_cents, price_model, price_unit_label, provider_id, vehicle_type, setup_days')
          .eq('id', listingId).eq('is_active', true).single(),
      ])

      if (!listingRes.data) { router.replace('/marktplatz'); return }
      const listing = listingRes.data

      const [profileRes, availRes, bookingRes] = await Promise.all([
        supabase.from('profiles').select('region').eq('id', listing.provider_id).single(),
        supabase.from('listing_availability').select('blocked_from, blocked_until').eq('listing_id', listingId),
        supabase.from('bookings').select('event_date')
          .eq('listing_id', listingId).in('status', ['accepted', 'paid']),
      ])

      const blocked = expandRanges(availRes.data ?? [])
      for (const { event_date } of bookingRes.data ?? []) {
        if (event_date) blocked.add(event_date)
      }

      setUser(user)
      setListing(listing)
      setProviderRegion(profileRes.data?.region ?? null)
      setBlockedDays(blocked)

      trackEvent('booking_started', { listing_id: listing.id, provider_id: listing.provider_id })
    }
    check()
  }, [listingId, router])

  async function calcTransport(plz) {
    if (!plz || plz.length < 4) return
    setTransportLoading(true)
    setTransportError(null)
    setTransportKm(null)
    setTransportCents(0)
    try {
      const providerPlz = extractPlz(providerRegion)
      if (!providerPlz) {
        setTransportError('Anbieter-Standort nicht verfügbar — Fahrtkosten bitte direkt abstimmen.')
        setTransportLoading(false)
        return
      }
      const [fromCoord, toCoord] = await Promise.all([geocode(providerPlz), geocode(plz)])
      if (!fromCoord || !toCoord) {
        setTransportError('PLZ nicht gefunden — Fahrtkosten bitte mit dem Anbieter abstimmen.')
        setTransportLoading(false)
        return
      }
      const km = await getRouteKm(fromCoord, toCoord)
      if (km == null) {
        setTransportError('Route konnte nicht berechnet werden — Fahrtkosten bitte abstimmen.')
        setTransportLoading(false)
        return
      }
      const vehicleType = VEHICLE_TYPES.find(v => v.id === listing.vehicle_type) ?? VEHICLE_TYPES[0]
      const cents = Math.round(km * 2 * vehicleType.rate_per_km_cents)
      setTransportKm(Math.round(km))
      setTransportCents(cents)
    } catch {
      setTransportError('Fahrtkosten konnten nicht berechnet werden.')
      setTransportCents(0)
    }
    setTransportLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!eventDateFrom) { setError('Bitte wähle ein Datum.'); return }
    setError(null)
    setLoading(true)

    try {
      const result = await submitBooking({
        listingId,
        eventDateFrom,
        eventDateTo: eventDateTo || eventDateFrom,
        quantity,
        eventTitle,
        eventDescription,
        transportCents,
        eventStreet,
        eventHouseNumber,
        eventZip,
        eventCity,
      })

      if (result.error) { setError(result.error); return }

      const days = eventDateTo ? diffDays(eventDateFrom, eventDateTo) : 1
      trackEvent('booking_submitted', {
        listing_id:   listingId,
        amount_cents: calcBaseCents(listing, quantity, days) + transportCents,
        price_model:  listing?.price_model,
      })
      router.push('/mein-bereich/anfragen')
    } catch (err) {
      console.error('[AnfragenPage] handleSubmit Fehler:', err)
      setError('Netzwerkfehler. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50">        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const needsQuantity = ['per_person', 'flat_plus', 'hourly'].includes(listing.price_model)
  const qty    = Math.max(1, parseInt(quantity) || 1)
  const days   = eventDateTo ? diffDays(eventDateFrom, eventDateTo) : (eventDateFrom ? 1 : 1)
  // flat_plus hat immer einen festen Grundpreis, unabhängig vom Datum
  const baseCents = listing.price_model === 'flat_plus'
    ? listing.price_cents
    : (eventDateFrom ? calcBaseCents(listing, qty, days) : 0)
  const totalCents = baseCents + transportCents
  const payoutCents = Math.round(totalCents * 0.85)
  const vehicleType = VEHICLE_TYPES.find(v => v.id === listing.vehicle_type) ?? VEHICLE_TYPES[0]
  const rateEur = (vehicleType.rate_per_km_cents / 100).toFixed(2)

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  const rows = []
  if (listing.price_model === 'on_request') {
    rows.push({ label: 'Preis auf Anfrage', value: null })
  } else if (listing.price_model === 'flat') {
    rows.push({ label: `${days} Tag${days !== 1 ? 'e' : ''} × ${eur(listing.price_cents)}`, value: eur(baseCents), sub: null })
  } else if (listing.price_model === 'per_person') {
    rows.push({ label: `${qty} ${listing.price_unit_label ?? 'Personen'}`, value: eur(baseCents), sub: `${eur(listing.price_cents)} / ${listing.price_unit_label ?? 'Person'}` })
  } else if (listing.price_model === 'flat_plus') {
    rows.push({ label: 'Grundpreis', value: eur(listing.price_cents) })
    rows.push({ label: `+ Aufpreis je ${listing.price_unit_label ?? 'Einheit'}`, value: 'auf Anfrage' })
  } else if (listing.price_model === 'hourly') {
    rows.push({ label: `${qty} ${listing.price_unit_label ?? 'Stunden'}`, value: eur(baseCents), sub: `${eur(listing.price_cents)} / ${listing.price_unit_label ?? 'Stunde'}` })
  }
  if (transportCents > 0) {
    rows.push({ label: '+ Fahrtkosten', value: `+${eur(transportCents)}`, sub: transportKm ? `ca. ${transportKm * 2} km × ${rateEur} €` : null })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-md mx-auto px-4 py-8">
        <Link href={`/angebote/${listingId}`} className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zum Angebot
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buchungsanfrage</h1>
        <p className="text-gray-500 mb-8">{listing.title}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

          {/* 1. Datum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datum wählen *
              {blockedDays.size > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal">Graue Tage = nicht verfügbar</span>
              )}
            </label>
            <MiniCalendar
              dateFrom={eventDateFrom}
              dateTo={eventDateTo}
              onDateFrom={setEventDateFrom}
              onDateTo={setEventDateTo}
              blockedDays={blockedDays}
              todayStr={todayStr}
              setupDaysCount={listing.setup_days ?? 0}
            />
          </div>

          {/* 2. Adresse des Veranstaltungsorts */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Adresse des Veranstaltungsorts</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Straße *</label>
                <input
                  type="text" required value={eventStreet}
                  onChange={e => setEventStreet(e.target.value)}
                  placeholder="Musterstraße"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Hausnummer *</label>
                <input
                  type="text" required value={eventHouseNumber}
                  onChange={e => setEventHouseNumber(e.target.value)}
                  placeholder="12a"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">PLZ *</label>
                <input
                  type="text" required value={eventZip}
                  onChange={e => setEventZip(e.target.value)}
                  onBlur={e => calcTransport(e.target.value.trim())}
                  placeholder="80331" maxLength={10}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Stadt *</label>
                <input
                  type="text" required value={eventCity}
                  onChange={e => setEventCity(e.target.value)}
                  placeholder="München"
                  className={inputCls}
                />
              </div>
            </div>

            {transportLoading && <p className="text-xs text-gray-400">Fahrtkosten werden berechnet …</p>}
            {transportError && !transportLoading && <p className="text-xs text-amber-600">{transportError}</p>}
            {transportKm != null && !transportLoading && (
              <p className="text-xs text-gray-400">Anfahrt ca. {transportKm} km — Hin- und Rückfahrt berücksichtigt</p>
            )}
          </div>

          {/* 3. Anzahl */}
          {needsQuantity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Anzahl *</label>
              <input type="number" required min="1" step="1" value={quantity}
                onChange={e => setQuantity(e.target.value)} className={inputCls} />
            </div>
          )}

          {/* 4. Wie heißt dein Event */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Wie heißt dein Event? *</label>
            <input type="text" required maxLength={100} value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              placeholder="z.B. Hochzeit, Geburtstag, Firmenfest, Stadtfest …"
              className={inputCls} />
          </div>

          {/* 5. Beschreibe dein Event — wächst automatisch mit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibe dein Event</label>
            <textarea
              maxLength={1000} value={eventDescription}
              onChange={e => setEventDescription(e.target.value)}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              placeholder="Wie viele Gäste? Besondere Wünsche?"
              className={`${inputCls} resize-none overflow-hidden`}
              style={{ minHeight: '4.5rem' }}
            />
          </div>

          {/* 6. Preisvorschau */}
          {listing.price_model !== 'on_request' ? (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2">
              {rows.map((row, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    {row.value != null && <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{row.value}</span>}
                  </div>
                  {row.sub && <p className="text-xs text-gray-400 mt-0.5">{row.sub}</p>}
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-gray-900">Gesamtbetrag</span>
                  <span className="text-xl font-bold text-gray-900">{eur(totalCents)}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs text-gray-400">Davon Auszahlung an Anbieter (85 %)</span>
                  <span className="text-xs text-gray-500 font-medium">{eur(payoutCents)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 pt-1">Zahlung erst nach Annahme durch den Anbieter.</p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-500">Preis auf Anfrage — der Anbieter nennt dir den Betrag nach der Anfrage.</p>
              {transportCents > 0 && <p className="text-xs text-gray-400 mt-1">+ geschätzte Fahrtkosten: {eur(transportCents)}</p>}
            </div>
          )}

          {/* 7. Absenden */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button type="submit" disabled={loading || !eventDateFrom}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
            {loading ? 'Wird gesendet …' : 'Anfrage absenden'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Du wirst noch nicht belastet — der Anbieter muss zuerst annehmen.
          </p>
        </form>
      </main>
    </div>
  )
}
