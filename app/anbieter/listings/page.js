'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIE_LABEL } from '@/lib/constants'
import Nav from '@/components/Nav'

export default function AnbieterListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'provider') { router.replace('/mein-bereich'); return }

      const { data } = await supabase
        .from('listings')
        .select('id, title, category, price_cents, region, is_active, created_at')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
      setListings(data ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  async function toggleAktiv(id, aktuell) {
    await supabase.from('listings').update({ is_active: !aktuell }).eq('id', id)
    setListings((l) => l.map((x) => x.id === id ? { ...x, is_active: !aktuell } : x))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meine Angebote</h1>
          <Link
            href="/anbieter/listings/neu"
            className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            + Neues Angebot
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🎪
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Noch keine Angebote</h3>
            <p className="text-gray-500 text-sm mb-6">
              Erstelle dein erstes Angebot und werde auf dem Marktplatz gefunden.
            </p>
            <Link
              href="/anbieter/listings/neu"
              className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Erstes Angebot erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between gap-4 transition-opacity ${
                  listing.is_active ? '' : 'opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">
                      {KATEGORIE_LABEL[listing.category] ?? listing.category}
                    </span>
                    {!listing.is_active && (
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                        Inaktiv
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {(listing.price_cents / 100).toLocaleString('de-DE', {
                      style: 'currency', currency: 'EUR',
                    })}
                    {listing.region ? ` · ${listing.region}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/anbieter/listings/${listing.id}/bearbeiten`}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => toggleAktiv(listing.id, listing.is_active)}
                    className={`text-sm border rounded-lg px-3 py-1.5 transition-colors ${
                      listing.is_active
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-green-200 text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {listing.is_active ? 'Deaktivieren' : 'Reaktivieren'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
