'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendNewBookingToProvider } from '@/lib/email'
import { validateNoContact } from '@/lib/contentFilter'

function calcAmountCents(priceModel, priceCents, quantity, days) {
  const qty = Math.max(1, parseInt(quantity) || 1)
  const d   = Math.max(1, days)
  switch (priceModel) {
    case 'flat':       return priceCents * d
    case 'per_person': return qty * priceCents
    case 'flat_plus':  return priceCents
    case 'hourly':     return qty * priceCents
    case 'on_request': return 0
    default:           return priceCents
  }
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function dayDiff(fromStr, toStr) {
  const parse = (s) => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d) }
  return Math.round((parse(toStr) - parse(fromStr)) / 86400000) + 1
}

// Prüft ob zwei Zeiträume überschneiden
function overlaps(aFrom, aUntil, bFrom, bUntil) {
  return aFrom <= bUntil && aUntil >= bFrom
}

export async function submitBooking({
  listingId, eventDateFrom, eventDateTo, quantity,
  eventTitle, eventDescription, transportCents = 0,
  // Legacy-Compat: falls noch eventDate übergeben wird
  eventDate,
}) {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const contactErr =
    validateNoContact(eventTitle) ??
    validateNoContact(eventDescription)
  if (contactErr) return { error: contactErr }

  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('id', user.id).single()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, price_cents, price_model, provider_id, is_active, setup_days')
    .eq('id', listingId).eq('is_active', true).single()

  if (!listing) return { error: 'Angebot nicht gefunden oder nicht mehr aktiv.' }
  if (listing.provider_id === user.id) return { error: 'Du kannst dein eigenes Angebot nicht anfragen.' }

  // Datum normalisieren (Rückwärtskompatibilität)
  const dateFrom = eventDateFrom ?? eventDate
  const dateTo   = eventDateTo ?? dateFrom
  if (!dateFrom) return { error: 'Bitte wähle ein Datum.' }

  const setupDays = listing.setup_days ?? 0
  // Gesperrter Bereich: setup_days vor Event bis Event-Ende
  const blockedFrom  = setupDays > 0 ? addDays(dateFrom, -setupDays) : dateFrom
  const blockedUntil = dateTo

  // ── Verfügbarkeitsprüfung ───────────────────────────────────────────────────

  // 1. Bestehende Buchungen (accepted/paid) prüfen
  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('event_date, event_date_end')
    .eq('listing_id', listingId)
    .in('status', ['accepted', 'paid'])

  for (const b of existingBookings ?? []) {
    const bFrom  = b.event_date
    const bUntil = b.event_date_end ?? b.event_date
    if (overlaps(blockedFrom, blockedUntil, bFrom, bUntil)) {
      return { error: 'Dieser Zeitraum ist leider nicht mehr verfügbar.' }
    }
  }

  // 2. listing_availability prüfen
  const { data: availability } = await supabase
    .from('listing_availability')
    .select('blocked_from, blocked_until')
    .eq('listing_id', listingId)
    .lte('blocked_from', blockedUntil)
    .gte('blocked_until', blockedFrom)

  if (availability?.length) {
    return { error: 'Dieser Zeitraum ist leider nicht mehr verfügbar.' }
  }

  // ── Buchung erstellen ───────────────────────────────────────────────────────

  const qty = Math.max(1, parseInt(quantity) || 1)
  const days = dayDiff(dateFrom, dateTo)
  const transport = Math.max(0, parseInt(transportCents) || 0)
  const amount_cents = calcAmountCents(listing.price_model, listing.price_cents, qty, days) + transport

  const { error: insertError } = await supabase.from('bookings').insert({
    listing_id:           listing.id,
    customer_id:          user.id,
    provider_id:          listing.provider_id,
    event_date:           dateFrom,
    event_date_end:       dateTo,
    status:               'pending',
    quantity:             qty,
    price_model:          listing.price_model ?? 'flat',
    price_snapshot_cents: listing.price_cents,
    amount_cents,
    commission_cents:     0,
    provider_payout_cents:0,
    event_title:          eventTitle || null,
    event_description:    eventDescription || null,
  })

  if (insertError) return { error: insertError.message }

  // E-Mail an Anbieter (fire-and-forget)
  try {
    const admin = createAdminClient()
    const [{ data: { user: providerUser } }, { data: providerProfile }] = await Promise.all([
      admin.auth.admin.getUserById(listing.provider_id),
      admin.from('profiles').select('display_name').eq('id', listing.provider_id).single(),
    ])
    await sendNewBookingToProvider({
      to: providerUser?.email,
      providerName: providerProfile?.display_name ?? 'Anbieter',
      listingTitle: listing.title,
      customerName: profile?.display_name ?? user.email,
      eventDate: new Date(dateFrom + 'T00:00:00').toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric',
      }),
      amount_cents,
    })
  } catch (e) { console.error('[submitBooking email]', e) }

  return { error: null }
}
