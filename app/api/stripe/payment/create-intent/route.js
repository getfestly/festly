import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createPaymentIntent } from '@/lib/payments'

export async function POST(request) {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'customer') {
    return NextResponse.json({ error: 'Nur Kunden können bezahlen.' }, { status: 403 })
  }

  let bookingId
  try {
    const body = await request.json()
    bookingId = body.bookingId
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }

  if (!bookingId) return NextResponse.json({ error: 'bookingId fehlt.' }, { status: 400 })

  try {
    const result = await createPaymentIntent(bookingId, user.id)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[payment/create-intent]', err)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
