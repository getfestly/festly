import Link from 'next/link'

export const metadata = {
  title: 'Imbisswagen mieten – Foodtruck & Ausschankwagen für dein Event',
  description: 'Imbisswagen, Foodtrucks und Ausschankwagen mieten in Deutschland. Geprüfte Anbieter für Betriebsfest, Hochzeit, Stadtfest und mehr. Sicher buchen auf Festly.',
}

export default function ImbisswagenMieten() {
  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-6">
          Imbisswagen mieten – für jede Veranstaltung
        </h1>

        <p className="text-gray-700 text-lg leading-relaxed mb-8">
          Du planst ein Event und brauchst Verpflegung für deine Gäste? Auf Festly findest du
          Imbisswagen, Foodtrucks und Ausschankwagen von professionellen Anbietern in ganz
          Deutschland – für jeden Anlass und jede Gästezahl.
        </p>

        <h2 className="text-xl font-bold text-gray-900 mb-3">Kategorien & Varianten</h2>
        <ul className="space-y-2 mb-8">
          {[
            'Imbisswagen (Bratwurst, Burger, Pommes, internationale Küche)',
            'Foodtrucks (mobile Küchen)',
            'Ausschankwagen (Bier, Cocktails, Softdrinks, Glühwein)',
            'Getränkewagen',
            'Cocktailbar-Anhänger',
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
            'Betriebsfeiern & Firmenfeste',
            'Hochzeiten & Gartenpartys',
            'Stadtfeste & Schützenfeste',
            'Vereinsfeste & Kirchenfeste',
            'Geburtstage & Jubiläen',
          ].map(item => (
            <li key={item} className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6 mb-8">
          <p className="text-gray-800 font-medium">
            🔒 Sicher buchen mit Treuhand: Deine Zahlung liegt bei Festly – nicht beim Anbieter.
            Erst nach deinem Event wird der Betrag ausgezahlt.
          </p>
        </div>

        <Link
          href="/marktplatz?kategorie=imbiss_ausschank"
          className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Jetzt Anbieter finden
        </Link>

      </div>
    </main>
  )
}
