import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET nicht gesetzt.')
    return NextResponse.json({ error: 'Webhook nicht konfiguriert.' }, { status: 500 })
  }

  let event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signatur ungültig:', err.message)
    return NextResponse.json({ error: `Webhook-Signatur ungültig: ${err.message}` }, { status: 400 })
  }

  try {
    const admin = createAdminClient()

    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        const bookingId = session.metadata?.booking_id
        if (!bookingId) {
          console.warn('[stripe-webhook] checkout.session.completed ohne booking_id')
          break
        }
        const { error } = await admin
          .from('bookings')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', bookingId)
        if (error) console.error(`[stripe-webhook] DB-Fehler bei Buchung ${bookingId}:`, error)
        else console.log(`[stripe-webhook] Buchung ${bookingId} als bezahlt markiert.`)
        break
      }

      case 'payment_intent.succeeded': {
        const pi = event.data.object
        console.log(`[stripe-webhook] payment_intent.succeeded: ${pi.id} (booking_id: ${pi.metadata?.booking_id ?? 'n/a'})`)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object
        const bookingId = pi.metadata?.booking_id
        if (!bookingId) {
          console.warn('[stripe-webhook] payment_intent.payment_failed ohne booking_id')
          break
        }
        const { error } = await admin
          .from('bookings')
          .update({ status: 'payment_failed' })
          .eq('id', bookingId)
        if (error) console.error(`[stripe-webhook] DB-Fehler bei Buchung ${bookingId}:`, error)
        else console.log(`[stripe-webhook] Buchung ${bookingId} auf payment_failed gesetzt.`)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error('[stripe-webhook] Fehler bei Event-Verarbeitung:', err)
  }

  return NextResponse.json({ received: true })
}
