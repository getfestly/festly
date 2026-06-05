export const metadata = {
  title: 'FAQ – Häufige Fragen zu Festly | Eventdienstleistungen buchen',
  description: 'Wie funktioniert Festly? Wie buche ich einen Imbisswagen oder Schausteller? Alle Antworten zu Buchung, Zahlung und Ablauf.',
}

const faqs = [
  {
    q: 'Was ist Festly?',
    a: 'Festly ist ein Online-Marktplatz für Eventdienstleistungen in Deutschland. Veranstalter und Privatpersonen finden dort Anbieter für Imbisswagen, Fahrgeschäfte, Hüpfburgen, Toilettenwagen, Festzelte, Bühnen und mehr – und können diese direkt sicher online buchen.',
  },
  {
    q: 'Wie funktioniert die Buchung auf Festly?',
    a: 'Du suchst nach der gewünschten Kategorie und Region, wählst einen Anbieter aus und sendest eine Buchungsanfrage. Der Anbieter bestätigt, du bezahlst sicher über Festly – und deine Zahlung liegt bis nach dem Event sicher bei Festly.',
  },
  {
    q: 'Wie ist meine Zahlung abgesichert?',
    a: 'Festly verwendet ein Treuhandsystem (Escrow): Deine Zahlung wird von Festly gehalten und erst nach dem Event an den Anbieter ausgezahlt. Findet das Event nicht statt, greift die Stornoregelung zu deinen Gunsten.',
  },
  {
    q: 'Was kann ich über Festly buchen?',
    a: 'Imbisswagen, Foodtrucks, Ausschankwagen, Fahrgeschäfte, Karussells, Hüpfburgen, Eventmodule, Toilettenwagen, Festzelte, Pagodenzelten, Musikanlagen, Lichtanlagen, Bühnen, Eiswagen, Süßigkeitenstände, Schießbuden, Losbuden und viele weitere Eventdienstleistungen.',
  },
  {
    q: 'Für welche Veranstaltungen eignet sich Festly?',
    a: 'Geburtstagsfeiern, Hochzeiten, Gartenpartys, Betriebsfeiern, Sommerfeste, Stadtfeste, Schützenfeste, Vereinsfeste, Weihnachtsmärkte, Schulveranstaltungen und mehr.',
  },
  {
    q: 'In welchen Regionen ist Festly verfügbar?',
    a: 'Festly ist deutschlandweit verfügbar. Anbieter sind in allen Bundesländern gelistet.',
  },
  {
    q: 'Was kostet die Nutzung von Festly für Kunden?',
    a: 'Für Kunden ist die Nutzung von Festly kostenlos. Du bezahlst nur den vereinbarten Preis für die gebuchte Dienstleistung.',
  },
  {
    q: 'Kann ich eine Buchung stornieren?',
    a: 'Ja. Festly hat eine klare Stornierungsregelung, die nach zeitlichem Vorlauf gestaffelt ist. Je früher du stornierst, desto mehr wird erstattet. Die genauen Konditionen sind in den AGB einsehbar.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

export default function FAQ() {
  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
          Häufige Fragen
        </h1>
        <p className="text-gray-500 mb-10">Alles zu Buchung, Zahlung und Ablauf auf Festly.</p>

        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-900 mb-2">{q}</p>
              <p className="text-gray-600 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
