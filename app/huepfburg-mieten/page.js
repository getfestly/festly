import Link from 'next/link'

export const metadata = {
  title: 'Hüpfburg mieten – für Kindergeburtstag, Fest & Firmenevent',
  description: 'Hüpfburg mieten in Deutschland: Große Auswahl, geprüfte Anbieter, sichere Buchung. Für Kindergeburtstag, Vereinsfest, Betriebsfeier und mehr.',
}

export default function HuepfburgMieten() {
  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-6">
          Hüpfburg mieten – Spaß für Klein und Groß
        </h1>

        <h2 className="text-xl font-bold text-gray-900 mb-3">Kategorien & Varianten</h2>
        <ul className="space-y-2 mb-8">
          {[
            'Klassische Hüpfburgen',
            'Kletterburgen & Kombis',
            'XXL-Hüpfburgen',
            'Themed Hüpfburgen (Piraten, Prinzessin, Dschungel)',
            'Hüpfburg mit Rutsche',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 rounded-full bg-pink-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-bold text-gray-900 mb-3">Passend für diese Anlässe</h2>
        <ul className="space-y-2 mb-8">
          {[
            'Kindergeburtstag & Gartenparty',
            'Stadtfest & Vereinsfest',
            'Betriebsfeier & Firmenfest',
            'Schulveranstaltungen & Kita-Feste',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6 mb-6">
          <p className="text-gray-800 font-medium">
            Viele Anbieter liefern und bauen die Hüpfburg direkt auf – frag einfach beim Anbieter nach.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 mb-8">
          <p className="text-gray-800 font-medium">
            🔒 Sicher buchen mit Treuhand: Deine Zahlung liegt bei Festly – nicht beim Anbieter.
            Erst nach deinem Event wird der Betrag ausgezahlt.
          </p>
        </div>

        <Link
          href="/marktplatz?kategorie=kindergeschaefte"
          className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Jetzt Anbieter finden
        </Link>

      </div>
    </main>
  )
}
