'use server'

import { createSupabaseServer } from '@/lib/supabase-server'

// Identische Logik wie im Frontend — serverseitig maßgeblich
function calcAmountCents(priceModel, priceCents, quantity) {
  const qty = Math.max(1, parseInt(quantity) || 1)
  switch (priceModel) {
    case 'flat':       return priceCents
    case 'per_person': return qty * priceCents
    case 'flat_plus':  return priceCents  // Grundpreis; qty ist informatorisch für den Anbieter
    case 'hourly':     return qty * priceCents
    case 'on_request': return 0
    default:           return priceCents
  }
}

export async function submitBooking({ listingId, eventDate, quantity }) {
  const supabase = await createSupabaseServer()

  // Session prüfen
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  // Nur Kunden dürfen buchen
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'customer') return { error: 'Nur Kunden können Buchungsanfragen stellen.' }

  // Listing serverseitig laden — Client-Angaben zu Preis/Modell werden IGNORIERT
  const { data: listing } = await supabase
    .from('listings')
    .select('id, price_cents, price_model, provider_id, is_active')
    .eq('id', listingId)
    .eq('is_active', true)
    .single()

  if (!listing) return { error: 'Angebot nicht gefunden oder nicht mehr aktiv.' }
  if (listing.provider_id === user.id) return { error: 'Du kannst dein eigenes Angebot nicht anfragen.' }

  // Serverseitige Neuberechnung — Schutz vor manipulierten Client-Werten
  const qty = Math.max(1, parseInt(quantity) || 1)
  const amount_cents = calcAmountCents(listing.price_model, listing.price_cents, qty)

  const { error: insertError } = await supabase.from('bookings').insert({
    listing_id:           listing.id,
    customer_id:          user.id,
    provider_id:          listing.provider_id,
    event_date:           eventDate,
    status:               'pending',
    quantity:             qty,
    price_model:          listing.price_model ?? 'flat',
    price_snapshot_cents: listing.price_cents,
    amount_cents,
    commission_cents:     0,     // DB-Trigger überschreibt
    provider_payout_cents: 0,    // DB-Trigger überschreibt
  })

  if (insertError) return { error: insertError.message }
  return { error: null }
}
