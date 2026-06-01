import Link from 'next/link'

export const metadata = { title: 'Widerrufsbelehrung – Festly' }

export default function WiderrufPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Widerrufsbelehrung</h1>
        <p className="text-gray-500 text-sm mb-10">gemäß § 312g BGB i.V.m. Art. 246a EGBGB</p>

        {/* ================================================================
            HINWEIS: Dieser Inhalt ist ein Platzhalter.
            Der finale, anwaltlich geprüfte Text wird vom Gründer eingefügt.
            ================================================================ */}

        <div className="space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Widerrufsrecht</h2>
            <p className="leading-relaxed">
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
            </p>
            <p className="leading-relaxed mt-3">
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
            </p>
            <p className="leading-relaxed mt-3">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ([Name, Adresse, E-Mail]) mittels einer
              eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren
              Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Folgen des Widerrufs</h2>
            <p className="leading-relaxed">
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
              erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen,
              an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Vorzeitiges Erlöschen des Widerrufsrechts</h2>
            <p className="leading-relaxed">
              [Hinweis auf § 356 Abs. 4 BGB: Das Widerrufsrecht erlischt bei Dienstleistungen,
              wenn der Anbieter mit der Ausführung begonnen hat und der Verbraucher ausdrücklich
              zugestimmt hat, dass der Unternehmer vor Ablauf der Widerrufsfrist mit der Ausführung
              beginnt, und seine Kenntnis davon bestätigt hat, dass er durch die vollständige
              Vertragserfüllung sein Widerrufsrecht verliert.]
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Muster-Widerrufsformular</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm leading-relaxed">
              <p className="font-medium mb-2">Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus:</p>
              <p>An: [Name, Adresse, E-Mail]</p>
              <p className="mt-2">
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über
                die Erbringung der folgenden Dienstleistung (*)
              </p>
              <p className="mt-2">Bestellt am (*) / erhalten am (*)</p>
              <p className="mt-2">Name des/der Verbraucher(s)</p>
              <p className="mt-2">Anschrift des/der Verbraucher(s)</p>
              <p className="mt-2">Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
              <p className="mt-2">Datum</p>
              <p className="mt-4 text-gray-400">(*) Unzutreffendes streichen.</p>
            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
