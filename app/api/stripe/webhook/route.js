import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-admin'

// Stripe-Signatur-Verifikation braucht den rohen Body als String — kein JSON-Parsing.
// In Next.js App Router genügt request.text() — kein bodyParser-Override nötig.

export async function POST(request) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET nicht gesetzt.')
    return NextResponse.json({ error: 'Webhook nicht konfiguriert.' }, { status: 500 })
  }

  let event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signatur ungültig:', err.message)
    return NextResponse.json({ error: `Webhook-Signatur ungültig: ${err.message}` }, { status: 400 })
  }

  const admin = createAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object
      const bookingId = pi.metadata?.booking_id

      if (!bookingId) {
        console.warn('[webhook] payment_intent.succeeded ohne booking_id in metadata')
        break
      }

      // Buchung auf "bezahlt" setzen
      const { error: bookingErr } = await admin
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', bookingId)
        .eq('status', 'accepted') // Nur wenn noch "accepted" — verhindert doppeltes Update

      if (bookingErr) console.error('[webhook] bookings-Update fehlgeschlagen:', bookingErr)

      // Zahlung als "gehalten" markieren (Treuhand)
      const { error: paymentErr } = await admin
        .from('payments')
        .update({ status: 'held', held_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id)

      if (paymentErr) console.error('[webhook] payments-Update fehlgeschlagen:', paymentErr)

      console.log(`[webhook] Buchung ${bookingId} bezahlt (PI: ${pi.id})`)
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      console.warn(`[webhook] Zahlung fehlgeschlagen: ${pi.id}`)
      // Optional: Benachrichtigung an Kunden — Etappe 5
      break
    }

    default:
      // Unbekannte Events ignorieren
      break
  }

  return NextResponse.json({ received: true })
}
