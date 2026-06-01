import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendBookingAccepted, sendBookingRejected } from '@/lib/email'

// Anbieter akzeptiert oder lehnt ab — mit E-Mail-Versand an Kunden
export async function POST(request, { params }) {
  const { id: bookingId } = await params

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })

  const { status } = await request.json().catch(() => ({}))
  if (!['accepted', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Status muss "accepted" oder "rejected" sein.' }, { status: 400 })
  }

  // Buchung laden — nur Anbieter darf Accept/Reject
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, event_date, amount_cents, customer_id, provider_id, listings(title)')
    .eq('id', bookingId)
    .eq('provider_id', user.id)    // Nur eigene Buchungen
    .eq('status', 'pending')       // Nur aus "pending" heraus
    .single()

  if (!booking) {
    return NextResponse.json({ error: 'Buchung nicht gefunden oder keine Berechtigung.' }, { status: 404 })
  }

  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status, provider_responded_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // E-Mail an Kunden (fire-and-forget)
  const admin = createAdminClient()
  try {
    const [{ data: { user: customerUser } }, { data: providerProfile }] = await Promise.all([
      admin.auth.admin.getUserById(booking.customer_id),
      admin.from('profiles').select('display_name').eq('id', user.id).single(),
    ])
    const listingTitle = booking.listings?.title ?? 'Angebot'
    const eventDate = new Date(booking.event_date).toLocaleDateString('de-DE', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    if (status === 'accepted') {
      await sendBookingAccepted({
        to: customerUser?.email,
        customerName: customerUser?.email,
        listingTitle,
        providerName: providerProfile?.display_name ?? 'Der Anbieter',
        eventDate,
        amount_cents: booking.amount_cents,
        bookingId,
      })
    } else {
      await sendBookingRejected({
        to: customerUser?.email,
        customerName: customerUser?.email,
        listingTitle,
      })
    }
  } catch (e) { console.error('[status email]', e) }

  return NextResponse.json({ status })
}
