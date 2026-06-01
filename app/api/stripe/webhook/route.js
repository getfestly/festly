import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPaymentConfirmed } from '@/lib/email'

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
      if (!bookingId) { console.warn('[webhook] payment_intent.succeeded ohne booking_id'); break }

      await admin.from('bookings').update({ status: 'paid' })
        .eq('id', bookingId).eq('status', 'accepted')
      await admin.from('payments').update({ status: 'held', held_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id)

      console.log(`[webhook] Buchung ${bookingId} bezahlt (PI: ${pi.id})`)

      // E-Mail an Kunde + Anbieter (fire-and-forget)
      try {
        const { data: booking } = await admin
          .from('bookings')
          .select('customer_id, provider_id, amount_cents, provider_payout_cents, event_date, listings(title)')
          .eq('id', bookingId).single()

        if (booking) {
          const [{ data: { user: cu } }, { data: { user: pu } }] = await Promise.all([
            admin.auth.admin.getUserById(booking.customer_id),
            admin.auth.admin.getUserById(booking.provider_id),
          ])
          await sendPaymentConfirmed({
            customerEmail: cu?.email,
            providerEmail: pu?.email,
            listingTitle: booking.listings?.title ?? 'Angebot',
            eventDate: new Date(booking.event_date).toLocaleDateString('de-DE', {
              day: '2-digit', month: 'long', year: 'numeric',
            }),
            amount_cents: booking.amount_cents,
            provider_payout_cents: booking.provider_payout_cents > 0
              ? booking.provider_payout_cents
              : Math.round(booking.amount_cents * 0.85),
          })
        }
      } catch (e) { console.error('[webhook payment email]', e) }

      break
    }

    case 'charge.refunded': {
      const charge = event.data.object
      // Payments-Status aktualisieren falls noch nicht geschehen
      const { data: payment } = await admin
        .from('payments')
        .select('id, status')
        .eq('stripe_payment_intent_id', charge.payment_intent)
        .maybeSingle()

      if (payment && payment.status !== 'refunded') {
        await admin.from('payments').update({ status: 'refunded' }).eq('id', payment.id)
        console.log(`[webhook] Rückerstattung für Charge ${charge.id} verarbeitet`)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object
      console.warn(`[webhook] Zahlung fehlgeschlagen: ${pi.id}`)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
