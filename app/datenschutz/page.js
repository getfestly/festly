import Link from 'next/link'

export const metadata = { title: 'Datenschutzerklärung – Festly' }

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-gray-500 text-sm mb-10">Stand: [Datum einfügen]</p>

        {/* ================================================================
            HINWEIS: Dieser Inhalt ist ein Platzhalter.
            Der finale, anwaltlich geprüfte Text wird vom Gründer eingefügt.
            ================================================================ */}

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Verantwortlicher</h2>
            <p className="leading-relaxed">
              [Name und Anschrift des Verantwortlichen gemäß Art. 4 Nr. 7 DSGVO]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Erhobene Daten und Zweck der Verarbeitung</h2>
            <p className="leading-relaxed">
              [Beschreibung der erhobenen Daten: Registrierungsdaten, Buchungsdaten, Zahlungsdaten,
              Kommunikationsdaten – und der jeweilige Verarbeitungszweck sowie Rechtsgrundlage gemäß Art. 6 DSGVO]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Weitergabe an Dritte</h2>
            <p className="leading-relaxed">
              [Hinweis auf Stripe (Zahlungsabwicklung), Supabase (Datenbankhosting), Resend (E-Mail-Versand)
              und weitere Dienstleister – mit Rechtsgrundlage und ggf. Drittlandübermittlung]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Speicherdauer</h2>
            <p className="leading-relaxed">
              [Angaben zur Speicherdauer der verschiedenen Datenkategorien, gesetzliche Aufbewahrungsfristen]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Betroffenenrechte</h2>
            <p className="leading-relaxed">
              Sie haben gemäß DSGVO das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
              Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20)
              sowie Widerspruch (Art. 21). Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
              [kontakt@festly.de]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Beschwerderecht</h2>
            <p className="leading-relaxed">
              Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies und Tracking</h2>
            <p className="leading-relaxed">
              [Hinweis auf technisch notwendige Cookies (Supabase-Session), keine Tracking-Cookies]
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
