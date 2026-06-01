'use server'

import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendNewBookingToProvider } from '@/lib/email'

function calcAmountCents(priceModel, priceCents, quantity) {
  const qty = Math.max(1, parseInt(quantity) || 1)
  switch (priceModel) {
    case 'flat':       return priceCents
    case 'per_person': return qty * priceCents
    case 'flat_plus':  return priceCents
    case 'hourly':     return qty * priceCents
    case 'on_request': return 0
    default:           return priceCents
  }
}

export async function submitBooking({ listingId, eventDate, quantity }) {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt.' }

  const { data: profile } = await supabase
    .from('profiles').select('role, display_name').eq('id', user.id).single()
  if (profile?.role !== 'customer') return { error: 'Nur Kunden können Buchungsanfragen stellen.' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, price_cents, price_model, provider_id, is_active')
    .eq('id', listingId)
    .eq('is_active', true)
    .single()

  if (!listing) return { error: 'Angebot nicht gefunden oder nicht mehr aktiv.' }
  if (listing.provider_id === user.id) return { error: 'Du kannst dein eigenes Angebot nicht anfragen.' }

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
    commission_cents:     0,
    provider_payout_cents: 0,
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
      customerName: profile.display_name ?? user.email,
      eventDate: new Date(eventDate).toLocaleDateString('de-DE', {
        day: '2-digit', month: 'long', year: 'numeric',
      }),
      amount_cents,
    })
  } catch (e) { console.error('[submitBooking email]', e) }

  return { error: null }
}
