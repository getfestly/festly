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
    desc: 'Kategorie und Region wählen, Angebote mit Fotos und Preisen vergleichen, direkt anfragen. Kein Telefonat nötig.',
  },
  {
    icon: '📅',
    title: 'Event-Details angeben',
    desc: 'Datum, Ort, Personenanzahl und eine kurze Beschreibung. Der Anbieter weiß sofort was gefragt ist.',
  },
  {
    icon: '🔒',
    title: 'Sicher bezahlen',
    desc: 'Dein Geld liegt bei Festly, nicht beim Anbieter. Du zahlst nie in Vorkasse an jemanden den du nicht kennst.',
  },
  {
    icon: '🎉',
    title: 'Event genießen',
    desc: 'Alles gut gelaufen? Einmal bestätigen. Oder einfach nichts tun — nach 7 Tagen wird automatisch ausgezahlt.',
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
    desc: 'Angebot in wenigen Minuten erstellen, Fotos hochladen, sofort sichtbar. Keine Monatsgebühr, keine Einrichtungskosten.',
  },
  {
    icon: '✅',
    title: 'Du entscheidest',
    desc: 'Jede Anfrage einzeln annehmen oder ablehnen. Volle Kontrolle über deinen Kalender.',
  },
  {
    icon: '🏦',
    title: 'Keine Zahlungsausfälle',
    desc: 'Festly stellt sicher dass die Zahlung vor dem Event gesichert ist. Du fährst hin und weißt: das Geld ist da.',
  },
  {
    icon: '💸',
    title: 'Auszahlung nach dem Event',
    desc: 'Direkt auf dein Konto. Du siehst bei jeder Buchung vorher genau was du bekommst.',
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
            Der sicherste Marktplatz für Eventdienstleistungen in Deutschland.
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Dein Geld liegt bei uns — nicht beim Anbieter. Erst wenn dein Event geklappt hat, wird ausgezahlt.
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

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Häufige Fragen</h2>
        <div className="flex flex-col gap-3">
          {[
            {
              q: 'Was kostet Festly für Kunden?',
              a: 'Nichts. Die Nutzung von Festly ist für Kunden vollständig kostenlos. Du bezahlst nur den vereinbarten Preis für die gebuchte Leistung.',
            },
            {
              q: 'Was passiert wenn der Anbieter nicht erscheint oder absagt?',
              a: 'Du bekommst dein Geld zurück. Da Festly die Zahlung treuhänderisch hält, kann kein Anbieter einfach mit deinem Geld verschwinden. Die Stornoregelung greift zu deinen Gunsten.',
            },
            {
              q: 'Wie schnell bekomme ich als Anbieter mein Geld?',
              a: 'Nach dem Event. Sobald der Kunde die Leistung bestätigt, wird die Auszahlung ausgelöst. Tut er das nicht, erfolgt die Freigabe automatisch nach 7 Tagen.',
            },
            {
              q: 'Kann ich als Anbieter Anfragen ablehnen?',
              a: 'Ja, jederzeit. Du entscheidest selbst welche Buchungen du annimmst. Keine Anfrage verpflichtet dich zu irgendetwas.',
            },
            {
              q: 'Ist meine Zahlung wirklich sicher?',
              a: 'Ja. Festly nutzt Stripe — einen der weltweit führenden Zahlungsanbieter. Deine Kartendaten werden niemals auf unseren Servern gespeichert.',
            },
          ].map(({ q, a }) => (
            <details
              key={q}
              className="group bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none select-none hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900 text-sm leading-snug">{q}</span>
                <span
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform group-open:rotate-45"
                  style={{ background: 'linear-gradient(135deg, #C026A0, #7C3AED)' }}
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                {a}
              </p>
            </details>
          ))}
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
            Keine versteckten Gebühren. Kein Abo. Einfach loslegen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/marktplatz"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors text-sm"
            >
              🔍 Marktplatz entdecken
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
