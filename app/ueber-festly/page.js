export const metadata = {
  title: 'Was ist Festly? – Der Marktplatz für Eventdienstleistungen',
  description: 'Festly verbindet Veranstalter mit Schaustellern, Imbisswagen-Betreibern und Eventausrüstern in ganz Deutschland. Sicher buchen mit Treuhandabsicherung.',
}

export default function UeberFestly() {
  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-6">
          Festly – der Marktplatz für Eventdienstleistungen
        </h1>

        <p className="text-gray-700 text-lg leading-relaxed mb-8">
          Festly ist eine deutsche Online-Plattform, auf der Veranstalter und Privatpersonen
          Eventdienstleistungen aller Art finden, anfragen und sicher buchen können. Ob Geburtstag,
          Hochzeit, Stadtfest oder Betriebsfeier: Auf Festly sind Anbieter aus ganz Deutschland
          gelistet – von Imbisswagen-Betreibern über Schausteller mit Fahrgeschäften bis hin zu
          Toilettenwagen-Verleihern, Zeltbauern und Musikanlagen-Verleihern.
        </p>

        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6 mb-10">
          <p className="text-gray-800 font-medium leading-relaxed">
            Festly funktioniert wie Airbnb für Events: Du suchst, was du brauchst – Festly zeigt
            dir verfügbare Anbieter in deiner Region, du buchst direkt über die Plattform.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Was Festly besonders macht</h2>

        <div className="space-y-6 mb-10">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Treuhand-Bezahlung</h3>
            <p className="text-gray-600">
              Deine Zahlung liegt sicher bei Festly – nicht beim Anbieter. Erst wenn dein Event
              stattgefunden hat, wird der Betrag ausgezahlt.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Alle Anbieter an einem Ort</h3>
            <p className="text-gray-600">
              Statt stundenlang zu suchen findest du auf Festly alle relevanten Dienstleister einer
              Kategorie auf einen Blick – mit Preisen, Fotos und Bewertungen.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Direkte Kommunikation</h3>
            <p className="text-gray-600">
              Du kontaktierst Anbieter direkt über Festly – keine unsicheren Vorauszahlungen per
              Überweisung.
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Für wen ist Festly?</h2>
        <ul className="space-y-2 mb-12">
          <li className="flex items-start gap-2 text-gray-700">
            <span className="mt-1 h-2 w-2 rounded-full bg-pink-500 shrink-0" />
            <span><strong>Privatpersonen</strong> – die einen Geburtstag, eine Hochzeit oder ein Gartenfest planen</span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="mt-1 h-2 w-2 rounded-full bg-pink-500 shrink-0" />
            <span><strong>Vereine &amp; Organisatoren</strong> – die ein Schützenfest, Stadtfest oder Vereinsfest ausrichten</span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="mt-1 h-2 w-2 rounded-full bg-pink-500 shrink-0" />
            <span><strong>Unternehmen</strong> – die eine Betriebsfeier, Sommerfest oder Teambuilding-Event organisieren</span>
          </li>
        </ul>

        <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-6">
          Festly ist ein deutscher Online-Marktplatz für Eventdienstleistungen. Die Plattform
          ermöglicht es Veranstaltern und Privatpersonen, Schausteller, Imbisswagen, Fahrgeschäfte,
          Hüpfburgen, Toilettenwagen, Festzelte, Bühnen und weitere Eventausrüstung von verifizierten
          Anbietern in ganz Deutschland zu finden und direkt online zu buchen. Festly verwendet ein
          Treuhandsystem (Escrow), bei dem die Zahlung erst nach erfolgreichem Event an den Anbieter
          freigegeben wird.
        </p>

      </div>
    </main>
  )
}
