import Link from 'next/link'
import Image from 'next/image'
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
        className="py-20 sm:py-28 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f0f9ff 100%)' }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Festly" width={240} height={96} className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
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
        </div>
      </section>

      {/* ── So funktioniert's ────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
            So funktioniert's
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 relative"
              >
                <div
                  className="absolute top-5 left-5 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(to right, #C026A0, #7C3AED)' }}
                >
                  {step}
                </div>
                <div className="text-4xl mt-1 mb-4 pl-8">{icon}</div>
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
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">
            Was suchst du?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {KATEGORIEN.map((kat) => (
              <Link
                key={kat.value}
                href={`/marktplatz?kategorie=${kat.value}`}
                className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 hover:shadow-md hover:border-pink-200 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {KATEGORIE_EMOJIS[kat.value] ?? '✨'}
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:gradient-text transition-colors">
                  {kat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Provider CTA ─────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4 text-center"
        style={{ background: 'linear-gradient(135deg, #fdf4ff 0%, #f0f9ff 100%)' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider gradient-text mb-3">
            Für Anbieter
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Biete deine Leistung an
          </h2>
          <p className="text-gray-500 mb-8 text-base leading-relaxed">
            Kostenlos inserieren, nur bei Buchung zahlen — 15 % Provision, fair und transparent.
          </p>
          <Link href="/register" className="btn-primary px-8 py-3.5 text-base font-semibold">
            Jetzt Anbieter werden
          </Link>
        </div>
      </section>

    </main>
  )
}
