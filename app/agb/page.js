import Link from 'next/link'

export const metadata = { title: 'AGB – Festly' }

export default function AgbPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Allgemeine Geschäftsbedingungen</h1>
        <p className="text-gray-500 text-sm mb-10">Stand: [Datum einfügen]</p>

        {/* ================================================================
            HINWEIS: Dieser Inhalt ist ein Platzhalter.
            Der finale, anwaltlich geprüfte Text wird vom Gründer eingefügt.
            ================================================================ */}

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 1 Geltungsbereich</h2>
            <p className="leading-relaxed">
              [Diese AGB gelten für alle Verträge zwischen Festly und seinen Nutzern.
              Festly betreibt einen Online-Marktplatz für Event-Dienstleistungen.]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 2 Leistungsbeschreibung</h2>
            <p className="leading-relaxed">
              [Beschreibung der Plattformleistung: Vermittlung zwischen Kunden und Anbietern,
              Treuhandzahlung, Provisionspflicht]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 3 Registrierung und Nutzerkonto</h2>
            <p className="leading-relaxed">
              [Voraussetzungen für die Registrierung, Pflichten des Nutzers, Zugangsdaten]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 4 Buchungsablauf und Vertragsschluss</h2>
            <p className="leading-relaxed">
              [Ablauf einer Buchungsanfrage, Annahme durch den Anbieter, Zeitpunkt des Vertragsschlusses,
              Treuhandzahlung über Stripe]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 5 Provision</h2>
            <p className="leading-relaxed">
              Festly erhebt eine Plattformprovision von 15 % auf den Buchungsbetrag.
              [Weitere Details zur Fälligkeit und Abrechnung]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 6 Stornierung und Rücktritt</h2>
            <p className="leading-relaxed">
              [Gestaffelte Stornogebühren: 100 % Erstattung ab 30 Tagen vor dem Event,
              50 % ab 14 Tagen, 25 % ab 3 Tagen, keine Erstattung innerhalb von 3 Tagen]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 7 Pflichten der Anbieter</h2>
            <p className="leading-relaxed">
              [PStTG-Pflichten, Angabe von Steuernummer/USt-ID, Einhaltung von Qualitätsstandards]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 8 Haftung</h2>
            <p className="leading-relaxed">
              [Haftungsbeschränkung der Plattform, Haftung der Anbieter für ihre Leistungen]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">§ 9 Schlussbestimmungen</h2>
            <p className="leading-relaxed">
              Es gilt das Recht der Bundesrepublik Deutschland. [Gerichtsstand, Salvatorische Klausel]
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
