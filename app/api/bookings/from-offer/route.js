import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })

  let messageId, bookingId
  try {
    const body = await request.json()
    messageId = body.messageId
    bookingId = body.bookingId
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  if (!messageId || !bookingId) {
    return NextResponse.json({ error: 'messageId und bookingId erforderlich.' }, { status: 400 })
  }

  // Original-Buchung laden — Kunde muss der aktuelle User sein
  const { data: originalBooking } = await supabase
    .from('bookings')
    .select('id, customer_id, provider_id, listing_id')
    .eq('id', bookingId)
    .single()

  if (!originalBooking) {
    return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })
  }
  if (originalBooking.customer_id !== user.id) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }

  // Angebot-Nachricht laden
  const { data: message } = await supabase
    .from('messages')
    .select('id, offer_data, booking_id')
    .eq('id', messageId)
    .eq('booking_id', bookingId)
    .single()

  if (!message?.offer_data) {
    return NextResponse.json({ error: 'Angebot nicht gefunden.' }, { status: 404 })
  }
  if (message.offer_data.status !== 'pending') {
    return NextResponse.json({ error: 'Angebot ist nicht mehr offen.' }, { status: 400 })
  }

  const { title, price_cents, date } = message.offer_data

  // Neue Buchung erstellen
  const { data: newBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      listing_id:  originalBooking.listing_id,
      customer_id: originalBooking.customer_id,
      provider_id: originalBooking.provider_id,
      event_date:  date,
      event_title: title,
      amount_cents: price_cents,
      quantity:    1,
      price_model: 'flat',
      status:      'accepted',
    })
    .select('id')
    .single()

  if (bookingError) {
    console.error('[from-offer] Buchung erstellen:', bookingError)
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // Angebot-Nachricht aktualisieren
  const { error: msgError } = await supabase
    .from('messages')
    .update({
      offer_data:       { ...message.offer_data, status: 'accepted' },
      offer_booking_id: newBooking.id,
    })
    .eq('id', messageId)

  if (msgError) {
    console.error('[from-offer] Message update:', msgError)
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({ bookingId: newBooking.id })
}
