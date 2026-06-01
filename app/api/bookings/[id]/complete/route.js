import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { transferToProvider } from '@/lib/payments'

export async function POST(request, { params }) {
  const { id: bookingId } = await params

  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })

  // Buchung laden — sicherstellen, dass der Anfragende der Kunde ist
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, event_date, customer_id')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })
  if (booking.customer_id !== user.id) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 })
  }
  if (booking.status !== 'paid') {
    return NextResponse.json({ error: 'Buchung ist nicht im Status "bezahlt".' }, { status: 400 })
  }

  // Event muss in der Vergangenheit liegen
  const today = new Date().toISOString().split('T')[0]
  if (booking.event_date >= today) {
    return NextResponse.json({ error: 'Das Event hat noch nicht stattgefunden.' }, { status: 400 })
  }

  try {
    const result = await transferToProvider(bookingId)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[bookings/complete]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
