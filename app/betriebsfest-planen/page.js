import Link from 'next/link'

export const metadata = {
  title: 'Betriebsfest planen – Imbisswagen, Fahrgeschäfte & mehr buchen',
  description: 'Betriebsfeier organisieren leicht gemacht: Alle Eventdienstleister auf einem Marktplatz. Imbisswagen, Hüpfburgen, Bühnen & mehr sicher buchen.',
}

const checklist = [
  { label: 'Verpflegung', detail: 'Imbisswagen, Foodtrucks, Ausschankwagen' },
  { label: 'Unterhaltung', detail: 'Hüpfburgen, Fahrgeschäfte, Spielgeschäfte' },
  { label: 'Location & Zelte', detail: 'Festzelte, Pagodenzelten, Bühne' },
  { label: 'Technik', detail: 'Musikanlage, Lichtanlage, Beamer' },
  { label: 'Sanitär', detail: 'Toilettenwagen für Außenveranstaltungen' },
]

const faq = [
  {
    q: 'Wie früh sollte ich buchen?',
    a: '6–8 Wochen Vorlauf sind empfohlen, besonders in der Hochsaison (Mai–September). Beliebte Anbieter sind oft Wochen im Voraus ausgebucht.',
  },
  {
    q: 'Was kostet ein Imbisswagen für ein Betriebsfest?',
    a: 'Preise variieren je nach Anbieter, Region, Dauer und Gästezahl. Auf Festly siehst du das Preismodell direkt beim Angebot – transparent und vergleichbar.',
  },
]

export default function BetriebsfestPlanen() {
  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-6">
          Betriebsfest planen – alles auf einem Marktplatz
        </h1>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Checkliste: Was brauche ich?</h2>
        <ul className="space-y-3 mb-8">
          {checklist.map(({ label, detail }) => (
            <li key={label} className="flex items-start gap-3 text-gray-700">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold">✓</span>
              <span><strong>{label}</strong> – {detail}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6 mb-10">
          <p className="text-gray-800 font-medium">
            🔒 Sicher buchen mit Treuhand: Deine Zahlung liegt bei Festly – nicht beim Anbieter.
            Erst wenn dein Event stattgefunden hat, wird der Betrag ausgezahlt.
          </p>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Häufige Fragen</h2>
        <div className="space-y-4 mb-10">
          {faq.map(({ q, a }) => (
            <div key={q} className="rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-gray-900 mb-1">{q}</p>
              <p className="text-gray-600">{a}</p>
            </div>
          ))}
        </div>

        <Link
          href="/marktplatz"
          className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Jetzt Anbieter suchen
        </Link>

      </div>
    </main>
  )
}
