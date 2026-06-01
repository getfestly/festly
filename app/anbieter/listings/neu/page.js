'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN } from '@/lib/constants'
import { PRICING_MODELS } from '@/lib/pricing'
import Nav from '@/components/Nav'

export default function NeuesListingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '', description: '', category: 'food', region: '',
    pricing_model: 'flat_day',
    base_price_euro: '',
    price_per_unit_euro: '',
    included_quantity: '',
    min_quantity: '',
    unit_label: '',
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
        .from('listing-photos').upload(path, photo)
      if (uploadError) {
        setError(`Foto-Upload fehlgeschlagen: ${uploadError.message}`)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
      photos = [urlData.publicUrl]
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

    const { error: insertError } = await supabase.from('listings').insert({
      provider_id: user.id,
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
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/anbieter/listings')
  }

  if (!user) {
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Neues Angebot erstellen</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

          {/* Basis-Felder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel *</label>
            <input
              type="text" required value={form.title} onChange={set('title')}
              placeholder="z.B. DJ-Set für bis zu 200 Personen"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Beschreibung</label>
            <textarea
              rows={4} value={form.description} onChange={set('description')}
              placeholder="Beschreibe deine Leistung, Ausstattung, besondere Merkmale …"
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

          {/* Pauschale pro Tag */}
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

          {/* Pro Person */}
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

          {/* Pauschale + Menge */}
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

          {/* Stundensatz */}
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

          {/* Auf Anfrage */}
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
              placeholder="z.B. Bayern, Berlin, deutschlandweit"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto (optional)</label>
            <input
              type="file" accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1">
              Benötigt Storage-Bucket &ldquo;listing-photos&rdquo; in Supabase.
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird gespeichert …' : 'Angebot erstellen'}
          </button>
        </form>
      </main>
    </div>
  )
}
