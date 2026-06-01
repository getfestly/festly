'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN } from '@/lib/constants'
import { PRICING_MODELS } from '@/lib/pricing'
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
        .from('listings').select('*').eq('id', id).eq('provider_id', user.id).single()
      if (!listing) { router.replace('/anbieter/listings'); return }

      setUser(user)

      const pricingModel = listing.pricing_model ?? 'flat_day'
      // Für alte Listings ohne pricing_model: price_cents → base_price_euro
      const basePriceEuro = listing.base_price_cents != null
        ? (listing.base_price_cents / 100).toFixed(2)
        : (listing.price_cents ? (listing.price_cents / 100).toFixed(2) : '')

      setForm({
        title: listing.title,
        description: listing.description ?? '',
        category: listing.category,
        region: listing.region ?? '',
        photos: listing.photos ?? [],
        pricing_model: pricingModel,
        base_price_euro: basePriceEuro,
        price_per_unit_euro: listing.price_per_unit_cents != null
          ? (listing.price_per_unit_cents / 100).toFixed(2) : '',
        included_quantity: listing.included_quantity != null
          ? String(listing.included_quantity) : '',
        min_quantity: listing.min_quantity != null
          ? String(listing.min_quantity) : '',
        unit_label: listing.unit_label ?? '',
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
        .from('listing-photos').upload(path, photo)
      if (uploadError) {
        setError(`Foto-Upload fehlgeschlagen: ${uploadError.message}`)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
      photos = [urlData.publicUrl, ...photos].slice(0, 5)
    }

    const toEuroCents = (v) => v ? Math.round(parseFloat(v) * 100) : null
    const toInt = (v) => v ? parseInt(v, 10) : null

    const base_price_cents     = toEuroCents(form.base_price_euro)
    const price_per_unit_cents = toEuroCents(form.price_per_unit_euro)
    const included_quantity    = toInt(form.included_quantity)
    const min_quantity         = toInt(form.min_quantity)

    let price_cents = 0
    switch (form.pricing_model) {
      case 'flat_day':           price_cents = base_price_cents ?? 0; break
      case 'per_person':         price_cents = price_per_unit_cents ?? 0; break
      case 'base_plus_quantity': price_cents = base_price_cents ?? 0; break
      case 'hourly':             price_cents = base_price_cents ?? price_per_unit_cents ?? 0; break
      case 'on_request':         price_cents = 0; break
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({
        title: form.title,
        description: form.description || null,
        category: form.category,
        pricing_model: form.pricing_model,
        price_cents,
        base_price_cents,
        price_per_unit_cents,
        included_quantity,
        min_quantity,
        unit_label: form.unit_label || null,
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
  const pm = form.pricing_model

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorie *</label>
            <select required value={form.category} onChange={set('category')} className={inputCls}>
              {KATEGORIEN.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          {/* Preismodell */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Preismodell *</label>
            <select value={pm} onChange={set('pricing_model')} className={inputCls}>
              {PRICING_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {pm === 'flat_day' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Preis pro Tag (€) *</label>
              <input
                type="number" required min="0.01" step="0.01"
                value={form.base_price_euro} onChange={set('base_price_euro')}
                placeholder="800.00"
                className={inputCls}
              />
            </div>
          )}

          {pm === 'per_person' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preis pro Person (€) *</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  value={form.price_per_unit_euro} onChange={set('price_per_unit_euro')}
                  placeholder="12.00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mindestpersonenzahl</label>
                <input
                  type="number" min="1" step="1"
                  value={form.min_quantity} onChange={set('min_quantity')}
                  placeholder="50"
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {pm === 'base_plus_quantity' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Grundpreis (€) *</label>
                  <input
                    type="number" required min="0.01" step="0.01"
                    value={form.base_price_euro} onChange={set('base_price_euro')}
                    placeholder="350.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Inkludierte Menge *</label>
                  <input
                    type="number" required min="1" step="1"
                    value={form.included_quantity} onChange={set('included_quantity')}
                    placeholder="500"
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Preis je weitere Einheit (€)</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={form.price_per_unit_euro} onChange={set('price_per_unit_euro')}
                    placeholder="0.80"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Einheit</label>
                  <input
                    type="text"
                    value={form.unit_label} onChange={set('unit_label')}
                    placeholder="Stück"
                    className={inputCls}
                  />
                </div>
              </div>
            </>
          )}

          {pm === 'hourly' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Grundpreis (€)</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={form.base_price_euro} onChange={set('base_price_euro')}
                    placeholder="200.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Inkludierte Stunden</label>
                  <input
                    type="number" min="0" step="1"
                    value={form.included_quantity} onChange={set('included_quantity')}
                    placeholder="2"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Preis je weitere Stunde (€) *</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  value={form.price_per_unit_euro} onChange={set('price_per_unit_euro')}
                  placeholder="80.00"
                  className={inputCls}
                />
              </div>
            </>
          )}

          {pm === 'on_request' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-500">
                Kunden können eine Anfrage senden — du nennst ihnen den Preis individuell.
              </p>
            </div>
          )}

          {/* Sonstige Felder */}
          <div className="border-t border-gray-100 pt-5">
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
