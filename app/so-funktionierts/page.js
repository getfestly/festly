import Link from 'next/link'

export const metadata = {
  title: 'So funktioniert Festly — Der sichere Marktplatz für Eventdienstleistungen',
  description:
    'Wie Festly funktioniert: Angebote finden, sicher bezahlen und Events genießen — als Kunde oder Anbieter.',
}

const STEPS_CUSTOMER = [
  {
    icon: '🔍',
    title: 'Angebot finden & anfragen',
    desc: 'Kategorie und Region wählen, Angebote vergleichen und direkt anfragen.',
  },
  {
    icon: '📅',
    title: 'Event-Details angeben',
    desc: 'Datum, Personenanzahl und eine kurze Beschreibung deines Events mitteilen.',
  },
  {
    icon: '🔒',
    title: 'Sicher bezahlen',
    desc: 'Deine Zahlung läuft über Festly (Treuhand) — kein Risiko, kein Vorauszahlungsrisiko.',
  },
  {
    icon: '🎉',
    title: 'Event genießen & freigeben',
    desc: 'Nach dem Event Zahlung manuell freigeben. Ohne Aktion erfolgt die Freigabe automatisch nach 7 Tagen.',
  },
]

const STORNO = [
  { range: '30+ Tage vorher', fee: 'Kostenlos' },
  { range: '14–29 Tage vorher', fee: '25 %' },
  { range: '7–13 Tage vorher', fee: '50 %' },
  { range: '0–6 Tage vorher', fee: '75 %' },
]

const STEPS_PROVIDER = [
  {
    icon: '✨',
    title: 'Kostenlos inserieren',
    desc: 'Angebot in wenigen Minuten erstellen, Fotos hochladen und sofort sichtbar sein.',
  },
  {
    icon: '✅',
    title: 'Anfragen selbst entscheiden',
    desc: 'Jede Buchungsanfrage einzeln annehmen oder ablehnen — du behältst die Kontrolle.',
  },
  {
    icon: '🏦',
    title: 'Geld sicher verwahrt',
    desc: 'Festly hält die Kundenzahlung treuhänderisch bis nach dem Event.',
  },
  {
    icon: '💸',
    title: 'Auszahlung erhalten',
    desc: 'Nach Event-Bestätigung wird der Betrag abzüglich der Plattformgebühr ausgezahlt.',
  },
]

function StepCard({ icon, title, desc, accent, index }) {
  return (
    <div className="flex gap-4 items-start">
      <div
        className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-sm"
        style={{ background: accent }}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 leading-snug">{title}</p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function SoFunktioniertPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100 py-20 px-4">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 60% 0%, #C026A0 0%, #7C3AED 60%, transparent 80%)' }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4"
            style={{
              background: 'linear-gradient(135deg, #C026A0, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            So funktioniert Festly
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Der sichere Marktplatz für Eventdienstleistungen in Deutschland.
          </p>
        </div>
      </section>

      {/* ── Zweispaltig ────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8">

        {/* Kunden */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col gap-7">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-sm"
              style={{ background: '#C026A0' }}
            >
              👤
            </div>
            <h2 className="text-xl font-bold text-gray-900">Für Kunden</h2>
          </div>

          <div className="flex flex-col gap-6">
            {STEPS_CUSTOMER.map((s, i) => (
              <StepCard key={i} {...s} accent="#C026A0" index={i} />
            ))}
          </div>

          {/* Storno-Tabelle */}
          <div className="mt-2 rounded-2xl overflow-hidden border border-pink-100">
            <div
              className="px-4 py-2.5 text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(90deg, #C026A0, #db2777)' }}
            >
              Storno-Regelung
            </div>
            <div className="divide-y divide-pink-50">
              {STORNO.map(({ range, fee }) => (
                <div key={range} className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-gray-600">{range}</span>
                  <span
                    className="font-semibold"
                    style={{ color: fee === 'Kostenlos' ? '#16a34a' : '#C026A0' }}
                  >
                    {fee}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Anbieter */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col gap-7">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-sm"
              style={{ background: '#7C3AED' }}
            >
              🎪
            </div>
            <h2 className="text-xl font-bold text-gray-900">Für Anbieter</h2>
          </div>

          <div className="flex flex-col gap-6">
            {STEPS_PROVIDER.map((s, i) => (
              <StepCard key={i} {...s} accent="#7C3AED" index={i} />
            ))}
          </div>
        </div>

      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4">
        <div
          className="max-w-2xl mx-auto rounded-3xl p-10 text-center text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #C026A0 0%, #7C3AED 100%)' }}
        >
          <h2 className="text-2xl font-extrabold mb-2">Bereit loszulegen?</h2>
          <p className="text-white/80 mb-8 text-sm leading-relaxed">
            Finde das perfekte Angebot für dein nächstes Event oder werde selbst Anbieter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/marktplatz"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors text-sm"
            >
              🔍 Jetzt entdecken
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-white/20 transition-colors text-sm"
            >
              🎪 Anbieter werden
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
