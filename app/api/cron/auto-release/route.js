import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { transferToProvider } from '@/lib/payments'

// Vercel Cron Job — täglich 02:00 UTC (siehe vercel.json)
// Vercel injiziert automatisch: Authorization: Bearer <CRON_SECRET>
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  const expected = Buffer.from(`Bearer ${cronSecret ?? ''}`)
  const actual   = Buffer.from(authHeader ?? '')
  if (!cronSecret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Buchungen finden: bezahlt + Event vor mehr als 7 Tagen
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffDate = cutoff.toISOString().split('T')[0]

  const { data: bookings, error } = await admin
    .from('bookings')
    .select('id, event_date')
    .eq('status', 'paid')
    .lt('event_date', cutoffDate)

  if (error) {
    console.error('[auto-release] DB-Fehler:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []
  for (const booking of bookings ?? []) {
    try {
      const result = await transferToProvider(booking.id)
      results.push({ bookingId: booking.id, status: 'ok', ...result })
      console.log(`[auto-release] Buchung ${booking.id} ausgezahlt`)
    } catch (err) {
      results.push({ bookingId: booking.id, status: 'error', error: err.message })
      console.error(`[auto-release] Buchung ${booking.id} fehlgeschlagen:`, err.message)
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
