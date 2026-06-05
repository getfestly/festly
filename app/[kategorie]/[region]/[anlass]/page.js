import { notFound } from 'next/navigation'
import Link from 'next/link'
import { KATEGORIEN, REGION_NAMES, KATEGORIE_EMOJI } from '@/lib/constants'

// ── Anlass-Definitionen ───────────────────────────────────────────────────────

const ANLAESSE = {
  stadtfest:        { label: 'Stadtfest',        planst: 'ein Stadtfest',         fuer: 'für ein Stadtfest'         },
  betriebsfeier:    { label: 'Betriebsfeier',    planst: 'eine Betriebsfeier',    fuer: 'für eine Betriebsfeier'    },
  hochzeit:         { label: 'Hochzeit',          planst: 'eine Hochzeit',         fuer: 'für eine Hochzeit'         },
  kindergeburtstag: { label: 'Kindergeburtstag', planst: 'einen Kindergeburtstag', fuer: 'für einen Kindergeburtstag' },
  vereinsfest:      { label: 'Vereinsfest',      planst: 'ein Vereinsfest',       fuer: 'für ein Vereinsfest'       },
  schuetzenfest:    { label: 'Schützenfest',     planst: 'ein Schützenfest',      fuer: 'für ein Schützenfest'      },
  geburtstag:       { label: 'Geburtstag',       planst: 'einen Geburtstag',      fuer: 'für einen Geburtstag'      },
  sommerfest:       { label: 'Sommerfest',       planst: 'ein Sommerfest',        fuer: 'für ein Sommerfest'        },
  weihnachtsmarkt:  { label: 'Weihnachtsmarkt',  planst: 'einen Weihnachtsmarkt', fuer: 'für einen Weihnachtsmarkt' },
  firmenevents:     { label: 'Firmenevent',      planst: 'ein Firmenevent',       fuer: 'für ein Firmenevent'       },
}

// ── Static Params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const params = []
  for (const kat of KATEGORIEN) {
    for (const reg of Object.keys(REGION_NAMES)) {
      for (const anl of Object.keys(ANLAESSE)) {
        params.push({ kategorie: kat.id, region: reg, anlass: anl })
      }
    }
  }
  return params
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { kategorie, region, anlass } = await params
  const kat = KATEGORIEN.find(k => k.id === kategorie)
  const reg = REGION_NAMES[region]
  const anl = ANLAESSE[anlass]
  if (!kat || !reg || !anl) return {}
  return {
    title: `${kat.label} ${anl.fuer} in ${reg} mieten`,
    description: `${kat.label} ${anl.fuer} in ${reg} finden und sicher buchen. Geprüfte Anbieter auf Festly – mit Treuhand-Bezahlung und direktem Anbieter-Kontakt.`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ProgrammaticSEOPage({ params }) {
  const { kategorie, region, anlass } = await params

  const kat = KATEGORIEN.find(k => k.id === kategorie)
  const reg = REGION_NAMES[region]
  const anl = ANLAESSE[anlass]

  if (!kat || !reg || !anl) notFound()

  const emoji   = KATEGORIE_EMOJI[kat.id] ?? '🎪'
  const ctaHref = `/?kategorie=${kat.id}&region=${encodeURIComponent(reg)}`

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="mb-8">
          <p className="text-4xl mb-3">{emoji}</p>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">
            {kat.label} {anl.fuer} in {reg}
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Du planst {anl.planst} in {reg} und suchst {kat.label.toLowerCase()}?
            Auf Festly findest du geprüfte Anbieter aus {reg} – direkt anfragen,
            sicher buchen.
          </p>
        </div>

        {/* Unterkategorien */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Angebote in der Kategorie „{kat.label}"
          </h2>
          <ul className="space-y-2">
            {kat.subcategories.map(sub => (
              <li key={sub.id} className="flex items-start gap-2 text-gray-700">
                <span className="mt-1 h-2 w-2 rounded-full bg-pink-500 shrink-0" />
                {sub.label}
              </li>
            ))}
          </ul>
        </section>

        {/* Vorteile */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Warum Festly für dein {anl.label}?
          </h2>
          <div className="space-y-3">
            {[
              {
                title: `Anbieter aus ${reg}`,
                text: `Alle gelisteten Anbieter sind in ${reg} aktiv oder liefern dorthin.`,
              },
              {
                title: 'Treuhand-Bezahlung',
                text: 'Deine Zahlung liegt sicher bei Festly – nicht beim Anbieter. Erst nach deinem Event wird der Betrag ausgezahlt.',
              },
              {
                title: 'Direkte Anfrage',
                text: 'Du kontaktierst Anbieter direkt über Festly – transparent, ohne Zwischenhändler.',
              },
            ].map(({ title, text }) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-sm">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Treuhand-Callout */}
        <div className="rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 p-6 mb-8">
          <p className="text-gray-800 font-medium leading-relaxed">
            🔒 <strong>Treuhand-Schutz auf Festly:</strong> Deine Zahlung{' '}
            {anl.fuer} ist bei Festly hinterlegt und wird erst nach erfolgreichem
            Event an den Anbieter freigegeben. So bist du auf der sicheren Seite.
          </p>
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Jetzt {kat.label} in {reg} finden
        </Link>

      </div>
    </main>
  )
}
