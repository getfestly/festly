import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  KATEGORIE_SLUGS,
  REGION_SLUGS,
  ANLASS_SLUGS,
  regionDbWerte,
  kategorieDbWerte,
} from '@/lib/seo-config'

// ISR: Seiten alle 24h neu generieren — neue Anbieter öffnen neue Seiten automatisch
export const revalidate = 86400

// ── Supabase-REST-Hilfsfunktion ───────────────────────────────────────────────
// Kein Cookie-Zugriff (cookies() würde Route dynamisch machen und generateStaticParams blockieren)

async function fetchListings(katWerte, regWerte) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const qs = new URLSearchParams({
      select: 'id,title,description,price_cents,price_model,photos,region',
      'is_active': 'eq.true',
      'category': `in.(${katWerte.join(',')})`,
      'region': `in.(${regWerte.join(',')})`,
      limit: '12',
    })
    const res = await fetch(`${url}/rest/v1/listings?${qs}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

// ── generateStaticParams ──────────────────────────────────────────────────────
// Nur Kombinationen generieren, für die mindestens 1 aktiver Anbieter existiert.

export async function generateStaticParams() {
  let listings = []
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return []
    const res = await fetch(
      `${url}/rest/v1/listings?is_active=eq.true&select=category,region`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    if (res.ok) listings = await res.json()
  } catch {
    return []
  }

  const params = []
  for (const kategorieSlug of Object.keys(KATEGORIE_SLUGS)) {
    const katWerte = kategorieDbWerte(kategorieSlug)
    for (const regionSlug of Object.keys(REGION_SLUGS)) {
      const regWerte = regionDbWerte(regionSlug)
      const hatAnbieter = listings.some(
        l => katWerte.includes(l.category) && regWerte.includes(l.region)
      )
      if (hatAnbieter) {
        for (const anlassSlug of Object.keys(ANLASS_SLUGS)) {
          params.push({ kategorie: kategorieSlug, region: regionSlug, anlass: anlassSlug })
        }
      }
    }
  }
  return params
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { kategorie, region, anlass } = await params
  const kat = KATEGORIE_SLUGS[kategorie]
  const reg = REGION_SLUGS[region]
  const anl = ANLASS_SLUGS[anlass]
  if (!kat || !reg || !anl) return {}
  return {
    title: `${kat.label} mieten ${reg.label} – ${anl.label}`,
    description: `${kat.label} ${anl.beschreibung} in ${reg.label} mieten. Geprüfte Anbieter, sichere Buchung mit Treuhand-Bezahlung. Jetzt auf Festly finden.`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SEOLandingPage({ params }) {
  const { kategorie, region, anlass } = await params

  const kat = KATEGORIE_SLUGS[kategorie]
  const reg = REGION_SLUGS[region]
  const anl = ANLASS_SLUGS[anlass]

  if (!kat || !reg || !anl) notFound()

  const katWerte = kategorieDbWerte(kategorie)
  const regWerte = regionDbWerte(region)
  const listings = await fetchListings(katWerte, regWerte)

  if (!listings.length) notFound()

  const ctaHref = `/?kategorie=${kat.dbWert}&region=${encodeURIComponent(reg.label)}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${kat.label} ${anl.beschreibung} in ${reg.label}`,
    description: `${kat.label} mieten in ${reg.label} für ${anl.label} – geprüfte Anbieter auf Festly`,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: l.title,
      url: `https://festly.de/angebote/${l.id}`,
    })),
  }

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-6 flex flex-wrap gap-1 items-center">
          <Link href="/" className="hover:text-gray-700 transition-colors">Festly</Link>
          <span>›</span>
          <Link href={`/?kategorie=${kat.dbWert}`} className="hover:text-gray-700 transition-colors">{kat.label}</Link>
          <span>›</span>
          <span className="text-gray-600">{reg.label}</span>
          <span>›</span>
          <span className="text-gray-600">{anl.label}</span>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-4">
          {kat.emoji} {kat.label} mieten in {reg.label} – {anl.label}
        </h1>

        {/* Intro */}
        <p className="text-gray-600 text-lg mb-4 leading-relaxed">
          Du planst {anl.beschreibung} in {reg.label} und suchst {kat.label.toLowerCase()}?
          Auf Festly findest du{' '}
          <strong>{listings.length} geprüfte{listings.length === 1 ? 'n Anbieter' : ' Anbieter'}</strong>{' '}
          in {reg.label} – einfach anfragen, sicher buchen.
        </p>

        {/* Trust-Callout */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4 mb-8 text-sm text-gray-700">
          🔒 <strong>Treuhand-Bezahlung:</strong> Dein Geld liegt sicher bei Festly bis nach dem
          Event. Erst dann wird an den Anbieter ausgezahlt.
        </div>

        {/* Anbieter-Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {listings.map(listing => (
            <Link
              key={listing.id}
              href={`/angebote/${listing.id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {listing.photos?.[0] ? (
                <img
                  src={listing.photos[0]}
                  alt={listing.title}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-4xl">
                  {kat.emoji}
                </div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-gray-900 mb-1 text-sm line-clamp-2">{listing.title}</h2>
                {listing.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">{listing.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mb-12">
          <Link
            href={ctaHref}
            className="inline-block bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Alle Anbieter in {reg.label} anzeigen
          </Link>
        </div>

        {/* SEO-Text */}
        <div className="pt-8 border-t border-gray-100 text-sm text-gray-500">
          <h2 className="font-semibold text-gray-700 mb-2">
            {kat.label} {anl.beschreibung} in {reg.label} buchen
          </h2>
          <p className="leading-relaxed">
            {kat.beschreibung} Alle Anbieter auf Festly sind verifiziert. Du buchst sicher über
            Festly mit Treuhand-Bezahlung – dein Geld ist bis nach dem Event geschützt. Einfach
            Anbieter auswählen, Anfrage senden, Event genießen.
          </p>
        </div>

      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
