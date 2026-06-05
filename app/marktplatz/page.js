export const metadata = {
  title: 'Marktplatz – Alle Eventangebote',
  description: 'Alle Imbisswagen, Fahrgeschäfte, Hüpfburgen, Toilettenwagen und mehr auf einen Blick. Sicher buchen auf Festly.',
}

import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import ListingCard from '@/components/ListingCard'

const PAGE_SIZE = 24

function param(v) {
  return Array.isArray(v) ? v[0] : v
}

export default async function MarktplatzPage({ searchParams }) {
  const sp      = await searchParams
  const seite   = Math.max(1, parseInt(param(sp?.seite) ?? '1', 10) || 1)
  const from    = (seite - 1) * PAGE_SIZE
  const to      = from + PAGE_SIZE - 1

  const supabase = await createSupabaseServer()

  const { data, error, count } = await supabase
    .from('listings')
    .select('id, title, category, region, price_cents, price_model, photos', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) console.error('[Marktplatz] Fehler:', error)
  const listings   = data ?? []
  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1

  return (
    <main className="flex-1 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-6">
          Alle Angebote
        </h1>

        {listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">Keine Angebote gefunden.</p>
            <Link href="/" className="text-sm gradient-text font-medium hover:opacity-80 transition-opacity">
              Zurück zur Startseite
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-10">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>

            {/* Paginierung */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 pb-12">
                {seite > 1 && (
                  <Link
                    href={`/marktplatz?seite=${seite - 1}`}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    ← Zurück
                  </Link>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - seite) <= 2 || p === 1 || p === totalPages)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={`/marktplatz?seite=${p}`}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          p === seite
                            ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                {seite < totalPages && (
                  <Link
                    href={`/marktplatz?seite=${seite + 1}`}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Weiter →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
