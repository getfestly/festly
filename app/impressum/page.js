import Link from 'next/link'

export const metadata = { title: 'Impressum – Festly' }

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Impressum</h1>
        <p className="text-gray-500 text-sm mb-10">Angaben gemäß § 5 TMG</p>

        {/* ================================================================
            HINWEIS: Dieser Inhalt ist ein Platzhalter.
            Der finale, anwaltlich geprüfte Text wird vom Gründer eingefügt.
            ================================================================ */}

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Verantwortlich</h2>
            <p className="leading-relaxed">
              [Name des Betreibers]<br />
              [Straße und Hausnummer]<br />
              [PLZ Ort]<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Kontakt</h2>
            <p className="leading-relaxed">
              E-Mail: [kontakt@festly.de]<br />
              Telefon: [+49 …]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Umsatzsteuer-Identifikationsnummer</h2>
            <p className="leading-relaxed">
              [USt-IdNr. gemäß § 27a UStG: DE …]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p className="leading-relaxed">
              [Name]<br />
              [Anschrift wie oben]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Streitschlichtung</h2>
            <p className="leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
            <p className="leading-relaxed mt-3">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
