import Link from 'next/link'
import { KATEGORIEN } from '@/lib/constants'

const KATEGORIE_EMOJIS = {
  food:       '🍽️',
  ride:       '🎡',
  music:      '🎵',
  sanitation: '🚿',
  tech:       '💡',
  rental:     '📦',
  other:      '✨',
}

const STEPS = [
  {
    step: 1,
    icon: '🔍',
    title: 'Angebot finden',
    desc: 'Stöbere durch geprüfte Anbieter in deiner Region und vergleiche Leistungen und Preise.',
  },
  {
    step: 2,
    icon: '📋',
    title: 'Sicher buchen',
    desc: 'Stelle eine Anfrage mit deinen Event-Details. Zahle erst nach Bestätigung durch den Anbieter.',
  },
  {
    step: 3,
    icon: '✅',
    title: 'Event genießen',
    desc: 'Festly hält dein Geld treuhänderisch — die Auszahlung erfolgt erst nach deiner Freigabe.',
  },
]

export default function Home() {
  return (
    <main className="flex-1">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="min-h-[85vh] flex items-center justify-center px-4 text-center"
        style={{ background: 'radial-gradient(ellipse at center, #fdf4ff 0%, #fce7f3 35%, #ffffff 70%)' }}
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            Dein Event.<br />
            <span className="gradient-text">Perfekt organisiert.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Finde und buche Schausteller, Caterer, Musiker und mehr — sicher bezahlt über Festly.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/marktplatz" className="btn-primary px-8 py-3.5 text-base font-semibold">
              Angebote entdecken
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-full text-base font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-white/80 transition-all"
            >
              Als Anbieter starten
            </Link>
          </div>

          {/* Trust-Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-8 text-sm text-gray-400">
            <span>✓ Sicher bezahlt via Stripe</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span>✓ Kostenlos anfragen</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <span>✓ Nur bei Buchung zahlen</span>
          </div>
        </div>
      </section>

      {/* ── So funktioniert's ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            So funktioniert's
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mb-4"
                  style={{ background: 'linear-gradient(to right, #C026A0, #7C3AED)' }}
                >
                  {step}
                </div>
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link
              href="/so-funktionierts"
              className="text-sm text-gray-400 hover:text-gray-700 underline underline-offset-2 transition-colors"
            >
              Alle Details erfahren →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Kategorien ───────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            Was suchst du?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {KATEGORIEN.map((kat) => (
              <Link
                key={kat.value}
                href={`/marktplatz?kategorie=${kat.value}`}
                className="bg-white rounded-2xl p-5 text-center border border-gray-100
                  hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50
                  hover:border-pink-400 hover:shadow-md
                  transition-all group min-h-[100px] flex flex-col items-center justify-center gap-2"
              >
                <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                  {KATEGORIE_EMOJIS[kat.value] ?? '✨'}
                </div>
                <p className="text-sm font-bold text-gray-700 group-hover:gradient-text transition-colors">
                  {kat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Anbieter CTA ─────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #C026A0 0%, #7C3AED 100%)' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-200 mb-3">
            Für Anbieter
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
            Biete deine Leistung an
          </h2>
          <p className="text-pink-100 mb-10 text-base leading-relaxed">
            Kostenlos inserieren, nur bei Buchung zahlen — 15 % Provision, fair und transparent.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white px-8 py-3.5 rounded-full text-base font-semibold gradient-text hover:shadow-xl hover:scale-105 transition-all"
          >
            Jetzt Anbieter werden
          </Link>
        </div>
      </section>

    </main>
  )
}
