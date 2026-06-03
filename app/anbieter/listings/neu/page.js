'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KATEGORIEN, KATEGORIEN_FLAT, VEHICLE_TYPES } from '@/lib/constants'
import { PRICING_MODELS } from '@/lib/pricing'
import Nav from '@/components/Nav'

const MAX_PHOTOS = 10

// ── Spracheingabe-Hook ────────────────────────────────────────────────────────
function useMic(onFinal) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const supported = typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  const toggle = useCallback(() => {
    if (!supported) return
    if (listening) { recRef.current?.stop(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'de-DE'
    rec.continuous = false
    rec.interimResults = true
    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join('')
      if (e.results[e.results.length - 1].isFinal) onFinal(t)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recRef.current = rec
    setListening(true)
  }, [listening, onFinal, supported])

  return { toggle, listening, supported }
}

function MicBtn({ onResult, className = '' }) {
  const { toggle, listening, supported } = useMic(onResult)
  if (!supported) return null
  return (
    <button
      type="button" onClick={toggle}
      title={listening ? 'Aufnahme stoppen' : 'Spracheingabe'}
      className={`p-2 rounded-lg text-sm transition-colors ${
        listening
          ? 'bg-red-100 text-red-600 animate-pulse'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      } ${className}`}
    >
      🎙️
    </button>
  )
}

export default function NeuesListingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'fahrgeschaefte',
    subcategory: '',
    vehicle_type: '',
    region: '',
    price_model: 'flat',
    priceEuro: '',
    price_unit_label: '',
  })
  const [photos, setPhotos]     = useState([])
  const [previews, setPreviews] = useState([])
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const [user, setUser]         = useState(null)
  const [profile, setProfile]   = useState(null)

  // KI-Modal
  const [aiModal, setAiModal] = useState({ open: false, keywords: '', loading: false, error: null })

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profileData } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      setUser(user)
      setProfile(profileData)
    }
    check()
  }, [router])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Kategorie-Wechsel: Subkat zurücksetzen
  function handleCategoryChange(e) {
    setForm((f) => ({ ...f, category: e.target.value, subcategory: '' }))
  }

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files ?? [])
    const toAdd = files.slice(0, MAX_PHOTOS - photos.length)
    setPhotos((p) => [...p, ...toAdd])
    setPreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removePhoto(i) {
    URL.revokeObjectURL(previews[i])
    setPhotos((p) => p.filter((_, idx) => idx !== i))
    setPreviews((p) => p.filter((_, idx) => idx !== i))
  }

  // KI-Beschreibung generieren
  async function handleAiGenerate() {
    setAiModal((m) => ({ ...m, loading: true, error: null }))
    const catLabel = KATEGORIEN.find((k) => k.id === form.category)?.label ?? form.category
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: aiModal.keywords, category: catLabel }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAiModal((m) => ({ ...m, loading: false, error: data.error ?? 'Fehler' }))
        return
      }
      setForm((f) => ({ ...f, description: data.text }))
      setAiModal({ open: false, keywords: '', loading: false, error: null })
    } catch {
      setAiModal((m) => ({ ...m, loading: false, error: 'Netzwerkfehler.' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const uploadedUrls = []
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i]
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `listings/${user.id}/${Date.now()}_${i}_${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('listing-photos').upload(path, file)
      if (uploadError) {
        setError(`Foto-Upload fehlgeschlagen: ${uploadError.message}`)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
      uploadedUrls.push(urlData.publicUrl)
    }

    const price_cents = form.price_model === 'on_request'
      ? 0
      : Math.round(parseFloat(form.priceEuro) * 100)

    if (profile?.role === 'customer') {
      await supabase.from('profiles').update({ role: 'provider' }).eq('id', user.id)
    }

    const { error: insertError } = await supabase.from('listings').insert({
      provider_id:      user.id,
      title:            form.title,
      description:      form.description || null,
      category:         form.category,
      subcategory:      form.subcategory || null,
      vehicle_type:     form.vehicle_type || null,
      price_model:      form.price_model,
      price_cents,
      price_unit_label: form.price_unit_label || null,
      region:           form.region || null,
      photos:           uploadedUrls,
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

  const PRICE_CONFIG = {
    flat:       { label: 'Preis pro Tag (€) *',    placeholder: '800.00', unitPlaceholder: null },
    per_person: { label: 'Preis pro Person (€) *', placeholder: '12.00',  unitPlaceholder: 'Person' },
    flat_plus:  { label: 'Grundpreis (€) *',       placeholder: '350.00', unitPlaceholder: 'Toilettenwagen' },
    hourly:     { label: 'Preis pro Stunde (€) *', placeholder: '80.00',  unitPlaceholder: 'Stunde' },
  }
  const cfg = PRICE_CONFIG[pm]

  // Subkategorien zur gewählten Oberkategorie
  const selectedKat  = KATEGORIEN.find((k) => k.id === form.category)
  const subcats      = selectedKat?.subcategories ?? []

  // Suggested price placeholder aus gewählter Subkategorie
  const selectedSub  = subcats.find((s) => s.id === form.subcategory)
  const suggestedEur = selectedSub
    ? (selectedSub.suggested_price_cents / 100).toFixed(0)
    : null
  const pricePlaceholder = suggestedEur ? `z.B. ${suggestedEur}` : (cfg?.placeholder ?? '0.00')

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-lg mx-auto px-4 py-8">
        <Link href="/anbieter/listings" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">
          ← Zurück zu meinen Angeboten
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Neues Angebot erstellen</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">

          {/* Titel + Mic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel *</label>
            <div className="flex gap-2">
              <input
                type="text" required value={form.title}
                onChange={set('title')}
                autoComplete="off"
                placeholder="z.B. DJ-Set für bis zu 200 Personen"
                className={inputCls}
              />
              <MicBtn onResult={(t) => setForm((f) => ({ ...f, title: f.title + t }))} />
            </div>
          </div>

          {/* Beschreibung + KI + Mic */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAiModal((m) => ({ ...m, open: true }))}
                  className="text-xs px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors font-medium"
                >
                  ✨ Mit KI erstellen
                </button>
                <MicBtn onResult={(t) => setForm((f) => ({ ...f, description: f.description + t }))} />
              </div>
            </div>
            <textarea
              rows={4} value={form.description} onChange={set('description')}
              autoComplete="off"
              placeholder="Beschreibe deine Leistung, Ausstattung, besondere Merkmale …"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Oberkategorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategorie *</label>
            <select required value={form.category} onChange={handleCategoryChange} className={inputCls}>
              {KATEGORIEN_FLAT.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </div>

          {/* Unterkategorie (wenn vorhanden) */}
          {subcats.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Unterkategorie</label>
              <select value={form.subcategory} onChange={set('subcategory')} className={inputCls}>
                <option value="">— bitte wählen —</option>
                {subcats.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              {selectedSub && (
                <p className="text-xs text-gray-400 mt-1">
                  Richtwert: ca. {suggestedEur} € / Tag
                </p>
              )}
            </div>
          )}

          {/* Fahrzeugtyp (optional) */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fahrzeugtyp für Anlieferung</label>
            <select value={form.vehicle_type} onChange={set('vehicle_type')} className={inputCls}>
              <option value="">Bitte wählen (optional)</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              Wird für die automatische Fahrtkosten-Berechnung bei Buchungen verwendet.
            </p>
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

          {pm !== 'on_request' && cfg && (
            <div className={cfg.unitPlaceholder ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{cfg.label}</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  value={form.priceEuro} onChange={set('priceEuro')}
                  placeholder={pricePlaceholder}
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

          {pm !== 'on_request' && (
            <p className="text-xs text-gray-400 -mt-2">
              Bei Buchung wird eine Plattformgebühr fällig. Deine Auszahlung siehst du bei jeder Anfrage.
            </p>
          )}

          {/* Region */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
            <input
              type="text" value={form.region} onChange={set('region')}
              autoComplete="address-level1"
              placeholder="z.B. Bayern, Berlin, deutschlandweit"
              className={inputCls}
            />
          </div>

          {/* Foto-Upload */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Fotos (optional)</label>
              <span className="text-xs text-gray-400">{photos.length} / {MAX_PHOTOS}</span>
            </div>
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button" onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <input
                type="file" accept="image/*" multiple
                onChange={handlePhotoChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
              />
            )}
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

      {/* KI-Beschreibungs-Modal */}
      {aiModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">✨ Beschreibung mit KI</h2>
            <p className="text-sm text-gray-500 mb-4">
              Beschreibe dein Angebot in 3–5 Stichworten.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={aiModal.keywords}
                onChange={(e) => setAiModal((m) => ({ ...m, keywords: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && !aiModal.loading && handleAiGenerate()}
                placeholder="z.B. DJ, House-Musik, 200 Personen"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                autoFocus
              />
              <MicBtn onResult={(t) => setAiModal((m) => ({ ...m, keywords: m.keywords + t }))} />
            </div>

            {aiModal.error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
                {aiModal.error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAiGenerate}
                disabled={aiModal.loading || !aiModal.keywords.trim()}
                className="flex-1 bg-purple-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {aiModal.loading ? 'Generiere …' : 'Erstellen'}
              </button>
              <button
                onClick={() => setAiModal({ open: false, keywords: '', loading: false, error: null })}
                className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
