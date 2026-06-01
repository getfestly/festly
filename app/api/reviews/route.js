import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { bookingId, rating, comment } = await request.json()

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'customer') {
    return NextResponse.json({ error: 'Nur Kunden können Bewertungen abgeben' }, { status: 403 })
  }

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, provider_id, listing_id, status')
    .eq('id', bookingId)
    .eq('customer_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!booking) {
    return NextResponse.json(
      { error: 'Buchung nicht gefunden oder nicht abgeschlossen' },
      { status: 403 }
    )
  }

  const { error } = await supabase.from('reviews').insert({
    booking_id: bookingId,
    reviewer_id: user.id,
    provider_id: booking.provider_id,
    listing_id: booking.listing_id,
    rating,
    comment: comment?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Diese Buchung wurde bereits bewertet' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
