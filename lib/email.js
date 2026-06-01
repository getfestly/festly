import { Resend } from 'resend'

const FROM    = process.env.EMAIL_FROM    ?? 'Festly <onboarding@resend.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY ist nicht gesetzt.')
  return new Resend(key)
}

const eur = (cents) =>
  cents ? (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–'

// ---------------------------------------------------------------------------
// Basis-Template
// ---------------------------------------------------------------------------
function base(content) {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
  <div style="background:#111827;padding:20px 28px;">
    <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.5px;">Festly</span>
  </div>
  <div style="padding:28px 28px 20px;">
    ${content}
  </div>
  <div style="background:#f9fafb;padding:14px 28px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;">
      Festly – Vom Toilettenwagen bis zum Giga-Event &nbsp;·&nbsp;
      <a href="${APP_URL}/impressum" style="color:#9ca3af;text-decoration:none;">Impressum</a>
    </p>
  </div>
</div>
</body></html>`
}

function btn(label, url) {
  return `<a href="${url}" style="display:inline-block;background:#111827;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin-top:12px;">${label}</a>`
}

function row(label, value) {
  return `<tr>
    <td style="padding:6px 0;color:#6b7280;font-size:14px;width:40%;">${label}</td>
    <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:500;">${value}</td>
  </tr>`
}

function table(...rows) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows.join('')}</table>`
}

// ---------------------------------------------------------------------------
// E-Mail-Funktionen
// ---------------------------------------------------------------------------

/** Anbieter: neue Buchungsanfrage */
export async function sendNewBookingToProvider({ to, providerName, listingTitle, customerName, eventDate, amount_cents }) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Neue Buchungsanfrage: ${listingTitle}`,
    html: base(`
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Neue Buchungsanfrage</h2>
      <p style="color:#6b7280;margin:0 0 20px;">Hallo ${providerName}, du hast eine neue Anfrage erhalten.</p>
      ${table(
        row('Angebot', listingTitle),
        row('Kunde', customerName),
        row('Wunschdatum', eventDate),
        row('Betrag', eur(amount_cents)),
      )}
      ${btn('Anfrage ansehen', `${APP_URL}/mein-bereich/anfragen`)}
      <p style="color:#9ca3af;font-size:13px;margin-top:20px;">
        Bitte antworte innerhalb von 48 Stunden – sonst kann die Anfrage verfallen.
      </p>
    `),
  })
}

/** Kunde: Buchung bestätigt */
export async function sendBookingAccepted({ to, customerName, listingTitle, providerName, eventDate, amount_cents, bookingId }) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Deine Buchung wurde bestätigt – jetzt bezahlen`,
    html: base(`
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Buchung bestätigt</h2>
      <p style="color:#6b7280;margin:0 0 20px;">Hallo ${customerName}, ${providerName} hat deine Anfrage angenommen.</p>
      ${table(
        row('Angebot', listingTitle),
        row('Event', eventDate),
        row('Gesamtbetrag', eur(amount_cents)),
      )}
      <p style="color:#6b7280;font-size:14px;margin:16px 0 8px;">
        Um die Buchung zu sichern, schließe bitte jetzt die Zahlung ab.
      </p>
      ${btn('Jetzt bezahlen', `${APP_URL}/buchungen/${bookingId}/bezahlen`)}
    `),
  })
}

/** Kunde: Buchung abgelehnt */
export async function sendBookingRejected({ to, customerName, listingTitle }) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Buchungsanfrage abgelehnt`,
    html: base(`
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Buchungsanfrage abgelehnt</h2>
      <p style="color:#6b7280;margin:0 0 20px;">Hallo ${customerName},</p>
      <p style="color:#374151;margin:0 0 16px;">
        leider hat der Anbieter deine Anfrage für <strong>${listingTitle}</strong> abgelehnt.
        Schau auf dem Marktplatz nach ähnlichen Angeboten.
      </p>
      ${btn('Marktplatz erkunden', `${APP_URL}/marktplatz`)}
    `),
  })
}

/** Kunde + Anbieter: Zahlung erfolgreich */
export async function sendPaymentConfirmed({ customerEmail, providerEmail, listingTitle, eventDate, amount_cents, provider_payout_cents }) {
  const resend = getResend()
  await Promise.all([
    resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Zahlung bestätigt – ${listingTitle}`,
      html: base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Zahlung bestätigt</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Deine Zahlung wurde erfolgreich erfasst und ist sicher verwahrt.</p>
        ${table(
          row('Angebot', listingTitle),
          row('Event', eventDate),
          row('Bezahlt', eur(amount_cents)),
        )}
        <p style="color:#9ca3af;font-size:13px;margin-top:16px;">
          Das Geld wird nach deiner Bestätigung (oder automatisch 7 Tage nach dem Event) an den Anbieter freigegeben.
        </p>
      `),
    }),
    resend.emails.send({
      from: FROM,
      to: providerEmail,
      subject: `Zahlung eingegangen – ${listingTitle}`,
      html: base(`
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Zahlung eingegangen</h2>
        <p style="color:#6b7280;margin:0 0 20px;">Der Kunde hat erfolgreich gezahlt. Das Geld ist sicher verwahrt.</p>
        ${table(
          row('Angebot', listingTitle),
          row('Event', eventDate),
          row('Deine Auszahlung', eur(provider_payout_cents)),
        )}
        <p style="color:#9ca3af;font-size:13px;margin-top:16px;">
          Die Auszahlung erfolgt nach Kundenbestätigung oder automatisch 7 Tage nach dem Event.
        </p>
      `),
    }),
  ])
}

/** Kunde: Storno bestätigt */
export async function sendCancellationConfirmed({ to, customerName, listingTitle, refundCents, amount_cents }) {
  const resend = getResend()
  const hasRefund = refundCents > 0
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Storno bestätigt${hasRefund ? ' – Rückerstattung eingeleitet' : ''}`,
    html: base(`
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Buchung storniert</h2>
      <p style="color:#6b7280;margin:0 0 20px;">Hallo ${customerName}, deine Buchung wurde storniert.</p>
      ${table(
        row('Angebot', listingTitle),
        row('Gezahlter Betrag', eur(amount_cents)),
        row('Rückerstattung', hasRefund ? eur(refundCents) : 'Keine (0–2 Tage vor Event)'),
      )}
      ${hasRefund
        ? `<p style="color:#6b7280;font-size:14px;margin-top:16px;">
             Die Rückerstattung von <strong>${eur(refundCents)}</strong> wird in den nächsten 5–10 Werktagen auf deinem Konto gutgeschrieben.
           </p>`
        : `<p style="color:#6b7280;font-size:14px;margin-top:16px;">
             Da das Event in weniger als 3 Tagen stattfand, ist keine Rückerstattung möglich.
           </p>`}
    `),
  })
}

/** Anbieter: Auszahlung erfolgt */
export async function sendPayoutConfirmed({ to, providerName, listingTitle, amount_cents }) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Dein Geld ist unterwegs: ${eur(amount_cents)}`,
    html: base(`
      <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Auszahlung eingeleitet</h2>
      <p style="color:#6b7280;margin:0 0 20px;">Hallo ${providerName}, deine Auszahlung ist auf dem Weg.</p>
      ${table(
        row('Angebot', listingTitle),
        row('Auszahlungsbetrag', eur(amount_cents)),
      )}
      <p style="color:#9ca3af;font-size:13px;margin-top:16px;">
        Der Betrag erscheint in 1–3 Werktagen auf deinem Stripe-Konto.
      </p>
    `),
  })
}
