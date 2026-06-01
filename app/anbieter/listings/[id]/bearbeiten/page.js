'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN } from '@/lib/constants'
import Nav from '@/components/Nav'

export default function BearbeitenPage() {
  const router = useRouter()
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: listing } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('provider_id', user.id)
        .single()

      if (!listing) { router.replace('/anbieter/listings'); return }

      setUser(user)
      setForm({
        title: listing.title,
        description: listing.description ?? '',
        category: listing.category,
        priceEuro: (listing.price_cents / 100).toFixed(2),
        region: listing.region ?? '',
        photos: listing.photos ?? [],
      })
    }
    load()
  }, [id, router])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let photos = form.photos

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
      photos = [urlData.publicUrl, ...photos].slice(0, 5)
    }

    const price_cents = Math.round(parseFloat(form.priceEuro) * 100)

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title: form.title,
        description: form.description || null,
        category: form.category,
        price_cents,
        region: form.region || null,
        photos,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.push('/anbieter/listings')
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <main className="flex items-center justify-center h-48">
          <p className="text-gray-400">Laden …</p>
        </main>
      </div>
    )
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Link href="/anbieter/listings" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zu meinen Angeboten
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Angebot bearbeiten</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel *</label>
            <input
              type="text" required value={form.title} onChange={set('title')}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibung</label>
            <textarea
              rows={4} value={form.description} onChange={set('description')}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorie *</label>
              <select required value={form.category} onChange={set('category')} className={inputCls}>
                {KATEGORIEN.map((k) => (
                  <option key={k.value} value={k.value}>{k.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preis (€) *</label>
              <input
                type="number" required min="1" step="0.01" value={form.priceEuro} onChange={set('priceEuro')}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
            <input
              type="text" value={form.region} onChange={set('region')}
              className={inputCls}
            />
          </div>

          {form.photos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vorhandene Fotos</label>
              <div className="flex gap-2 flex-wrap">
                {form.photos.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {form.photos.length > 0 ? 'Weiteres Foto hinzufügen' : 'Foto (optional)'}
            </label>
            <input
              type="file" accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert …' : 'Änderungen speichern'}
          </button>
        </form>
      </main>
    </div>
  )
}
