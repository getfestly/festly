// ============================================================================
// FESTLY — Stripe Connect / Treuhand (Escrow)
// ============================================================================
// Der Ablauf in vier Schritten:
//   1. Onboarding     — Anbieter verbindet Bankkonto via Stripe Connect (KYC)
//   2. createEscrowPayment() — Kunde zahlt, Geld wird treuhänderisch gehalten
//   3. releaseToProvider()   — nach Bestätigung/Frist: Auszahlung minus Provision
//   4. refundCustomer()      — bei Storno: Rückerstattung
// ============================================================================

import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

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
// Transfer an Anbieter erfolgt in Etappe 5 via releaseToProvider()
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
// Schritt 2b (Legacy-Stub): Geld autorisieren und halten (manual capture)
// ---------------------------------------------------------------------------
export async function createEscrowPayment(amountCents, providerAccountId) {
  // const stripe = getStripe()
  // const intent = await stripe.paymentIntents.create({
  //   amount: amountCents,
  //   currency: 'eur',
  //   capture_method: 'manual',
  //   metadata: { providerAccountId },
  // })
  // return { paymentIntentId: intent.id, clientSecret: intent.client_secret }
  throw new Error('createEscrowPayment: noch nicht implementiert (Etappe 4)')
}

// ---------------------------------------------------------------------------
// Schritt 3: Auszahlung an Anbieter — 15 % Provision einbehalten
// ---------------------------------------------------------------------------
export async function releaseToProvider(paymentIntentId, amountCents, providerAccountId) {
  const commission = Math.round(amountCents * PLATFORM_COMMISSION_RATE)
  const payout = amountCents - commission

  // const stripe = getStripe()
  // await stripe.paymentIntents.capture(paymentIntentId)
  // await stripe.transfers.create({ amount: payout, currency: 'eur', destination: providerAccountId })
  void payout
  throw new Error('releaseToProvider: noch nicht implementiert (Etappe 4)')
}

// ---------------------------------------------------------------------------
// Schritt 4: Rückerstattung an Kunden
// ---------------------------------------------------------------------------
export async function refundCustomer(paymentIntentId, refundCents) {
  // const stripe = getStripe()
  // await stripe.refunds.create({ payment_intent: paymentIntentId, amount: refundCents })
  void refundCents
  throw new Error('refundCustomer: noch nicht implementiert (Etappe 4)')
}

export { PLATFORM_COMMISSION_RATE }
