// ============================================================================
// FESTLY — Stripe Connect / Treuhand (Escrow)
// ============================================================================
// Der Ablauf:
//   1. Onboarding       — Anbieter verbindet Bankkonto via Stripe Connect (KYC)
//   2. createPaymentIntent() — Kunde zahlt; Geld landet bei Festly (Platform)
//   3. transferToProvider()  — nach Bestätigung/Frist: Auszahlung minus Provision
//   4. cancelBooking()       — bei Storno: gestaffelte Rückerstattung
// ============================================================================

// Storno-Logik liegt ausschließlich in lib/cancellation.js
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { sendPayoutConfirmed } from '@/lib/email'
import { calculateCancellationFee } from '@/lib/cancellation'

const PLATFORM_COMMISSION_RATE = 0.15

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt.')
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

// ---------------------------------------------------------------------------
// Schritt 1a: Express-Account anlegen und stripe_account_id in DB speichern
// ---------------------------------------------------------------------------
export async function createStripeConnectAccount(userId, email) {
  const stripe = getStripe()

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'DE',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  const supabase = await createSupabaseServer()
  await supabase
    .from('profiles')
    .update({ stripe_account_id: account.id })
    .eq('id', userId)

  return account.id
}

// ---------------------------------------------------------------------------
// Schritt 1b: Onboarding-Link generieren (Stripe führt KYC durch)
// ---------------------------------------------------------------------------
export async function createOnboardingLink(stripeAccountId, returnUrl, refreshUrl) {
  const stripe = getStripe()

  const link = await stripe.accountLinks.create({
    account: stripeAccountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })

  return link.url
}

// ---------------------------------------------------------------------------
// Schritt 1c: Onboarding-Status prüfen und in DB speichern
// ---------------------------------------------------------------------------
export async function checkAccountStatus(stripeAccountId) {
  const stripe = getStripe()

  const account = await stripe.accounts.retrieve(stripeAccountId)
  const charges_enabled = account.charges_enabled

  const supabase = await createSupabaseServer()
  await supabase
    .from('profiles')
    .update({ stripe_onboarding_complete: charges_enabled })
    .eq('stripe_account_id', stripeAccountId)

  return { charges_enabled }
}

