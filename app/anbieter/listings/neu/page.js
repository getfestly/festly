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
    price_model: 'flat',
    priceEuro: '',
    price_unit_label: '',
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

    const price_cents = form.price_model === 'on_request'
      ? 0
      : Math.round(parseFloat(form.priceEuro) * 100)

    const { error: insertError } = await supabase.from('listings').insert({
      provider_id: user.id,
      title: form.title,
      description: form.description || null,
      category: form.category,
      price_model: form.price_model,
      price_cents,
      price_unit_label: form.price_unit_label || null,
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
  const pm = form.price_model

  // Preisfeldkonfiguration je Modell
  const PRICE_CONFIG = {
    flat:       { label: 'Preis pro Tag (€) *',        placeholder: '800.00', unitPlaceholder: null },
    per_person: { label: 'Preis pro Person (€) *',     placeholder: '12.00',  unitPlaceholder: 'Person' },
    flat_plus:  { label: 'Grundpreis (€) *',           placeholder: '350.00', unitPlaceholder: 'Toilettenwagen' },
    hourly:     { label: 'Preis pro Stunde (€) *',     placeholder: '80.00',  unitPlaceholder: 'Stunde' },
  }
  const cfg = PRICE_CONFIG[pm]

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Link href="/anbieter/listings" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zu meinen Angeboten
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Neues Angebot erstellen</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

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
            <select value={pm} onChange={set('price_model')} className={inputCls}>
              {PRICING_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Preisfelder — nur für Modelle mit Preis */}
          {pm !== 'on_request' && cfg && (
            <div className={cfg.unitPlaceholder ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{cfg.label}</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  value={form.priceEuro} onChange={set('priceEuro')}
                  placeholder={cfg.placeholder}
                  className={inputCls}
                />
              </div>
              {cfg.unitPlaceholder && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mengenbezeichnung</label>
                  <input
                    type="text"
                    value={form.price_unit_label} onChange={set('price_unit_label')}
                    placeholder={cfg.unitPlaceholder}
                    className={inputCls}
                  />
                </div>
              )}
            </div>
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
