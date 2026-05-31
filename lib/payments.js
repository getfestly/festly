// ============================================================================
// FESTLY — Stripe Connect / Treuhand (Escrow) — Gerüst
// ============================================================================
// Dieses Modul kapselt den gesamten Geldfluss. WICHTIG: Festly fasst das Geld
// nie selbst an — Stripe hält und überweist treuhänderisch. Damit ist keine
// eigene BaFin-Erlaubnis nötig.
//
// Der Ablauf in vier Schritten:
//   1. onboardProvider()   — Anbieter legt Stripe-Konto an (KYC macht Stripe)
//   2. createEscrowPayment() — Kunde zahlt; Geld wird gehalten (manual capture)
//   3. releaseToProvider()  — nach Bestätigung/Frist: Auszahlung minus Provision
//   4. refundCustomer()     — bei Storno: Rückerstattung (ggf. minus Gebühr)
//
// HINWEIS: Dies ist das GERÜST. Die echten Stripe-Aufrufe sind als Kommentar
// und Funktionssignatur vorbereitet. Claude Code füllt mit deinen echten
// Stripe-Keys die Implementierung. Niemals echte Keys in den Code schreiben —
// immer aus Umgebungsvariablen (.env) laden.
// ============================================================================

const PLATFORM_COMMISSION_RATE = 0.15; // 15 % Festly-Provision

// const Stripe = require('stripe');
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Schritt 1: Anbieter-Onboarding.
 * Erstellt ein Stripe-Connect-Konto. Stripe führt das KYC (Identität,
 * Bankdaten, Steuerinfo) selbst durch — Festly speichert nur die Konto-ID.
 * @param {string} email  E-Mail des Anbieters
 * @returns {Promise<{accountId:string, onboardingUrl:string}>}
 */
async function onboardProvider(email) {
  // const account = await stripe.accounts.create({
  //   type: 'express',
  //   country: 'DE',
  //   email,
  //   capabilities: { transfers: { requested: true } },
  // });
  // const link = await stripe.accountLinks.create({
  //   account: account.id,
  //   refresh_url: `${process.env.APP_URL}/onboarding/refresh`,
  //   return_url:  `${process.env.APP_URL}/onboarding/done`,
  //   type: 'account_onboarding',
  // });
  // return { accountId: account.id, onboardingUrl: link.url };
  throw new Error('TODO: mit Stripe-Keys implementieren (Claude Code)');
}

/**
 * Schritt 2: Treuhand-Zahlung.
 * Kunde zahlt den vollen Betrag. Über `capture_method: manual` wird das Geld
 * autorisiert und gehalten, aber noch NICHT an den Anbieter überwiesen.
 * @param {number} amountCents        Gesamtbetrag in Cent
 * @param {string} providerAccountId  Stripe-Konto des Anbieters
 * @returns {Promise<{paymentIntentId:string, clientSecret:string}>}
 */
async function createEscrowPayment(amountCents, providerAccountId) {
  // const intent = await stripe.paymentIntents.create({
  //   amount: amountCents,
  //   currency: 'eur',
  //   capture_method: 'manual',          // Geld halten, nicht sofort übertragen
  //   metadata: { providerAccountId },
  // });
  // return { paymentIntentId: intent.id, clientSecret: intent.client_secret };
  throw new Error('TODO: mit Stripe-Keys implementieren (Claude Code)');
}

/**
 * Schritt 3: Auszahlung an Anbieter.
 * Wird ausgelöst, wenn der Kunde die Leistung bestätigt ODER die 7-Tage-Frist
 * abläuft. Festly behält 15 % Provision ein, 85 % gehen an den Anbieter.
 * @param {string} paymentIntentId    Die gehaltene Zahlung
 * @param {number} amountCents        Gesamtbetrag in Cent
 * @param {string} providerAccountId  Stripe-Konto des Anbieters
 */
async function releaseToProvider(paymentIntentId, amountCents, providerAccountId) {
  const commission = Math.round(amountCents * PLATFORM_COMMISSION_RATE);
  const payout = amountCents - commission;

  // await stripe.paymentIntents.capture(paymentIntentId); // Geld einziehen
  // await stripe.transfers.create({                        // an Anbieter weiter
  //   amount: payout,
  //   currency: 'eur',
  //   destination: providerAccountId,
  // });
  // -> commission bleibt automatisch bei der Plattform
  throw new Error('TODO: mit Stripe-Keys implementieren (Claude Code)');
}

/**
 * Schritt 4: Rückerstattung an Kunden (bei Storno).
 * Der zu erstattende Betrag wird VORHER über lib/cancellation.js berechnet.
 * @param {string} paymentIntentId  Die gehaltene Zahlung
 * @param {number} refundCents      Zu erstattender Betrag in Cent
 */
async function refundCustomer(paymentIntentId, refundCents) {
  // await stripe.refunds.create({
  //   payment_intent: paymentIntentId,
  //   amount: refundCents,
  // });
  throw new Error('TODO: mit Stripe-Keys implementieren (Claude Code)');
}

module.exports = {
  PLATFORM_COMMISSION_RATE,
  onboardProvider,
  createEscrowPayment,
  releaseToProvider,
  refundCustomer,
};
