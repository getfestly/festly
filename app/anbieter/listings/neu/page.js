'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN } from '@/lib/constants'

export default function NeuesListingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '', category: 'food', priceEuro: '', region: '',
  })
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'provider') { router.replace('/mein-bereich'); return }
      setUser(user)
    }
    check()
  }, [router])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let photos = []

    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(path, photo)

      if (uploadError) {
        setError(`Foto-Upload fehlgeschlagen: ${uploadError.message}`)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
      photos = [urlData.publicUrl]
    }

    const price_cents = Math.round(parseFloat(form.priceEuro) * 100)

    const { error: insertError } = await supabase.from('listings').insert({
      provider_id: user.id,
      title: form.title,
      description: form.description || null,
      category: form.category,
      price_cents,
      region: form.region || null,
      photos,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/anbieter/listings')
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Laden …</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <Link href="/anbieter/listings" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zu meinen Angeboten
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Neues Angebot erstellen</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input
              type="text" required value={form.title} onChange={set('title')}
              placeholder="z.B. DJ-Set für bis zu 200 Personen"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              rows={4} value={form.description} onChange={set('description')}
              placeholder="Beschreibe deine Leistung, Ausstattung, besondere Merkmale …"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
              <select
                required value={form.category} onChange={set('category')}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                {KATEGORIEN.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preis (€) *</label>
              <input
                type="number" required min="1" step="0.01" value={form.priceEuro} onChange={set('priceEuro')}
                placeholder="250.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <input
              type="text" value={form.region} onChange={set('region')}
              placeholder="z.B. Bayern, Berlin, deutschlandweit"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foto (optional)</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <input
              type="file" accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              Benötigt Storage-Bucket &ldquo;listing-photos&rdquo; in Supabase (siehe FORTSCHRITT.md).
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert …' : 'Angebot erstellen'}
          </button>
        </form>
      </div>
    </main>
  )
}
