import Link from 'next/link'

export const metadata = {
  title: 'So funktioniert Festly',
  description: 'Erfahre wie du als Kunde oder Anbieter auf Festly durchstartest.',
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
      <h2 className="text-xl font-bold gradient-text mb-6">{title}</h2>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function Step({ icon, title, children }) {
  return (
    <div className="flex gap-4">
      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: 'linear-gradient(135deg, #fdf4ff, #f0f9ff)' }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function Divider() {
  return <hr className="border-gray-100" />
}

export default function SoFunktioniertPage() {
  return (
    <main className="flex-1 bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            So funktioniert <span className="gradient-text">Festly</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Sicher buchen, sicher bezahlen — für Kunden und Anbieter.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Für Kunden ─────────────────────────────────────────────── */}
          <Section title="Für Kunden">
            <Step icon="🔍" title="Angebot finden & anfragen">
              Stöbere im Marktplatz nach geprüften Anbietern. Filtere nach Kategorie, Region
              und Preis. Klicke auf ein Angebot und stelle eine Anfrage mit deinen Event-Details:
              Datum, Personenanzahl und eine kurze Beschreibung.
            </Step>
            <Divider />
            <Step icon="💳" title="Sicher bezahlen — Treuhand über Stripe">
              Sobald der Anbieter deine Anfrage angenommen hat, kannst du sicher über Stripe
              bezahlen. Dein Geld wird dabei treuhänderisch gehalten und nicht sofort an den
              Anbieter ausgezahlt — du bist also auf der sicheren Seite.
            </Step>
            <Divider />
            <Step icon="🎉" title="Event genießen & Zahlung freigeben">
              Nach deinem Event kannst du die Zahlung in deinem Konto freigeben. Tust du das
              nicht, erfolgt die Freigabe automatisch nach 7 Tagen — so bleibt genug Zeit,
              um Probleme zu melden.
            </Step>
            <Divider />
            <Step icon="🔄" title="Storno-Regelung">
              Pläne ändern sich — kein Problem. Die Stornierung ist gestaffelt:
              <br /><br />
              <table className="text-xs text-gray-600 w-full mt-1 border-collapse">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-1.5 font-semibold">Vorlauf vor Event</th>
                    <th className="pb-1.5 font-semibold text-right">Erstattung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="py-1.5">30 Tage oder mehr</td><td className="text-right text-green-600 font-medium">100 %</td></tr>
                  <tr><td className="py-1.5">14 – 29 Tage</td><td className="text-right text-amber-600 font-medium">50 %</td></tr>
                  <tr><td className="py-1.5">3 – 13 Tage</td><td className="text-right text-orange-600 font-medium">25 %</td></tr>
                  <tr><td className="py-1.5">0 – 2 Tage</td><td className="text-right text-red-500 font-medium">Keine</td></tr>
                </tbody>
              </table>
              <br />
              Storniert der Anbieter, erhältst du immer 100 % zurück.
            </Step>
          </Section>

          {/* ── Für Anbieter ───────────────────────────────────────────── */}
          <Section title="Für Anbieter">
            <Step icon="✨" title="Kostenlos inserieren">
              Erstelle dein Profil und lege deine Angebote an — ohne monatliche Gebühren oder
              Grundgebühr. Du zahlst nur, wenn eine Buchung tatsächlich zustande kommt.
            </Step>
            <Divider />
            <Step icon="📋" title="Anfragen annehmen oder ablehnen">
              Du entscheidest, welche Aufträge du annimmst. Kunden erhalten bei Annahme
              automatisch einen Zahlungslink — bei Ablehnung eine Benachrichtigung per E-Mail.
            </Step>
            <Divider />
            <Step icon="🔒" title="Geld wird treuhänderisch gehalten">
              Nach der Kundenzahlung liegt das Geld sicher bei Festly. Du musst dir keine
              Sorgen um Zahlungsausfälle machen — das Geld ist garantiert, sobald der Kunde
              bezahlt hat.
            </Step>
            <Divider />
            <Step icon="💰" title="Auszahlung nach Event-Freigabe">
              Sobald der Kunde dein Event bestätigt (oder 7 Tage nach dem Event verstrichen
              sind), erhältst du <strong className="text-gray-900">85 % des Buchungswerts</strong> direkt auf dein
              Bankkonto. Die restlichen 15 % sind die Festly-Provision.
            </Step>
            <Divider />
            <Step icon="🏦" title="Stripe Connect Onboarding">
              Für die Auszahlung musst du einmalig dein Bankkonto über{' '}
              <strong className="text-gray-900">Stripe Connect</strong> verifizieren. Das
              dauert wenige Minuten und ist gesetzlich vorgeschrieben (KYC). Danach laufen
              alle Zahlungen automatisch.
            </Step>
          </Section>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-4">Bereit loszulegen?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/marktplatz" className="btn-primary px-8 py-3 text-sm font-semibold">
              Angebote entdecken
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 rounded-full text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-white transition-all"
            >
              Als Anbieter starten
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
