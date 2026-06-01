'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'customer' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!termsAccepted) {
      setError('Bitte akzeptiere die AGB und Datenschutzerklärung.')
      return
    }
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (authError) { setError(authError.message); setLoading(false); return }

    const user = data.user
    if (!user) { setError('Registrierung fehlgeschlagen.'); setLoading(false); return }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      display_name: form.displayName,
      role: form.role,
      accepted_terms_at: new Date().toISOString(),
    })

    if (profileError) {
      if (!data.session) {
        setEmailSent(true)
      } else {
        setError(profileError.message)
      }
      setLoading(false)
      return
    }

    router.push('/mein-bereich')
  }

  if (emailSent) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">E-Mail bestätigen</h1>
          <p className="text-gray-500 mb-6">
            Wir haben dir einen Bestätigungslink geschickt. Nach der Bestätigung kannst du dich{' '}
            <Link href="/login" className="underline text-gray-900">einloggen</Link>.
          </p>
          <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            Entwicklertipp: In den Supabase-Einstellungen unter Authentication → Providers → Email
            kannst du &ldquo;Confirm email&rdquo; deaktivieren, damit das Profil sofort angelegt wird.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Registrieren</h1>
        <p className="text-gray-500 mb-8">Erstelle dein Festly-Konto</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Anzeigename</label>
            <input
              type="text" required value={form.displayName} onChange={set('displayName')}
              placeholder="Dein Name oder Firmenname"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
            <input
              type="email" required value={form.email} onChange={set('email')}
              placeholder="name@beispiel.de"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Passwort</label>
            <input
              type="password" required minLength={6} value={form.password} onChange={set('password')}
              placeholder="Mindestens 6 Zeichen"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ich bin …</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'customer', label: 'Kunde' },
                { value: 'provider', label: 'Anbieter' },
              ].map(({ value, label }) => (
                <button
                  key={value} type="button"
                  onClick={() => setForm((f) => ({ ...f, role: value }))}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
                    form.role === value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-gray-900"
              />
              <span className="text-sm text-gray-600">
                Ich habe die{' '}
                <Link href="/agb" target="_blank" className="underline text-gray-900 hover:text-gray-700">AGB</Link>
                {' '}und{' '}
                <Link href="/datenschutz" target="_blank" className="underline text-gray-900 hover:text-gray-700">Datenschutzerklärung</Link>
                {' '}gelesen und akzeptiere sie.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Wird registriert …' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Bereits ein Konto?{' '}
          <Link href="/login" className="text-gray-900 font-medium underline">Einloggen</Link>
        </p>
      </div>
    </main>
  )
}