// ---------------------------------------------------------------------------
// Schritt 2a: Payment Intent anlegen — Geld landet bei Festly (kein Transfer)
// Transfer an Anbieter erfolgt später via transferToProvider()
// ---------------------------------------------------------------------------
export async function createPaymentIntent(bookingId, customerId) {
  const stripe = getStripe()
  const supabase = await createSupabaseServer()
  const admin = createAdminClient()

  // Buchung laden — customer_id prüft implizit die Berechtigung
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, amount_cents, status, listing_id, listings(title)')
    .eq('id', bookingId)
    .eq('customer_id', customerId)
    .single()

  if (!booking) throw new Error('Buchung nicht gefunden.')
  if (booking.status !== 'accepted') throw new Error('Buchung ist noch nicht angenommen.')

  // Idempotenz: vorhandenen Payment Intent wiederverwenden falls noch offen
  const { data: existingPayment } = await admin
    .from('payments')
    .select('stripe_payment_intent_id')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (existingPayment?.stripe_payment_intent_id) {
    const pi = await stripe.paymentIntents.retrieve(existingPayment.stripe_payment_intent_id)
    if (['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(pi.status)) {
      return {
        clientSecret: pi.client_secret,
        booking: { title: booking.listings?.title, amount_cents: booking.amount_cents },
      }
    }
  }

  // Neuen Payment Intent erstellen (Geld landet bei Festly; kein Transfer jetzt)
  const intent = await stripe.paymentIntents.create({
    amount: booking.amount_cents,
    currency: 'eur',
    metadata: { booking_id: bookingId, listing_id: booking.listing_id },
  })

  // Zahlung in DB festhalten (admin: RLS-Bypass, da keine User-Session nötig)
  await admin.from('payments').insert({
    booking_id: bookingId,
    stripe_payment_intent_id: intent.id,
    amount_cents: booking.amount_cents,
    status: 'pending',
  })

  return {
    clientSecret: intent.client_secret,
    booking: { title: booking.listings?.title, amount_cents: booking.amount_cents },
  }
}

// ---------------------------------------------------------------------------
// Schritt 3: Auszahlung an Anbieter (nach Kundenbestätigung oder 7-Tage-Frist)
// Geld lag bei Festly (Platform). Stripe Transfer → Anbieter-Konto.
// ---------------------------------------------------------------------------
export async function transferToProvider(bookingId) {
  const stripe = getStripe()
  const admin = createAdminClient()

  // Zahlung laden — Doppelt-Transfer verhindern
  const { data: payment } = await admin
    .from('payments')
    .select('id, stripe_payment_intent_id, status, amount_cents')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (!payment) throw new Error('Keine Zahlung für diese Buchung gefunden.')
  if (payment.status === 'released') return { already_transferred: true }
  if (payment.status !== 'held') {
    throw new Error(`Zahlung hat ungültigen Status für Auszahlung: ${payment.status}`)
  }

  // Buchung + Anbieter laden
  const { data: booking } = await admin
    .from('bookings')
    .select(`
      id, amount_cents, provider_payout_cents, provider_id,
      provider:profiles!bookings_provider_id_fkey(stripe_account_id, display_name),
      listings(title)
    `)
    .eq('id', bookingId)
    .eq('status', 'paid')
    .single()

  if (!booking) throw new Error('Buchung nicht gefunden oder nicht im Status "paid".')
  if (!booking.provider?.stripe_account_id) {
    throw new Error('Anbieter hat noch kein Stripe-Konto verbunden.')
  }

  // Charge-ID aus Payment Intent holen (source_transaction braucht Charge, nicht PI)
  const pi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)
  const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id
  if (!chargeId) throw new Error('Kein Charge für diesen Payment Intent gefunden.')

  const payoutCents = booking.provider_payout_cents > 0
    ? booking.provider_payout_cents
    : Math.round(booking.amount_cents * (1 - PLATFORM_COMMISSION_RATE))

  const transfer = await stripe.transfers.create({
    amount: payoutCents,
    currency: 'eur',
    destination: booking.provider.stripe_account_id,
    source_transaction: chargeId,
    metadata: { booking_id: bookingId },
  })

  const now = new Date().toISOString()

  await admin.from('payments').update({
    status: 'released',
    stripe_transfer_id: transfer.id,
    released_at: now,
  }).eq('id', payment.id)

  await admin.from('bookings').update({
    status: 'completed',
    updated_at: now,
  }).eq('id', bookingId)

  // E-Mail an Anbieter (fire-and-forget)
  try {
    const { data: { user: providerUser } } = await admin.auth.admin.getUserById(booking.provider_id)
    await sendPayoutConfirmed({
      to: providerUser?.email,
      providerName: booking.provider?.display_name ?? 'Anbieter',
      listingTitle: booking.listings?.title ?? 'Angebot',
      amount_cents: payoutCents,
    })
  } catch (e) { console.error('[transferToProvider email]', e) }

  return { transfer_id: transfer.id, amount_cents: payoutCents }
}

export async function cancelBooking(bookingId, cancelledBy) {
  const stripe = getStripe()
  const admin = createAdminClient()

  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, event_date, amount_cents')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('Buchung nicht gefunden.')
  if (booking.status === 'completed') {
    throw new Error('Abgeschlossene Buchungen können nicht storniert werden. Bitte wende dich an den Support.')
  }
  if (booking.status === 'cancelled') throw new Error('Buchung ist bereits storniert.')

  let refundCents = 0
  let feeCents = 0
  if (booking.status === 'paid') {
    if (cancelledBy === 'provider') {
      refundCents = booking.amount_cents
    } else {
      const result = calculateCancellationFee(booking.amount_cents, new Date(booking.event_date))
      refundCents = result.refundCents
      feeCents = result.feeCents
    }
  }

  // Stripe-Rückerstattung — nur wenn Zahlung eingegangen
  if (booking.status === 'paid' && refundCents > 0) {
    const { data: payment } = await admin
      .from('payments')
      .select('stripe_payment_intent_id')
      .eq('booking_id', bookingId)
      .maybeSingle()

    if (payment?.stripe_payment_intent_id) {
      await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: refundCents,
        reason: 'requested_by_customer',
      })
      await admin.from('payments').update({ status: 'refunded' }).eq('booking_id', bookingId)
    }
  }

  const now = new Date().toISOString()
  await admin.from('bookings').update({
    status: 'cancelled',
    cancelled_at: now,
    cancelled_by: cancelledBy,
    cancellation_fee_cents: feeCents,
    updated_at: now,
  }).eq('id', bookingId)

  return { refundCents, feeCents }
}

export { PLATFORM_COMMISSION_RATE }
