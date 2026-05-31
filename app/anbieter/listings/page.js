'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIE_LABEL } from '@/lib/constants'

export default function AnbieterListingsPage() {
  const router = useRouter()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'provider') { router.replace('/mein-bereich'); return }

      setUserId(user.id)

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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/mein-bereich" className="text-sm text-gray-400 hover:text-gray-600 block mb-1">
              ← Mein Bereich
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Meine Angebote</h1>
          </div>
          <Link
            href="/anbieter/listings/neu"
            className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            + Neues Angebot
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 mb-4">Du hast noch keine Angebote.</p>
            <Link href="/anbieter/listings/neu" className="text-gray-900 font-medium underline">
              Erstes Angebot erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className={`bg-white rounded-2xl border p-5 flex items-start justify-between gap-4 transition-opacity ${
                  listing.is_active ? 'border-gray-100' : 'border-gray-100 opacity-50'
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
      </div>
    </main>
  )
}
