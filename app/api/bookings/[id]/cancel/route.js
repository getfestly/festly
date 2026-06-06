import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { cancelBooking } from '@/lib/payments'
import { sendCancellationConfirmed } from '@/lib/email'

export async function POST(request, { params }) {
  const { id: bookingId } = await params

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })

  // Buchung laden — Query selbst erzwingt Zugriffsprüfung (defense-in-depth neben RLS)
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, event_date, amount_cents, customer_id, provider_id, listings(title)')
    .eq('id', bookingId)
    .or(`customer_id.eq.${user.id},provider_id.eq.${user.id}`)
    .single()

  if (!booking) return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })

  const isCustomer = booking.customer_id === user.id
  const isProvider = booking.provider_id === user.id
  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  const cancelledBy = isProvider ? 'provider' : 'customer'

  try {
    const { refundCents, feeCents } = await cancelBooking(bookingId, cancelledBy)

    // E-Mail an Kunden (fire-and-forget)
    if (isCustomer || isProvider) {
      const admin = createAdminClient()
      const [{ data: { user: customerUser } }, { data: customerProfile }] = await Promise.all([
        admin.auth.admin.getUserById(booking.customer_id),
        admin.from('profiles').select('display_name').eq('id', booking.customer_id).single(),
      ])
      const customerName = customerProfile?.display_name ?? customerUser?.email
      try {
        await sendCancellationConfirmed({
          to: customerUser?.email,
          customerName,
          listingTitle: booking.listings?.title ?? 'Angebot',
          refundCents,
          amount_cents: booking.status === 'paid' ? booking.amount_cents : 0,
        })
      } catch (e) { console.error('[cancel email]', e) }
    }

    return NextResponse.json({ refundCents, feeCents })
  } catch (err) {
    console.error('[bookings/cancel]', err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
